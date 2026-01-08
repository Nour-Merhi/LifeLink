<?php

namespace App\Http\Controllers;

use App\Models\MobilePhlebotomist;
use App\Models\HomeAppointment;
use App\Models\Message;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NurseDashboardController extends Controller
{
    /**
     * Get nurse dashboard data (home page)
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            // Check if user is an Admin or Phlebotomist (nurse)
            $userRole = strtolower($user->role ?? '');
            if ($userRole !== 'phlebotomist' && $userRole !== 'admin') {
                Log::warning('Unauthorized access attempt to nurse dashboard', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'user_role' => $user->role
                ]);
                return response()->json([
                    'message' => 'Unauthorized. Only admins and phlebotomists can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            // For admins, they can view all appointments
            // For phlebotomists, they can only view their own appointments
            $phlebotomistId = null;
            $phlebotomist = null;
            
            if ($userRole === 'phlebotomist') {
                // Get mobile phlebotomist record for phlebotomists only
                $phlebotomist = MobilePhlebotomist::where('user_id', $user->id)
                    ->with(['hospital', 'user'])
                    ->first();
                
                if (!$phlebotomist) {
                    return response()->json([
                        'message' => 'Phlebotomist record not found. Please complete your profile registration.',
                        'error' => 'phlebotomist_not_found'
                    ], 404);
                }
                
                $phlebotomistId = $phlebotomist->id;
            }

            $today = Carbon::today();
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth = Carbon::now()->endOfMonth();

            // Get all home appointments
            // Admins can see all appointments, phlebotomists see only their own
            $appointmentsQuery = HomeAppointment::with([
                'donor.user',
                'donor.bloodType',
                'hospital',
                'appointment',
                'mobilePhlebotomist.user'
            ]);
            
            if ($phlebotomistId !== null) {
                // Filter by phlebotomist for nurses
                $appointmentsQuery->where('phlebotomist_id', $phlebotomistId);
            }
            
            $allAppointments = $appointmentsQuery->orderBy('created_at', 'desc')->get();

            // Calculate metrics
            // 1. Upcoming Home Visits
            $upcomingAppointments = $allAppointments->filter(function($appt) use ($today) {
                $appointmentDate = null;
                if ($appt->appointment && $appt->appointment->appointment_date) {
                    $appointmentDate = Carbon::parse($appt->appointment->appointment_date);
                }
                return $appt->state === 'pending' && 
                       $appointmentDate && 
                       $appointmentDate->gte($today);
            });

            $nextAppointment = $upcomingAppointments->sortBy(function($appt) {
                if ($appt->appointment && $appt->appointment->appointment_date) {
                    return Carbon::parse($appt->appointment->appointment_date)->timestamp;
                }
                return PHP_INT_MAX;
            })->first();

            $nextAppointmentTime = 'N/A';
            if ($nextAppointment && $nextAppointment->appointment && $nextAppointment->appointment->appointment_date) {
                $appointmentDate = Carbon::parse($nextAppointment->appointment->appointment_date);
                $time = $nextAppointment->appointment_time ?? $nextAppointment->appointment->appointment_time ?? '';
                
                if ($appointmentDate->isToday()) {
                    $nextAppointmentTime = 'Today ' . ($time ?: $appointmentDate->format('g:i A'));
                } else {
                    $nextAppointmentTime = $appointmentDate->format('M d') . ($time ? ' ' . $time : '');
                }
            }

            // 2. Completed Donations
            $completedAppointments = $allAppointments->where('state', 'completed');
            $completedThisMonth = $completedAppointments->filter(function($appt) use ($startOfMonth, $endOfMonth) {
                return $appt->updated_at && 
                       $appt->updated_at->gte($startOfMonth) && 
                       $appt->updated_at->lte($endOfMonth);
            });

            // 3. Pending Requests
            $pendingAppointments = $allAppointments->where('state', 'pending');
            // Count urgent (appointments today or in the past that are still pending)
            $urgentCount = $pendingAppointments->filter(function($appt) use ($today) {
                $appointmentDate = null;
                if ($appt->appointment && $appt->appointment->appointment_date) {
                    $appointmentDate = Carbon::parse($appt->appointment->appointment_date);
                }
                return $appointmentDate && $appointmentDate->lte($today);
            })->count();

            // 4. Hospital Assigned
            $hospitalName = 'N/A';
            if ($phlebotomist && $phlebotomist->hospital) {
                $hospitalName = $phlebotomist->hospital->name;
            } elseif ($userRole === 'admin') {
                // For admins, show "All Hospitals" or you can implement a different logic
                $hospitalName = 'All Hospitals';
            }

            // Format appointments for table
            $appointmentsList = $allAppointments->map(function($appt) {
                $donor = $appt->donor;
                $donorUser = $donor ? $donor->user : null;
                
                $donorName = 'N/A';
                $donorPhone = '';
                if ($donorUser) {
                    $firstName = $donorUser->first_name ?? '';
                    $middleName = $donorUser->middle_name ?? '';
                    $lastName = $donorUser->last_name ?? '';
                    $donorName = trim("{$firstName} {$middleName} {$lastName}");
                    $donorPhone = $donorUser->phone_nb ?? '';
                }

                $donorDisplay = $donorPhone ? "{$donorName} (+{$donorPhone})" : $donorName;
                
                $bloodType = $donor && $donor->bloodType 
                    ? $donor->bloodType->type . $donor->bloodType->rh_factor 
                    : 'N/A';

                $appointmentDate = null;
                $appointmentTime = '';
                if ($appt->appointment && $appt->appointment->appointment_date) {
                    $appointmentDate = Carbon::parse($appt->appointment->appointment_date);
                }
                $appointmentTime = $appt->appointment_time ?? 
                                  ($appt->appointment ? ($appt->appointment->appointment_time ?? '') : '');

                $dateDisplay = 'N/A';
                if ($appointmentDate) {
                    $dateDisplay = $appointmentDate->format('M d, Y');
                    if ($appointmentTime) {
                        $dateDisplay .= ' ' . $appointmentTime;
                    }
                }

                return [
                    'id' => $appt->id,
                    'code' => $appt->code ?? 'N/A',
                    'donor' => $donorDisplay,
                    'address' => $appt->address ?? 'N/A',
                    'status' => ucfirst($appt->state ?? 'pending'),
                    'bloodType' => $bloodType,
                    'date' => $dateDisplay,
                ];
            });

            return response()->json([
                'metrics' => [
                    'upcoming_home_visits' => [
                        'count' => $upcomingAppointments->count(),
                        'next_appointment' => $nextAppointmentTime,
                    ],
                    'completed_donations' => [
                        'total' => $completedAppointments->count(),
                        'this_month' => $completedThisMonth->count(),
                    ],
                    'pending_requests' => [
                        'count' => $pendingAppointments->count(),
                        'urgent' => $urgentCount,
                    ],
                    'hospital_assigned' => [
                        'name' => $hospitalName,
                    ],
                ],
                'appointments' => $appointmentsList->values(),
                'total_appointments' => $appointmentsList->count(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching nurse dashboard:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch nurse dashboard data',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get my appointments for the logged-in phlebotomist
     */
    public function myAppointments(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            // Check if user is an Admin or Phlebotomist (nurse)
            $userRole = strtolower($user->role ?? '');
            if ($userRole !== 'phlebotomist' && $userRole !== 'admin') {
                Log::warning('Unauthorized access attempt to nurse appointments', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'user_role' => $user->role
                ]);
                return response()->json([
                    'message' => 'Unauthorized. Only admins and phlebotomists can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            // For phlebotomists, get their mobile phlebotomist record
            $phlebotomistId = null;
            
            if ($userRole === 'phlebotomist') {
                $phlebotomist = MobilePhlebotomist::where('user_id', $user->id)->first();
                
                if (!$phlebotomist) {
                    return response()->json([
                        'message' => 'Phlebotomist record not found. Please complete your profile registration.',
                        'error' => 'phlebotomist_not_found'
                    ], 404);
                }
                
                $phlebotomistId = $phlebotomist->id;
            }

            // Get home appointments with relationships
            $appointmentsQuery = HomeAppointment::with([
                'donor.user',
                'donor.bloodType',
                'appointment'
            ]);
            
            if ($phlebotomistId !== null) {
                // Filter by phlebotomist for nurses
                $appointmentsQuery->where('phlebotomist_id', $phlebotomistId);
            }
            
            // Order by appointment date (most recent first)
            $appointments = $appointmentsQuery->get()
                ->sortByDesc(function($appt) {
                    if ($appt->appointment && $appt->appointment->appointment_date) {
                        return Carbon::parse($appt->appointment->appointment_date)->timestamp;
                    }
                    return 0;
                })
                ->values();

            // Format appointments for frontend
            $formattedAppointments = $appointments->map(function($appt) {
                $donor = $appt->donor;
                $donorUser = $donor ? $donor->user : null;
                
                // Donor name
                $donorName = 'N/A';
                if ($donorUser) {
                    $firstName = $donorUser->first_name ?? '';
                    $middleName = $donorUser->middle_name ?? '';
                    $lastName = $donorUser->last_name ?? '';
                    $donorName = trim("{$firstName} {$middleName} {$lastName}") ?: 'N/A';
                }

                // Gender
                $gender = $donor ? ($donor->gender ?? 'N/A') : 'N/A';

                // Blood type
                $bloodType = 'N/A';
                if ($donor && $donor->bloodType) {
                    $type = $donor->bloodType->type ?? '';
                    $rhFactor = $donor->bloodType->rh_factor ?? '';
                    $bloodType = $type . $rhFactor;
                }

                // Address
                $address = $appt->address ?? 'N/A';

                // Date
                $date = 'N/A';
                if ($appt->appointment && $appt->appointment->appointment_date) {
                    $date = Carbon::parse($appt->appointment->appointment_date)->format('Y-m-d');
                }

                // Time
                $time = 'N/A';
                $appointmentTime = $appt->appointment_time ?? null;
                if ($appointmentTime) {
                    try {
                        // Try to parse as time string (HH:MM:SS or HH:MM)
                        $timeObj = Carbon::createFromFormat('H:i:s', $appointmentTime);
                        $time = $timeObj->format('h:i A');
                    } catch (\Exception $e) {
                        try {
                            $timeObj = Carbon::createFromFormat('H:i', $appointmentTime);
                            $time = $timeObj->format('h:i A');
                        } catch (\Exception $e2) {
                            $time = $appointmentTime; // Fallback to original value
                        }
                    }
                } elseif ($appt->appointment && $appt->appointment->appointment_time) {
                    $appointmentTime = $appt->appointment->appointment_time;
                    try {
                        $timeObj = Carbon::createFromFormat('H:i:s', $appointmentTime);
                        $time = $timeObj->format('h:i A');
                    } catch (\Exception $e) {
                        try {
                            $timeObj = Carbon::createFromFormat('H:i', $appointmentTime);
                            $time = $timeObj->format('h:i A');
                        } catch (\Exception $e2) {
                            $time = $appointmentTime;
                        }
                    }
                }

                // Phone
                $phone = $donorUser ? ($donorUser->phone_nb ?? '') : '';

                // Emergency contact (prefer home_appointment fields, fallback to donor fields)
                $emergencyContact = '';
                $emergContactName = $appt->emerg_contact ?? ($donor ? ($donor->emergency_contact_name ?? '') : '');
                $emergContactPhone = $appt->emerg_phone ?? ($donor ? ($donor->emergency_contact_phone ?? '') : '');
                
                if ($emergContactName && $emergContactPhone) {
                    $emergencyContact = "{$emergContactName} - {$emergContactPhone}";
                } elseif ($emergContactName) {
                    $emergencyContact = $emergContactName;
                } elseif ($emergContactPhone) {
                    $emergencyContact = $emergContactPhone;
                }

                // Status - map database states to frontend status
                $state = strtolower($appt->state ?? 'pending');
                $status = 'Pending';
                if ($state === 'completed') {
                    $status = 'Completed';
                } elseif ($state === 'canceled' || $state === 'cancelled') {
                    $status = 'Cancelled';
                } else {
                    $status = 'Pending';
                }

                return [
                    'id' => $appt->id,
                    'donorName' => $donorName,
                    'gender' => $gender,
                    'bloodType' => $bloodType,
                    'address' => $address,
                    'date' => $date,
                    'time' => $time,
                    'phone' => $phone,
                    'emergencyContact' => $emergencyContact,
                    'status' => $status,
                ];
            });

            return response()->json([
                'appointments' => $formattedAppointments,
                'total' => $formattedAppointments->count(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching nurse appointments:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch appointments',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get donor requests (unassigned home appointments) for phlebotomists
     */
    public function donorRequests(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            // Check if user is an Admin or Phlebotomist (nurse)
            $userRole = strtolower($user->role ?? '');
            if ($userRole !== 'phlebotomist' && $userRole !== 'admin') {
                Log::warning('Unauthorized access attempt to donor requests', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'user_role' => $user->role
                ]);
                return response()->json([
                    'message' => 'Unauthorized. Only admins and phlebotomists can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            // Get mobile phlebotomist record for phlebotomists to get their hospital_id
            $hospitalId = null;
            
            if ($userRole === 'phlebotomist') {
                $phlebotomist = MobilePhlebotomist::where('user_id', $user->id)->first();
                
                if (!$phlebotomist) {
                    return response()->json([
                        'message' => 'Phlebotomist record not found. Please complete your profile registration.',
                        'error' => 'phlebotomist_not_found'
                    ], 404);
                }
                
                $hospitalId = $phlebotomist->hospital_id;
            }
            // For admins, they can see all requests (hospitalId remains null)

            // Get unassigned home appointments (phlebotomist_id is NULL and state is pending)
            $appointmentsQuery = HomeAppointment::with([
                'donor.user',
                'donor.bloodType',
                'appointment'
            ])
            ->whereNull('phlebotomist_id')
            ->where('state', 'pending');
            
            // Filter by hospital_id for phlebotomists (only show requests from their assigned hospital)
            if ($hospitalId !== null) {
                $appointmentsQuery->where('hospital_id', $hospitalId);
            }
            
            // Order by appointment date (earliest first - so urgent requests appear first)
            $appointments = $appointmentsQuery->get()
                ->sortBy(function($appt) {
                    if ($appt->appointment && $appt->appointment->appointment_date) {
                        return Carbon::parse($appt->appointment->appointment_date)->timestamp;
                    }
                    return PHP_INT_MAX;
                })
                ->values();

            // Format requests for frontend
            $formattedRequests = $appointments->map(function($appt) {
                $donor = $appt->donor;
                $donorUser = $donor ? $donor->user : null;
                
                // Donor name
                $donorName = 'N/A';
                if ($donorUser) {
                    $firstName = $donorUser->first_name ?? '';
                    $middleName = $donorUser->middle_name ?? '';
                    $lastName = $donorUser->last_name ?? '';
                    $donorName = trim("{$firstName} {$middleName} {$lastName}") ?: 'N/A';
                }

                // Gender
                $gender = $donor ? ($donor->gender ?? 'N/A') : 'N/A';

                // Blood type
                $bloodType = 'N/A';
                if ($donor && $donor->bloodType) {
                    $type = $donor->bloodType->type ?? '';
                    $rhFactor = $donor->bloodType->rh_factor ?? '';
                    $bloodType = $type . $rhFactor;
                }

                // Address
                $address = $appt->address ?? 'N/A';

                // Date
                $date = 'N/A';
                if ($appt->appointment && $appt->appointment->appointment_date) {
                    $date = Carbon::parse($appt->appointment->appointment_date)->format('Y-m-d');
                }

                // Time
                $time = 'N/A';
                $appointmentTime = $appt->appointment_time ?? null;
                if ($appointmentTime) {
                    try {
                        // Try to parse as time string (HH:MM:SS or HH:MM)
                        $timeObj = Carbon::createFromFormat('H:i:s', $appointmentTime);
                        $time = $timeObj->format('h:i A');
                    } catch (\Exception $e) {
                        try {
                            $timeObj = Carbon::createFromFormat('H:i', $appointmentTime);
                            $time = $timeObj->format('h:i A');
                        } catch (\Exception $e2) {
                            $time = $appointmentTime; // Fallback to original value
                        }
                    }
                } elseif ($appt->appointment && $appt->appointment->appointment_time) {
                    $appointmentTime = $appt->appointment->appointment_time;
                    try {
                        $timeObj = Carbon::createFromFormat('H:i:s', $appointmentTime);
                        $time = $timeObj->format('h:i A');
                    } catch (\Exception $e) {
                        try {
                            $timeObj = Carbon::createFromFormat('H:i', $appointmentTime);
                            $time = $timeObj->format('h:i A');
                        } catch (\Exception $e2) {
                            $time = $appointmentTime;
                        }
                    }
                }

                // Phone
                $phone = $donorUser ? ($donorUser->phone_nb ?? '') : '';

                // Emergency contact (prefer home_appointment fields, fallback to donor fields)
                $emergencyContact = '';
                $emergContactName = $appt->emerg_contact ?? ($donor ? ($donor->emergency_contact_name ?? '') : '');
                $emergContactPhone = $appt->emerg_phone ?? ($donor ? ($donor->emergency_contact_phone ?? '') : '');
                
                if ($emergContactName && $emergContactPhone) {
                    $emergencyContact = "{$emergContactName} - {$emergContactPhone}";
                } elseif ($emergContactName) {
                    $emergencyContact = $emergContactName;
                } elseif ($emergContactPhone) {
                    $emergencyContact = $emergContactPhone;
                }

                return [
                    'id' => $appt->id,
                    'donorName' => $donorName,
                    'gender' => $gender,
                    'bloodType' => $bloodType,
                    'address' => $address,
                    'date' => $date,
                    'time' => $time,
                    'phone' => $phone,
                    'emergencyContact' => $emergencyContact,
                ];
            });

            return response()->json([
                'requests' => $formattedRequests,
                'total' => $formattedRequests->count(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching donor requests:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch donor requests',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get hospital information for the logged-in phlebotomist
     */
    public function hospitalInfo(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            // Check if user is an Admin or Phlebotomist (nurse)
            $userRole = strtolower($user->role ?? '');
            if ($userRole !== 'phlebotomist' && $userRole !== 'admin') {
                Log::warning('Unauthorized access attempt to hospital info', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'user_role' => $user->role
                ]);
                return response()->json([
                    'message' => 'Unauthorized. Only admins and phlebotomists can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            // Get mobile phlebotomist record for phlebotomists to get their hospital_id
            $hospitalId = null;
            
            if ($userRole === 'phlebotomist') {
                $phlebotomist = MobilePhlebotomist::where('user_id', $user->id)->first();
                
                if (!$phlebotomist) {
                    return response()->json([
                        'message' => 'Phlebotomist record not found. Please complete your profile registration.',
                        'error' => 'phlebotomist_not_found'
                    ], 404);
                }
                
                $hospitalId = $phlebotomist->hospital_id;
            }

            // For admins, they need to specify which hospital, or we could return an error
            // For now, we'll return an error for admins as they should use the admin endpoint
            if ($hospitalId === null) {
                return response()->json([
                    'message' => 'Hospital not found. Please ensure you are assigned to a hospital.',
                    'error' => 'hospital_not_assigned'
                ], 404);
            }

            // Fetch hospital with relationships
            $hospital = \App\Models\Hospital::with(['healthCenterManager.user'])
                ->find($hospitalId);

            if (!$hospital) {
                return response()->json([
                    'message' => 'Hospital not found.',
                    'error' => 'hospital_not_found'
                ], 404);
            }

            // Format hospital data for frontend
            $hospitalData = [
                'id' => $hospital->id,
                'code' => $hospital->code ?? 'N/A',
                'name' => $hospital->name ?? 'N/A',
                'email' => $hospital->email ?? 'N/A',
                'phone_nb' => $hospital->phone_nb ?? 'N/A',
                'address' => $hospital->address ?? 'N/A',
                'latitude' => $hospital->latitude ?? null,
                'longitude' => $hospital->longitude ?? null,
                'status' => $hospital->status ?? 'unverified',
                'created_at' => $hospital->created_at ? $hospital->created_at->toISOString() : null,
            ];

            // Add health center manager information
            $manager = $hospital->healthCenterManager;
            if ($manager && $manager->user) {
                $managerUser = $manager->user;
                $firstName = $managerUser->first_name ?? '';
                $middleName = $managerUser->middle_name ?? '';
                $lastName = $managerUser->last_name ?? '';
                $managerName = trim("{$firstName} {$middleName} {$lastName}") ?: 'N/A';
                
                $hospitalData['health_center_manager'] = [
                    'id' => $manager->id,
                    'code' => $manager->code ?? 'N/A',
                    'position' => $manager->position ?? 'N/A',
                    'office_location' => $manager->office_location ?? 'N/A',
                    'start_time' => $manager->start_time ?? 'N/A',
                    'end_time' => $manager->end_time ?? 'N/A',
                    'user' => [
                        'id' => $managerUser->id,
                        'name' => $managerName,
                        'email' => $managerUser->email ?? 'N/A',
                        'phone_nb' => $managerUser->phone_nb ?? 'N/A',
                    ]
                ];
            } else {
                $hospitalData['health_center_manager'] = null;
            }

            // Note: blood_stock is not included here as it might require separate logic
            // The frontend handles the case when blood_stock is not present

            return response()->json([
                'hospital' => $hospitalData,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching hospital info:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch hospital information',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get manager contact information for the logged-in phlebotomist's hospital
     */
    public function managerContact(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            // Check if user is an Admin or Phlebotomist (nurse)
            $userRole = strtolower($user->role ?? '');
            if ($userRole !== 'phlebotomist' && $userRole !== 'admin') {
                Log::warning('Unauthorized access attempt to manager contact', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'user_role' => $user->role
                ]);
                return response()->json([
                    'message' => 'Unauthorized. Only admins and phlebotomists can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            // Get mobile phlebotomist record for phlebotomists to get their hospital_id
            $hospitalId = null;
            
            if ($userRole === 'phlebotomist') {
                $phlebotomist = MobilePhlebotomist::where('user_id', $user->id)->first();
                
                if (!$phlebotomist) {
                    return response()->json([
                        'message' => 'Phlebotomist record not found. Please complete your profile registration.',
                        'error' => 'phlebotomist_not_found'
                    ], 404);
                }
                
                $hospitalId = $phlebotomist->hospital_id;
            }

            // For admins, they need to specify which hospital, or we could return an error
            if ($hospitalId === null) {
                return response()->json([
                    'message' => 'Hospital not found. Please ensure you are assigned to a hospital.',
                    'error' => 'hospital_not_assigned'
                ], 404);
            }

            // Fetch hospital with health center manager relationship
            $hospital = \App\Models\Hospital::with(['healthCenterManager.user'])
                ->find($hospitalId);

            if (!$hospital) {
                return response()->json([
                    'message' => 'Hospital not found.',
                    'error' => 'hospital_not_found'
                ], 404);
            }

            $manager = $hospital->healthCenterManager;

            if (!$manager) {
                return response()->json([
                    'message' => 'Manager not found for this hospital.',
                    'error' => 'manager_not_found'
                ], 404);
            }

            $managerUser = $manager->user;
            
            if (!$managerUser) {
                return response()->json([
                    'message' => 'Manager user information not found.',
                    'error' => 'manager_user_not_found'
                ], 404);
            }

            // Format manager data for frontend
            $firstName = $managerUser->first_name ?? '';
            $middleName = $managerUser->middle_name ?? '';
            $lastName = $managerUser->last_name ?? '';
            $fullName = trim("{$firstName} {$middleName} {$lastName}") ?: 'N/A';

            $managerData = [
                'id' => $manager->id,
                'code' => $manager->code ?? 'N/A',
                'position' => $manager->position ?? 'N/A',
                'office_location' => $manager->office_location ?? 'N/A',
                'start_time' => $manager->start_time ?? 'N/A',
                'end_time' => $manager->end_time ?? 'N/A',
                'working_hours' => $manager->working_hours ?? 'N/A',
                'name' => $fullName,
                'email' => $managerUser->email ?? 'N/A',
                'phone_nb' => $managerUser->phone_nb ?? 'N/A',
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'last_name' => $lastName,
            ];

            return response()->json([
                'manager' => $managerData,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching manager contact:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch manager contact information',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get messages between the logged-in phlebotomist and their manager
     */
    public function getMessages(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            // Check if user is an Admin or Phlebotomist (nurse)
            $userRole = strtolower($user->role ?? '');
            if ($userRole !== 'phlebotomist' && $userRole !== 'admin') {
                Log::warning('Unauthorized access attempt to messages', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'user_role' => $user->role
                ]);
                return response()->json([
                    'message' => 'Unauthorized. Only admins and phlebotomists can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            // Get mobile phlebotomist record for phlebotomists to get their manager_id
            $managerUserId = null;
            
            if ($userRole === 'phlebotomist') {
                $phlebotomist = MobilePhlebotomist::where('user_id', $user->id)->first();
                
                if (!$phlebotomist) {
                    return response()->json([
                        'message' => 'Phlebotomist record not found. Please complete your profile registration.',
                        'error' => 'phlebotomist_not_found'
                    ], 404);
                }
                
                // Get the manager's user_id through the hospital relationship
                $hospital = \App\Models\Hospital::with('healthCenterManager.user')
                    ->find($phlebotomist->hospital_id);
                
                if ($hospital && $hospital->healthCenterManager && $hospital->healthCenterManager->user) {
                    $managerUserId = $hospital->healthCenterManager->user->id;
                } else {
                    return response()->json([
                        'message' => 'Manager not found for this hospital.',
                        'error' => 'manager_not_found'
                    ], 404);
                }
            }

            // For admins, return empty array or error
            if ($managerUserId === null) {
                return response()->json([
                    'messages' => [],
                    'total' => 0,
                ], 200);
            }

            // Get all messages between the phlebotomist and their manager (bidirectional)
            $messages = Message::where(function($query) use ($user, $managerUserId) {
                    $query->where('sender_id', $user->id)
                          ->where('receiver_id', $managerUserId);
                })
                ->orWhere(function($query) use ($user, $managerUserId) {
                    $query->where('sender_id', $managerUserId)
                          ->where('receiver_id', $user->id);
                })
                ->with(['sender', 'receiver'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Format messages for frontend
            $formattedMessages = $messages->map(function($message) {
                $sender = $message->sender;
                
                // Get sender name
                $senderName = 'N/A';
                if ($sender) {
                    $firstName = $sender->first_name ?? '';
                    $middleName = $sender->middle_name ?? '';
                    $lastName = $sender->last_name ?? '';
                    $senderName = trim("{$firstName} {$middleName} {$lastName}") ?: 'N/A';
                }

                // Format date
                $date = 'N/A';
                if ($message->created_at) {
                    $date = Carbon::parse($message->created_at)->format('Y-m-d h:i A');
                }

                return [
                    'id' => $message->id,
                    'senderName' => $senderName,
                    'date' => $date,
                    'subject' => $message->subject ?? 'N/A',
                    'body' => $message->body ?? 'N/A',
                    'read_at' => $message->read_at ? Carbon::parse($message->read_at)->format('Y-m-d h:i A') : null,
                    'is_sent_by_me' => $message->sender_id === Auth::id(),
                ];
            });

            return response()->json([
                'messages' => $formattedMessages,
                'total' => $formattedMessages->count(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching messages:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch messages',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Send a message from the logged-in phlebotomist to their manager
     */
    public function sendMessage(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            // Check if user is an Admin or Phlebotomist (nurse)
            $userRole = strtolower($user->role ?? '');
            if ($userRole !== 'phlebotomist' && $userRole !== 'admin') {
                Log::warning('Unauthorized access attempt to send message', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'user_role' => $user->role
                ]);
                return response()->json([
                    'message' => 'Unauthorized. Only admins and phlebotomists can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            // Validate request
            $validated = $request->validate([
                'subject' => 'required|string|max:255',
                'body' => 'required|string',
            ]);

            // Get mobile phlebotomist record for phlebotomists to get their manager_id
            $managerUserId = null;
            
            if ($userRole === 'phlebotomist') {
                $phlebotomist = MobilePhlebotomist::where('user_id', $user->id)->first();
                
                if (!$phlebotomist) {
                    return response()->json([
                        'message' => 'Phlebotomist record not found. Please complete your profile registration.',
                        'error' => 'phlebotomist_not_found'
                    ], 404);
                }
                
                // Get the manager's user_id through the hospital relationship
                $hospital = \App\Models\Hospital::with('healthCenterManager.user')
                    ->find($phlebotomist->hospital_id);
                
                if ($hospital && $hospital->healthCenterManager && $hospital->healthCenterManager->user) {
                    $managerUserId = $hospital->healthCenterManager->user->id;
                } else {
                    return response()->json([
                        'message' => 'Manager not found for this hospital.',
                        'error' => 'manager_not_found'
                    ], 404);
                }
            }

            // For admins, return error
            if ($managerUserId === null) {
                return response()->json([
                    'message' => 'Manager not found. Cannot send message.',
                    'error' => 'manager_not_found'
                ], 404);
            }

            // Create message
            $message = Message::create([
                'sender_id' => $user->id,
                'receiver_id' => $managerUserId,
                'subject' => $validated['subject'],
                'body' => $validated['body'],
            ]);

            // Load relationships
            $message->load(['sender', 'receiver']);

            // Format response
            $sender = $message->sender;
            $senderName = 'N/A';
            if ($sender) {
                $firstName = $sender->first_name ?? '';
                $middleName = $sender->middle_name ?? '';
                $lastName = $sender->last_name ?? '';
                $senderName = trim("{$firstName} {$middleName} {$lastName}") ?: 'N/A';
            }

            $date = 'N/A';
            if ($message->created_at) {
                $date = Carbon::parse($message->created_at)->format('Y-m-d h:i A');
            }

            return response()->json([
                'message' => [
                    'id' => $message->id,
                    'senderName' => $senderName,
                    'date' => $date,
                    'subject' => $message->subject,
                    'body' => $message->body,
                    'read_at' => null,
                    'is_sent_by_me' => true,
                ],
                'success' => true,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error sending message:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to send message',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}

