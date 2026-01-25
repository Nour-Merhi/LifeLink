<?php

namespace App\Http\Controllers;

use App\Models\MobilePhlebotomist;
use App\Models\HomeAppointment;
use App\Models\HomeAppointmentRating;
use App\Models\Message;
use App\Models\Hospital;
use App\Models\BloodInventory;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class NurseDashboardController extends Controller
{
    private function resolvePhlebotomistAndManagerUserId(Request $request): array
    {
        $user = Auth::user();
        if (!$user) {
            return [null, null, response()->json(['message' => 'Unauthenticated. Please log in to access this endpoint.'], 401)];
        }

        $userRole = strtolower($user->role ?? '');
        if ($userRole !== 'phlebotomist' && $userRole !== 'admin') {
            return [null, null, response()->json([
                'message' => 'Unauthorized. Only admins and phlebotomists can access this endpoint.',
                'user_role' => $user->role
            ], 403)];
        }

        if ($userRole !== 'phlebotomist') {
            // Admins: not supported here
            return [null, null, response()->json(['message' => 'Admins should use admin endpoints.'], 403)];
        }

        $phlebotomist = MobilePhlebotomist::where('user_id', $user->id)->first();
        if (!$phlebotomist) {
            return [null, null, response()->json([
                'message' => 'Phlebotomist record not found. Please complete your profile registration.',
                'error' => 'phlebotomist_not_found'
            ], 404)];
        }

        $hospital = Hospital::with('healthCenterManager.user')->find($phlebotomist->hospital_id);
        if (!$hospital || !$hospital->healthCenterManager || !$hospital->healthCenterManager->user) {
            return [null, null, response()->json([
                'message' => 'Manager not found for this hospital.',
                'error' => 'manager_not_found'
            ], 404)];
        }

        $managerUserId = $hospital->healthCenterManager->user->id;
        return [$user, $managerUserId, null];
    }

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

                // Coordinates (preferred for map directions)
                $lat = $appt->latitude ?? null;
                $lng = $appt->longitude ?? null;

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
                // Frontend expects: Pending | Confirmed | Completed | Cancelled
                $state = strtolower($appt->state ?? 'pending');
                $status = match ($state) {
                    'completed' => 'Completed',
                    'confirmed' => 'Confirmed',
                    'canceled', 'cancelled' => 'Cancelled',
                    default => 'Pending',
                };

                return [
                    'id' => $appt->id,
                    'donorName' => $donorName,
                    'gender' => $gender,
                    'bloodType' => $bloodType,
                    'address' => $address,
                    'latitude' => $lat,
                    'longitude' => $lng,
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
     * Update a home appointment status for the logged-in phlebotomist.
     * Used by nurse dashboard "Mark Complete" / "Cancel" actions.
     */
    public function updateMyAppointmentStatus(Request $request, $appointmentId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated. Please log in.'], 401);
            }

            $userRole = strtolower($user->role ?? '');
            if ($userRole !== 'phlebotomist' && $userRole !== 'admin') {
                return response()->json([
                    'message' => 'Unauthorized. Only admins and phlebotomists can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            $validated = $request->validate([
                'state' => 'required|in:pending,confirmed,completed,canceled,cancelled',
            ]);

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

            $homeAppointment = HomeAppointment::where('id', $appointmentId)->firstOrFail();

            // Phlebotomists can only update their own assigned appointments
            if ($phlebotomistId !== null && (int)$homeAppointment->phlebotomist_id !== (int)$phlebotomistId) {
                return response()->json(['message' => 'Forbidden. Appointment not assigned to you.'], 403);
            }

            $oldState = strtolower($homeAppointment->state ?? 'pending');
            $newState = strtolower($validated['state']);
            if ($newState === 'cancelled') $newState = 'canceled';

            // Do not allow invalid backward transitions (basic guard)
            if ($oldState === 'completed' && $newState !== 'completed') {
                return response()->json(['message' => 'Completed appointments cannot be changed.'], 422);
            }

            $homeAppointment->state = $newState;

            // Track completed_at/expires_at for inventory logic
            if ($newState === 'completed') {
                if (!$homeAppointment->completed_at) {
                    $homeAppointment->completed_at = now();
                }
                if (!$homeAppointment->expires_at) {
                    $homeAppointment->expires_at = Carbon::parse($homeAppointment->completed_at)->addDays(42)->toDateString();
                }
            } else {
                // If not completed, keep these null
                $homeAppointment->completed_at = null;
                $homeAppointment->expires_at = null;
            }

            $homeAppointment->save();

            // If appointment is finished (completed/canceled), free up the phlebotomist.
            // This must work even if an admin triggers the status change.
            if (in_array($newState, ['completed', 'canceled'], true) && $homeAppointment->phlebotomist_id) {
                $p = MobilePhlebotomist::find($homeAppointment->phlebotomist_id);
                if ($p) {
                    // Enforce: inactive => unavailable; otherwise available when finished.
                    if (strtolower((string)($p->status ?? '')) === 'inactive') {
                        $p->availability = 'unavailable';
                    } else {
                        $p->availability = 'available';
                    }
                    $p->save();
                }
            }

            return response()->json([
                'message' => 'Appointment status updated.',
                'appointment' => [
                    'id' => $homeAppointment->id,
                    'state' => $homeAppointment->state,
                    'completed_at' => $homeAppointment->completed_at,
                    'expires_at' => $homeAppointment->expires_at,
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Appointment not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating nurse appointment status:', [
                'user_id' => Auth::id(),
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update appointment status',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get donor requests (assigned home appointments) for phlebotomists
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

            // Get mobile phlebotomist record for phlebotomists to get their phlebotomist_id
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
            // For admins, they can see all assigned requests (phlebotomistId remains null)

            // Get assigned home appointments (phlebotomist_id is NOT NULL and state is pending)
            $appointmentsQuery = HomeAppointment::with([
                'donor.user',
                'donor.bloodType',
                'appointment',
                'hospital'
            ])
            ->whereNotNull('phlebotomist_id')
            ->where('state', 'pending');
            
            // Filter by phlebotomist_id for phlebotomists (only show requests assigned to them)
            if ($phlebotomistId !== null) {
                $appointmentsQuery->where('phlebotomist_id', $phlebotomistId);
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

            // Load more relationships to better match admin hospital details
            $hospital->loadMissing([
                'healthCenterManager.user',
                'mobilePhlebotomist.user',
            ]);

            // Count requests (appointments created by this hospital)
            $requestsCount = Appointment::where('hospital_id', $hospital->id)->count();

            // Blood stock grouped by blood type (available inventory)
            $bloodStocks = BloodInventory::where('hospital_id', $hospital->id)
                ->where('status', 'available')
                ->with('bloodType')
                ->get()
                ->groupBy(function ($item) {
                    return $item->bloodType ? $item->bloodType->type . $item->bloodType->rh_factor : 'Unknown';
                })
                ->map(function ($items) {
                    return $items->sum('quantity');
                })
                ->toArray();

            // Calculate shortage state for each blood type
            $shortageStates = [];
            foreach ($bloodStocks as $bloodType => $quantity) {
                if ($quantity < 5) {
                    $shortageStates[$bloodType] = 'critical';
                } elseif ($quantity >= 5 && $quantity <= 10) {
                    $shortageStates[$bloodType] = 'low stock';
                } else {
                    $shortageStates[$bloodType] = 'sufficient';
                }
            }

            // Ensure all blood types exist in the response
            $allBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            $completeBloodStocks = [];
            $completeShortageStates = [];
            foreach ($allBloodTypes as $bt) {
                $completeBloodStocks[$bt] = $bloodStocks[$bt] ?? 0;
                $completeShortageStates[$bt] = $shortageStates[$bt] ?? 'critical';
            }

            // Calculate basic hospital stats (mirrors admin details)
            $stats = [
                'total_appointments' => $hospital->appointments()->count(),
                'hospital_appointments' => $hospital->hospitalAppointments()->count(),
                'home_appointments' => $hospital->homeAppointments()->count(),
                'total_phlebotomists' => $hospital->mobilePhlebotomist()->count(),
                'emergency_requests' => $hospital->emergencyRequests()->count(),
                'pending_appointments' => $hospital->appointments()->where('state', 'pending')->count(),
                'completed_appointments' => $hospital->appointments()->where('state', 'completed')->count(),
                'requests' => $requestsCount,
            ];

            // Manager additional info
            $managerInfo = null;
            if ($hospital->healthCenterManager) {
                $managerInfo = [
                    'position' => $hospital->healthCenterManager->position,
                    'office_location' => $hospital->healthCenterManager->office_location,
                    'working_hours' => $hospital->healthCenterManager->working_hours,
                ];
            }

            // Convert to array and attach computed fields
            $hospitalData = $hospital->toArray();
            $hospitalData['stats'] = $stats;
            $hospitalData['manager_additional_info'] = $managerInfo;
            $hospitalData['requests'] = $requestsCount;
            $hospitalData['blood_stock'] = $completeBloodStocks;
            $hospitalData['shortage_states'] = $completeShortageStates;

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
     * Phlebotomist: unread count of incoming messages from manager.
     * "Unread" = receiver is me AND sender is manager AND read_at is null.
     */
    public function getUnreadMessagesCount(Request $request)
    {
        try {
            [$user, $managerUserId, $earlyResponse] = $this->resolvePhlebotomistAndManagerUserId($request);
            if ($earlyResponse) return $earlyResponse;

            $count = Message::where('receiver_id', $user->id)
                ->where('sender_id', $managerUserId)
                ->whereNull('read_at')
                ->count();

            return response()->json(['unread_count' => (int) $count], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching nurse unread messages count:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch unread count',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Phlebotomist: mark incoming manager->me messages as read.
     */
    public function markMessagesRead(Request $request)
    {
        try {
            [$user, $managerUserId, $earlyResponse] = $this->resolvePhlebotomistAndManagerUserId($request);
            if ($earlyResponse) return $earlyResponse;

            $updated = Message::where('receiver_id', $user->id)
                ->where('sender_id', $managerUserId)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            return response()->json([
                'message' => 'Messages marked as read',
                'updated' => (int) $updated,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error marking nurse messages as read:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to mark messages as read',
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

    /**
     * Update phlebotomist status to onDuty when starting an appointment
     */
    public function startAppointment(Request $request, $appointmentId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            // Check if user is a Phlebotomist
            $userRole = strtolower($user->role ?? '');
            if ($userRole !== 'phlebotomist') {
                Log::warning('Unauthorized access attempt to start appointment', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'user_role' => $user->role
                ]);
                return response()->json([
                    'message' => 'Unauthorized. Only phlebotomists can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            // Get mobile phlebotomist record
            $phlebotomist = MobilePhlebotomist::where('user_id', $user->id)->first();
            
            if (!$phlebotomist) {
                return response()->json([
                    'message' => 'Phlebotomist record not found. Please complete your profile registration.',
                    'error' => 'phlebotomist_not_found'
                ], 404);
            }

            // Verify the appointment is assigned to this phlebotomist
            $homeAppointment = HomeAppointment::where('id', $appointmentId)
                ->where('phlebotomist_id', $phlebotomist->id)
                ->first();

            if (!$homeAppointment) {
                return response()->json([
                    'message' => 'Appointment not found or not assigned to you.',
                    'error' => 'appointment_not_found'
                ], 404);
            }

            // Update phlebotomist availability to onDuty
            // Enforce: inactive => unavailable
            if (strtolower((string)($phlebotomist->status ?? '')) === 'inactive') {
                $phlebotomist->availability = 'unavailable';
            } else {
                $phlebotomist->availability = 'onDuty';
            }
            $phlebotomist->save();

            // Update appointment status to confirmed
            $homeAppointment->state = 'confirmed';
            $homeAppointment->save();

            return response()->json([
                'message' => 'Appointment started successfully. Your status has been set to on duty and the appointment is now confirmed.',
                'phlebotomist' => [
                    'id' => $phlebotomist->id,
                    'availability' => $phlebotomist->availability
                ],
                'appointment' => [
                    'id' => $homeAppointment->id,
                    'code' => $homeAppointment->code,
                    'state' => $homeAppointment->state
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error starting appointment:', [
                'user_id' => Auth::id(),
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to start appointment',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Leaderboard: top rated phlebotomists based on donor ratings of completed home appointments.
     */
    public function leaderboard(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $userRole = strtolower($user->role ?? '');
            if ($userRole !== 'phlebotomist' && $userRole !== 'admin') {
                return response()->json([
                    'message' => 'Unauthorized. Only admins and phlebotomists can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            $scope = strtolower((string) $request->query('scope', 'all')); // 'all' | 'hospital'
            if (!in_array($scope, ['all', 'hospital'], true)) {
                $scope = 'all';
            }

            // If hospital-scoped, restrict to the logged-in phlebotomist's hospital.
            $scopedHospitalId = null;
            $scopedHospitalName = null;
            if ($scope === 'hospital' && $userRole === 'phlebotomist') {
                $mePhleb = MobilePhlebotomist::where('user_id', $user->id)->with('hospital')->first();
                if ($mePhleb) {
                    $scopedHospitalId = $mePhleb->hospital_id;
                    $scopedHospitalName = $mePhleb->hospital ? ($mePhleb->hospital->name ?? null) : null;
                }
            }

            // ----------------
            // Top Raters
            // ----------------
            $topRatersQuery = DB::table('home_appointment_ratings as r')
                ->join('home_appointments as ha', 'ha.id', '=', 'r.home_appointment_id')
                // IMPORTANT: use the snapshot phlebotomist_id on the rating so ratings never "move"
                // if the appointment gets reassigned later.
                ->join('mobile_phlebotomists as mp', 'mp.id', '=', 'r.phlebotomist_id')
                ->join('users as u', 'u.id', '=', 'mp.user_id')
                ->leftJoin('hospitals as h', 'h.id', '=', 'mp.hospital_id')
                ->whereNotNull('r.phlebotomist_id')
                ->where('ha.state', '=', 'completed')
                ->selectRaw('
                    mp.id as phlebotomist_id,
                    mp.code as phlebotomist_code,
                    u.email as email,
                    CONCAT_WS(" ", u.first_name, u.middle_name, u.last_name) as name,
                    h.name as hospital_name,
                    ROUND(AVG(r.rating), 2) as avg_rating,
                    COUNT(r.id) as ratings_count,
                    COUNT(DISTINCT ha.id) as completed_rated_count
                ')
                ->groupBy('mp.id', 'mp.code', 'u.email', 'u.first_name', 'u.middle_name', 'u.last_name', 'h.name')
                ->orderByDesc('avg_rating')
                ->orderByDesc('ratings_count')
                ->orderByDesc('completed_rated_count')
                ->limit(25);

            if ($scopedHospitalId !== null) {
                $topRatersQuery->where('mp.hospital_id', '=', $scopedHospitalId);
            }

            $topRatersRows = $topRatersQuery->get();

            $top_raters = collect($topRatersRows)->values()->map(function ($row, $idx) {
                return [
                    'rank' => $idx + 1,
                    'phlebotomist_id' => (int) $row->phlebotomist_id,
                    'code' => $row->phlebotomist_code ?? null,
                    'name' => trim($row->name ?: '') ?: ($row->email ?? 'N/A'),
                    'hospital' => $row->hospital_name ?? 'N/A',
                    'avg_rating' => (float) ($row->avg_rating ?? 0),
                    'ratings_count' => (int) ($row->ratings_count ?? 0),
                    'completed_rated_count' => (int) ($row->completed_rated_count ?? 0),
                ];
            });

            // ----------------
            // Top Workers (most completed home appointments)
            // ----------------
            $topWorkersQuery = DB::table('home_appointments as ha')
                ->join('mobile_phlebotomists as mp', 'mp.id', '=', 'ha.phlebotomist_id')
                ->join('users as u', 'u.id', '=', 'mp.user_id')
                ->leftJoin('hospitals as h', 'h.id', '=', 'mp.hospital_id')
                ->leftJoin('home_appointment_ratings as r', 'r.home_appointment_id', '=', 'ha.id')
                ->whereNotNull('ha.phlebotomist_id')
                ->where('ha.state', '=', 'completed')
                ->selectRaw('
                    mp.id as phlebotomist_id,
                    mp.code as phlebotomist_code,
                    u.email as email,
                    CONCAT_WS(" ", u.first_name, u.middle_name, u.last_name) as name,
                    h.name as hospital_name,
                    COUNT(ha.id) as completed_count,
                    COUNT(r.id) as ratings_count,
                    ROUND(AVG(r.rating), 2) as avg_rating
                ')
                ->groupBy('mp.id', 'mp.code', 'u.email', 'u.first_name', 'u.middle_name', 'u.last_name', 'h.name')
                ->orderByDesc('completed_count')
                ->orderByDesc('ratings_count')
                ->orderByDesc('avg_rating')
                ->limit(25);

            if ($scopedHospitalId !== null) {
                $topWorkersQuery->where('mp.hospital_id', '=', $scopedHospitalId);
            }

            $topWorkersRows = $topWorkersQuery->get();

            $top_workers = collect($topWorkersRows)->values()->map(function ($row, $idx) {
                return [
                    'rank' => $idx + 1,
                    'phlebotomist_id' => (int) $row->phlebotomist_id,
                    'code' => $row->phlebotomist_code ?? null,
                    'name' => trim($row->name ?: '') ?: ($row->email ?? 'N/A'),
                    'hospital' => $row->hospital_name ?? 'N/A',
                    'completed_count' => (int) ($row->completed_count ?? 0),
                    'ratings_count' => (int) ($row->ratings_count ?? 0),
                    'avg_rating' => (float) ($row->avg_rating ?? 0),
                ];
            });

            // My stats (phlebotomists only)
            $myStats = null;
            if ($userRole === 'phlebotomist') {
                $me = MobilePhlebotomist::where('user_id', $user->id)->first();
                if ($me) {
                    // My Top-Raters stats + rank
                    $myRatersAgg = DB::table('home_appointment_ratings as r')
                        ->join('home_appointments as ha', 'ha.id', '=', 'r.home_appointment_id')
                        ->where('r.phlebotomist_id', '=', $me->id)
                        ->where('ha.state', '=', 'completed')
                        ->selectRaw('ROUND(AVG(r.rating), 2) as avg_rating, COUNT(r.id) as ratings_count')
                        ->first();

                    $myAvg = (float) ($myRatersAgg->avg_rating ?? 0);
                    $myCnt = (int) ($myRatersAgg->ratings_count ?? 0);
                    $myRankRaters = null;
                    if ($myCnt > 0) {
                        $ratersAgg = DB::table('home_appointment_ratings as r')
                            ->join('home_appointments as ha', 'ha.id', '=', 'r.home_appointment_id')
                            ->whereNotNull('r.phlebotomist_id')
                            ->where('ha.state', '=', 'completed')
                            ->groupBy('r.phlebotomist_id')
                            ->selectRaw('r.phlebotomist_id as phlebotomist_id, ROUND(AVG(r.rating), 2) as avg_rating, COUNT(r.id) as ratings_count');
                        if ($scopedHospitalId !== null) {
                            // Hospital scope must also follow the rating snapshot
                            $ratersAgg->join('mobile_phlebotomists as mp', 'mp.id', '=', 'r.phlebotomist_id')
                                ->where('mp.hospital_id', '=', $scopedHospitalId);
                        }

                        $better = DB::query()->fromSub($ratersAgg, 't')
                            ->where(function ($q) use ($myAvg, $myCnt) {
                                $q->where('t.avg_rating', '>', $myAvg)
                                  ->orWhere(function ($q2) use ($myAvg, $myCnt) {
                                      $q2->where('t.avg_rating', '=', $myAvg)
                                         ->where('t.ratings_count', '>', $myCnt);
                                  });
                            })
                            ->count();
                        $myRankRaters = $better + 1;
                    }

                    // My Top-Workers stats + rank
                    $myWorkersAgg = DB::table('home_appointments as ha')
                        ->leftJoin('home_appointment_ratings as r', 'r.home_appointment_id', '=', 'ha.id')
                        ->where('ha.phlebotomist_id', '=', $me->id)
                        ->where('ha.state', '=', 'completed')
                        ->selectRaw('COUNT(ha.id) as completed_count, COUNT(r.id) as ratings_count, ROUND(AVG(r.rating), 2) as avg_rating')
                        ->first();

                    $myCompleted = (int) ($myWorkersAgg->completed_count ?? 0);
                    $myWorkersRatings = (int) ($myWorkersAgg->ratings_count ?? 0);
                    $myWorkersAvg = (float) ($myWorkersAgg->avg_rating ?? 0);

                    $myRankWorkers = null;
                    if ($myCompleted > 0) {
                        $workersAgg = DB::table('home_appointments as ha')
                            ->leftJoin('home_appointment_ratings as r', 'r.home_appointment_id', '=', 'ha.id')
                            ->whereNotNull('ha.phlebotomist_id')
                            ->where('ha.state', '=', 'completed')
                            ->groupBy('ha.phlebotomist_id')
                            ->selectRaw('ha.phlebotomist_id as phlebotomist_id, COUNT(ha.id) as completed_count, COUNT(r.id) as ratings_count, ROUND(AVG(r.rating), 2) as avg_rating');
                        if ($scopedHospitalId !== null) {
                            $workersAgg->join('mobile_phlebotomists as mp', 'mp.id', '=', 'ha.phlebotomist_id')
                                ->where('mp.hospital_id', '=', $scopedHospitalId);
                        }

                        $betterW = DB::query()->fromSub($workersAgg, 't')
                            ->where(function ($q) use ($myCompleted, $myWorkersRatings, $myWorkersAvg) {
                                $q->where('t.completed_count', '>', $myCompleted)
                                  ->orWhere(function ($q2) use ($myCompleted, $myWorkersRatings, $myWorkersAvg) {
                                      $q2->where('t.completed_count', '=', $myCompleted)
                                         ->where('t.ratings_count', '>', $myWorkersRatings);
                                  })
                                  ->orWhere(function ($q3) use ($myCompleted, $myWorkersRatings, $myWorkersAvg) {
                                      $q3->where('t.completed_count', '=', $myCompleted)
                                         ->where('t.ratings_count', '=', $myWorkersRatings)
                                         ->where('t.avg_rating', '>', $myWorkersAvg);
                                  });
                            })
                            ->count();
                        $myRankWorkers = $betterW + 1;
                    }

                    $myStats = [
                        'phlebotomist_id' => $me->id,
                        'top_raters' => [
                            'avg_rating' => $myAvg,
                            'ratings_count' => $myCnt,
                            'rank' => $myRankRaters,
                        ],
                        'top_workers' => [
                            'completed_count' => $myCompleted,
                            'ratings_count' => $myWorkersRatings,
                            'avg_rating' => $myWorkersAvg,
                            'rank' => $myRankWorkers,
                        ],
                    ];
                }
            }

            return response()->json([
                'scope' => $scope,
                'scope_hospital' => $scopedHospitalName,
                'top_raters' => $top_raters,
                'top_workers' => $top_workers,
                'my_stats' => $myStats,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching nurse leaderboard:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch leaderboard',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}

