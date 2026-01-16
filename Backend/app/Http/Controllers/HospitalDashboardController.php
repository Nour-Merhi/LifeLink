<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Hospital;
use App\Models\Appointment;
use App\Models\HomeAppointment;
use App\Models\HospitalAppointment;
use App\Models\Donor;
use App\Models\EmergencyRequest;
use App\Models\BloodInventory;
use App\Models\CustomNotification;
use App\Models\MobilePhlebotomist;
use App\Models\LivingDonor;
use App\Models\AfterDeathPledge;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HospitalDashboardController extends Controller
{
    /**
     * Get dashboard overview for a specific hospital
     * Returns comprehensive dashboard data including metrics, appointments, and events
     */
    public function overview(Request $request, $hospitalId = null)
    {
        try {
            // TODO: Get hospital ID from authenticated user's hospital relationship
            // For now, get hospital from request parameter or input
            $hospitalId = $hospitalId ?? $request->input('hospital_id');
            
            // If no hospital ID provided, try to get from authenticated user
            if (!$hospitalId && $request->user()) {
                $user = $request->user();
                if ($user->role === 'manager' && $user->healthCenterManager) {
                    $hospitalId = $user->healthCenterManager->hospital_id;
                }
            }
            
            if (!$hospitalId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital ID required'
                ], 400);
            }

            $hospital = Hospital::find($hospitalId);
            if (!$hospital) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital not found'
                ], 404);
            }
            
            $today = now()->toDateString();
            $todayStart = now()->startOfDay();
            $todayEnd = now()->endOfDay();

            // === METRICS CALCULATIONS ===
            
            // 1. Urgent Donations (urgent appointments scheduled for today)
            $urgentDonations = Appointment::where('hospital_id', $hospitalId)
                ->where('appointment_type', 'urgent')
                ->whereDate('appointment_date', $today)
                ->where('state', 'pending')
                ->count();
            
            // 2. Regular Appointments (regular appointments scheduled for today)
            $regularAppointments = Appointment::where('hospital_id', $hospitalId)
                ->where('appointment_type', 'regular')
                ->whereDate('appointment_date', $today)
                ->where('state', 'pending')
                ->count();
            
            // 3. Pending Home Visits (home appointments pending assignment)
            $pendingHomeVisits = HomeAppointment::where('hospital_id', $hospitalId)
                ->where('state', 'pending')
                ->whereNull('phlebotomist_id') // Not yet assigned
                ->count();
            
            // 4. Phlebotomists On Duty (currently active/on duty)
            $phlebotomistsOnDuty = MobilePhlebotomist::where('hospital_id', $hospitalId)
                ->where('availability', 'onDuty')
                ->count();
            
            // 5. Critical Blood Shortages (blood inventory below threshold - e.g., < 10 units)
            $criticalThreshold = 10; // Configurable threshold
            try {
                $bloodInventory = BloodInventory::where('hospital_id', $hospitalId)
                    ->where('status', 'available')
                    ->select('blood_type_id', DB::raw('SUM(quantity) as total'))
                    ->groupBy('blood_type_id')
                    ->get();
                
                $criticalBloodShortages = $bloodInventory->filter(function($item) use ($criticalThreshold) {
                    return $item->total < $criticalThreshold;
                })->count();
            } catch (\Exception $e) {
                \Log::warning('Error fetching blood inventory for critical shortages:', [
                    'error' => $e->getMessage()
                ]);
                $criticalBloodShortages = 0; // Default to 0 if table doesn't exist
            }
            
            // 6. Pending Organ Matches (living donors or after-death pledges pending approval)
            $pendingOrganMatches = LivingDonor::where('hospital_id', $hospitalId)
                ->where(function($query) {
                    $query->where('medical_status', 'pending')
                          ->orWhere('ethics_status', 'pending');
                })
                ->count();
            
            // === HOSPITAL INFO ===
            $hospitalInfo = [
                'id' => $hospital->id,
                'name' => $hospital->name,
                'address' => $hospital->address,
                'status' => $hospital->status ?? 'verified',
                'code' => $hospital->code,
                'phone_nb' => $hospital->phone_nb,
                'email' => $hospital->email,
            ];
            
            // === TODAY'S APPOINTMENTS ===
            // Note: HospitalAppointment uses 'hospital_Id' (capital I) and relationship is 'appointments' (singular belongsTo)
            try {
                $todayAppointmentsList = HospitalAppointment::where('hospital_Id', $hospitalId)
                    ->where('state', 'pending')
                    ->with([
                        'donor.user',
                        'donor.bloodType',
                        'appointments'
                    ])
                    ->get()
                    ->filter(function($apt) use ($today) {
                        // Filter to ensure appointment is today
                        try {
                            $appointmentRelation = $apt->appointments;
                            $appointment = null;
                            if ($appointmentRelation instanceof \Illuminate\Database\Eloquent\Model) {
                                $appointment = $appointmentRelation;
                            } elseif (is_array($appointmentRelation) && !empty($appointmentRelation)) {
                                $appointment = (object)$appointmentRelation[0];
                            } elseif ($appointmentRelation instanceof \Illuminate\Support\Collection && $appointmentRelation->isNotEmpty()) {
                                $appointment = $appointmentRelation->first();
                            } else {
                                $appointment = $apt->appointments()->first();
                            }
                            if (!$appointment) return false;
                            
                            $apptDate = $appointment->appointment_date;
                            if ($apptDate instanceof Carbon) {
                                $apptDate = $apptDate->toDateString();
                            } elseif (is_string($apptDate)) {
                                // Already a string, just use it
                            } else {
                                // Try to convert
                                $apptDate = Carbon::parse($apptDate)->toDateString();
                            }
                            
                            $appointmentState = $appointment->state;
                            return $apptDate === $today && $appointmentState === 'pending';
                        } catch (\Exception $e) {
                            \Log::warning('Error filtering appointment:', [
                                'appt_id' => $apt->id ?? null,
                                'error' => $e->getMessage()
                            ]);
                            return false;
                        }
                    })
                    ->map(function($apt) {
                    try {
                        // Get appointment using the singular relationship name
                        $appointment = $apt->appointment;
                        $donor = $apt->donor;
                        $user = $donor && $donor->user ? $donor->user : null;
                        
                        // Extract time from appointment_time or time_slots
                        $timeDisplay = $apt->appointment_time ?? 'N/A';
                        if ($timeDisplay === 'N/A' && $appointment) {
                            $timeSlots = $appointment->time_slots ?? null;
                            if ($timeSlots) {
                                $slots = is_array($timeSlots) 
                                    ? $timeSlots 
                                    : (is_string($timeSlots) ? json_decode($timeSlots, true) : []);
                                
                                if ($slots && is_array($slots) && count($slots) > 0) {
                                    $firstSlot = $slots[0];
                                    if (is_array($firstSlot) && isset($firstSlot['start'])) {
                                        $timeDisplay = $firstSlot['start'];
                                    } elseif (is_string($firstSlot)) {
                                        $timeDisplay = $firstSlot;
                                    }
                                }
                            }
                        }
                        
                        $donorName = 'Unknown';
                        if ($user) {
                            $nameParts = array_filter([
                                $user->first_name ?? '',
                                $user->middle_name ?? '',
                                $user->last_name ?? ''
                            ]);
                            $donorName = trim(implode(' ', $nameParts)) ?: 'Unknown';
                        }
                        
                        $appointmentType = 'regular';
                        if ($appointment) {
                            $appointmentType = is_object($appointment) ? ($appointment->appointment_type ?? 'regular') : ($appointment['appointment_type'] ?? 'regular');
                        }
                        
                        return [
                            'id' => $apt->id,
                            'code' => $apt->code,
                            'time' => $timeDisplay,
                            'donor' => $donorName,
                            'type' => $appointmentType,
                            'bloodType' => ($donor && $donor->bloodType) 
                                ? ($donor->bloodType->type . ($donor->bloodType->rh_factor ?? '')) 
                                : 'N/A',
                            'status' => $apt->state ?? 'pending',
                            'appointment_date' => $appointment ? $appointment->appointment_date : null,
                        ];
                    } catch (\Exception $e) {
                        \Log::warning('Error mapping appointment in dashboard:', [
                            'appointment_id' => $apt->id ?? null,
                            'error' => $e->getMessage()
                        ]);
                        return null;
                    }
                })
                    ->filter() // Remove null entries
                    ->sortBy(function($apt) {
                        // Sort by time if available
                        return $apt['time'];
                    })
                    ->values();
            } catch (\Exception $e) {
                \Log::error('Error fetching today appointments:', [
                    'hospital_id' => $hospitalId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $todayAppointmentsList = collect([]); // Return empty collection on error
            }
            
            // === RECENT EVENTS ===
            // Get recent notifications, appointments, and activities
            $recentEvents = collect();
            
            // Recent urgent appointments created
            $recentUrgentAppts = Appointment::where('hospital_id', $hospitalId)
                ->where('appointment_type', 'urgent')
                ->where('created_at', '>=', now()->subHours(24))
                ->with('hospital')
                ->latest()
                ->take(5)
                ->get()
                ->map(function($apt) {
                    return [
                        'id' => 'urgent_' . $apt->id,
                        'type' => 'urgent',
                        'message' => "New urgent blood request: " . ($apt->blood_type ?? 'N/A') . " needed",
                        'time' => $apt->created_at->diffForHumans(),
                        'created_at' => $apt->created_at,
                    ];
                });
            $recentEvents = $recentEvents->merge($recentUrgentAppts);
            
            // Recent completed home visits
            $recentHomeVisits = HomeAppointment::where('hospital_id', $hospitalId)
                ->where('state', 'completed')
                ->where('created_at', '>=', now()->subHours(24))
                ->with(['donor.user', 'mobilePhlebotomist.user'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function($apt) {
                    $donorName = $apt->donor && $apt->donor->user 
                        ? trim(($apt->donor->user->first_name ?? '') . ' ' . ($apt->donor->user->last_name ?? ''))
                        : 'Donor';
                    $phlebName = $apt->mobilePhlebotomist && $apt->mobilePhlebotomist->user
                        ? trim(($apt->mobilePhlebotomist->user->first_name ?? '') . ' ' . ($apt->mobilePhlebotomist->user->last_name ?? ''))
                        : 'Phlebotomist';
                    
                    return [
                        'id' => 'home_' . $apt->id,
                        'type' => 'home',
                        'message' => "Home visit completed by " . $phlebName,
                        'time' => $apt->updated_at->diffForHumans(),
                        'created_at' => $apt->updated_at,
                    ];
                });
            $recentEvents = $recentEvents->merge($recentHomeVisits);
            
            // Recent donor arrivals (hospital appointments for today)
            $recentDonorArrivals = HospitalAppointment::where('hospital_Id', $hospitalId)
                ->whereHas('appointment', function($query) use ($today) {
                    $query->whereDate('appointment_date', $today)
                          ->where('state', 'pending');
                })
                ->where('created_at', '>=', now()->subHours(24))
                ->with(['donor.user'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function($apt) {
                    $donorName = 'Donor';
                    if ($apt->donor && $apt->donor->user) {
                        $nameParts = array_filter([
                            $apt->donor->user->first_name ?? '',
                            $apt->donor->user->last_name ?? ''
                        ]);
                        $donorName = trim(implode(' ', $nameParts)) ?: 'Donor';
                    }
                    
                    return [
                        'id' => 'donor_' . $apt->id,
                        'type' => 'donor',
                        'message' => "Donor " . $donorName . " arrived",
                        'time' => $apt->created_at->diffForHumans(),
                        'created_at' => $apt->created_at,
                    ];
                });
            $recentEvents = $recentEvents->merge($recentDonorArrivals);
            
            // Sort all events by created_at (most recent first) and take top 10
            $recentEvents = $recentEvents->sortByDesc('created_at')->take(10)->values();
            
            // Additional summary stats
            $totalUpcomingAppointments = Appointment::where('hospital_id', $hospitalId)
                ->where('state', '!=', 'canceled')
                ->whereDate('appointment_date', '>=', $today)
                ->count();

            $totalCompletedDonations = HomeAppointment::where('hospital_id', $hospitalId)
                ->where('state', 'completed')
                ->count() + HospitalAppointment::where('hospital_Id', $hospitalId)
                ->where('state', 'completed')
                ->count();

            try {
                $bloodInventoryCount = BloodInventory::where('hospital_id', $hospitalId)
                    ->where('status', 'available')
                    ->sum('quantity');
            } catch (\Exception $e) {
                \Log::warning('Error fetching blood inventory count:', [
                    'error' => $e->getMessage()
                ]);
                $bloodInventoryCount = 0; // Default to 0 if table doesn't exist
            }

            // === MONTHLY TRENDS (Last 12 months) ===
            $monthlyTrends = [];
            for ($i = 11; $i >= 0; $i--) {
                $monthStart = now()->subMonths($i)->startOfMonth();
                $monthEnd = now()->subMonths($i)->endOfMonth();
                
                $homeDonations = HomeAppointment::where('hospital_id', $hospitalId)
                    ->where('state', 'completed')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();
                
                $hospitalDonations = HospitalAppointment::where('hospital_Id', $hospitalId)
                    ->where('state', 'completed')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();
                
                $monthlyTrends[] = [
                    'month' => $monthStart->format('M Y'),
                    'home_visits' => $homeDonations,
                    'hospital' => $hospitalDonations,
                    'total' => $homeDonations + $hospitalDonations,
                ];
            }

            // === DONATION TYPES DISTRIBUTION ===
            $donationTypes = [
                'blood' => Appointment::where('hospital_id', $hospitalId)
                    ->where('donation_type', 'like', '%Blood%')
                    ->where('state', 'completed')
                    ->count(),
                'platelets' => Appointment::where('hospital_id', $hospitalId)
                    ->where('donation_type', 'like', '%Platelet%')
                    ->count(),
                'organs' => Appointment::where('hospital_id', $hospitalId)
                    ->where('donation_type', 'like', '%Organ%')
                    ->count(),
                'home_visit' => HomeAppointment::where('hospital_id', $hospitalId)
                    ->where('state', 'completed')
                    ->count(),
            ];

            // === BLOOD TYPE DISTRIBUTION ===
            try {
                $bloodTypeDistribution = BloodInventory::where('hospital_id', $hospitalId)
                    ->join('blood_types', 'blood_inventory.blood_type_id', '=', 'blood_types.id')
                    ->select('blood_types.type', 'blood_types.rh_factor', DB::raw('SUM(blood_inventory.quantity) as total'))
                    ->groupBy('blood_types.type', 'blood_types.rh_factor')
                    ->get()
                    ->map(function($item) {
                        return [
                            'blood_type' => $item->type . $item->rh_factor,
                            'quantity' => $item->total,
                        ];
                    });
            } catch (\Exception $e) {
                \Log::warning('Error fetching blood type distribution:', [
                    'error' => $e->getMessage()
                ]);
                $bloodTypeDistribution = collect([]); // Return empty collection if table doesn't exist
            }

            return response()->json([
                'success' => true,
                'hospitalInfo' => $hospitalInfo,
                'metrics' => [
                    'urgentDonations' => $urgentDonations,
                    'regularAppointments' => $regularAppointments,
                    'pendingHomeVisits' => $pendingHomeVisits,
                    'phlebotomistsOnDuty' => $phlebotomistsOnDuty,
                    'criticalBloodShortages' => $criticalBloodShortages,
                    'pendingOrganMatches' => $pendingOrganMatches,
                ],
                'todayAppointments' => $todayAppointmentsList,
                'recentEvents' => $recentEvents,
                'summary' => [
                    'total_upcoming_appointments' => $totalUpcomingAppointments,
                    'total_completed_donations' => $totalCompletedDonations,
                    'blood_inventory_count' => $bloodInventoryCount,
                ],
                'monthly_trends' => $monthlyTrends,
                'donation_types' => $donationTypes,
                'blood_type_distribution' => $bloodTypeDistribution,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching hospital dashboard overview:', [
                'hospital_id' => $hospitalId ?? 'unknown',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data',
                'error' => config('app.debug') ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Get all appointments (home and hospital) for the authenticated hospital manager
     * Supports filtering by date range, donation type, urgency, and state
     */
    public function getAppointments(Request $request, $hospitalId = null)
    {
        try {
            // Get hospital ID from authenticated user if not provided
            if (!$hospitalId && $request->user()) {
                $user = $request->user();
                if ($user->role === 'manager' && $user->healthCenterManager) {
                    $hospitalId = $user->healthCenterManager->hospital_id;
                }
            }

            if (!$hospitalId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital ID required'
                ], 400);
            }

            $hospital = Hospital::find($hospitalId);
            if (!$hospital) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital not found'
                ], 404);
            }

            // Get filters from request
            $dateRange = $request->input('dateRange', 'all');
            $donationType = $request->input('donationType', 'all');
            $urgency = $request->input('urgency', 'all'); // appointment_type
            $state = $request->input('state', 'all');
            $phlebotomist = $request->input('phlebotomist', 'all');

            // Set up date range filter
            $today = Carbon::today();
            $startDate = null;
            $endDate = null;

            switch ($dateRange) {
                case 'today':
                    $startDate = $today->copy();
                    $endDate = $today->copy();
                    break;
                case 'week':
                    $startDate = $today->copy()->startOfWeek();
                    $endDate = $today->copy()->endOfWeek();
                    break;
                case 'month':
                    $startDate = $today->copy()->startOfMonth();
                    $endDate = $today->copy()->endOfMonth();
                    break;
                case 'all':
                default:
                    // No date filtering
                    break;
            }

            // Fetch Hospital Appointments
            $hospitalAppointmentsQuery = HospitalAppointment::where('hospital_Id', $hospitalId)
                ->with([
                    'donor.user',
                    'donor.bloodType',
                    'appointment' // Use singular relationship name
                ]);

            // Apply state filter
            if ($state !== 'all') {
                $hospitalAppointmentsQuery->where('state', $state);
            }

            // Filter by appointment type and donation type through appointments relationship
            if ($urgency !== 'all' || $donationType !== 'all') {
                $hospitalAppointmentsQuery->whereHas('appointment', function($query) use ($urgency, $donationType, $startDate, $endDate) {
                    if ($urgency !== 'all') {
                        $query->where('appointment_type', $urgency);
                    }
                    if ($donationType !== 'all') {
                        $query->where('donation_type', $donationType);
                    }
                    if ($startDate && $endDate) {
                        $query->whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()]);
                    } elseif ($startDate) {
                        $query->whereDate('appointment_date', '>=', $startDate->toDateString());
                    } elseif ($endDate) {
                        $query->whereDate('appointment_date', '<=', $endDate->toDateString());
                    }
                });
            } elseif ($startDate || $endDate) {
                $hospitalAppointmentsQuery->whereHas('appointment', function($query) use ($startDate, $endDate) {
                    if ($startDate && $endDate) {
                        $query->whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()]);
                    } elseif ($startDate) {
                        $query->whereDate('appointment_date', '>=', $startDate->toDateString());
                    } elseif ($endDate) {
                        $query->whereDate('appointment_date', '<=', $endDate->toDateString());
                    }
                });
            }

            $hospitalAppointments = $hospitalAppointmentsQuery->get();

            // Fetch Home Appointments
            $homeAppointmentsQuery = HomeAppointment::where('hospital_id', $hospitalId)
                ->with([
                    'donor.user',
                    'donor.bloodType',
                    'appointment',
                    'mobilePhlebotomist.user'
                ]);

            // Apply state filter
            if ($state !== 'all') {
                $homeAppointmentsQuery->where('state', $state);
            }

            // Filter by phlebotomist
            if ($phlebotomist !== 'all') {
                $homeAppointmentsQuery->where('phlebotomist_id', $phlebotomist);
            }

            // Filter by appointment type and donation type through appointment relationship
            if ($urgency !== 'all' || $donationType !== 'all') {
                $homeAppointmentsQuery->whereHas('appointment', function($query) use ($urgency, $donationType, $startDate, $endDate) {
                    if ($urgency !== 'all') {
                        $query->where('appointment_type', $urgency);
                    }
                    if ($donationType !== 'all') {
                        $query->where('donation_type', $donationType);
                    }
                    if ($startDate && $endDate) {
                        $query->whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()]);
                    } elseif ($startDate) {
                        $query->whereDate('appointment_date', '>=', $startDate->toDateString());
                    } elseif ($endDate) {
                        $query->whereDate('appointment_date', '<=', $endDate->toDateString());
                    }
                });
            } elseif ($startDate || $endDate) {
                $homeAppointmentsQuery->whereHas('appointment', function($query) use ($startDate, $endDate) {
                    if ($startDate && $endDate) {
                        $query->whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()]);
                    } elseif ($startDate) {
                        $query->whereDate('appointment_date', '>=', $startDate->toDateString());
                    } elseif ($endDate) {
                        $query->whereDate('appointment_date', '<=', $endDate->toDateString());
                    }
                });
            }

            $homeAppointments = $homeAppointmentsQuery->get();

            // Transform Hospital Appointments to unified format
            $hospitalApptsFormatted = $hospitalAppointments->map(function($apt) {
                // Get appointment - the relationship is belongsTo (singular) but named plural
                $appointment = null;
                $appointment = $apt->appointment;
                $donor = $apt->donor;
                $user = $donor ? $donor->user : null;

                return [
                    'id' => $apt->id,
                    'code' => $apt->code,
                    'type' => 'hospital',
                    'appointment_date' => $appointment ? $appointment->appointment_date : null,
                    'appointment_time' => $apt->appointment_time ?? ($appointment ? $appointment->appointment_time : null),
                    'appointment_type' => $appointment ? $appointment->appointment_type : null,
                    'donation_type' => $appointment ? $appointment->donation_type : null,
                    'state' => $apt->state,
                    'donor' => [
                        'id' => $donor ? $donor->id : null,
                        'code' => $donor ? $donor->code : null,
                        'user' => $user ? [
                            'id' => $user->id,
                            'first_name' => $user->first_name,
                            'middle_name' => $user->middle_name,
                            'last_name' => $user->last_name,
                            'email' => $user->email,
                            'phone_nb' => $user->phone_nb,
                        ] : null,
                        'bloodType' => $donor && $donor->bloodType ? [
                            'id' => $donor->bloodType->id,
                            'type' => $donor->bloodType->type,
                            'rh_factor' => $donor->bloodType->rh_factor,
                        ] : null,
                    ],
                    'mobilePhlebotomist' => null, // Hospital appointments don't have phlebotomists
                    'created_at' => $apt->created_at,
                    'updated_at' => $apt->updated_at,
                ];
            });

            // Transform Home Appointments to unified format
            $homeApptsFormatted = $homeAppointments->map(function($apt) {
                $appointment = $apt->appointment;
                $donor = $apt->donor;
                $user = $donor ? $donor->user : null;
                $phlebotomist = $apt->mobilePhlebotomist;
                $phlebotomistUser = $phlebotomist ? $phlebotomist->user : null;

                return [
                    'id' => $apt->id,
                    'code' => $apt->code,
                    'type' => 'home',
                    'appointment_date' => $appointment ? $appointment->appointment_date : null,
                    'appointment_time' => $apt->appointment_time ?? ($appointment ? $appointment->appointment_time : null),
                    'appointment_type' => $appointment ? $appointment->appointment_type : null,
                    'donation_type' => $appointment ? $appointment->donation_type : null,
                    'state' => $apt->state,
                    'donor' => [
                        'id' => $donor ? $donor->id : null,
                        'code' => $donor ? $donor->code : null,
                        'user' => $user ? [
                            'id' => $user->id,
                            'first_name' => $user->first_name,
                            'middle_name' => $user->middle_name,
                            'last_name' => $user->last_name,
                            'email' => $user->email,
                            'phone_nb' => $user->phone_nb,
                        ] : null,
                        'bloodType' => $donor && $donor->bloodType ? [
                            'id' => $donor->bloodType->id,
                            'type' => $donor->bloodType->type,
                            'rh_factor' => $donor->bloodType->rh_factor,
                        ] : null,
                    ],
                    'mobilePhlebotomist' => $phlebotomist ? [
                        'id' => $phlebotomist->id,
                        'code' => $phlebotomist->code,
                        'user' => $phlebotomistUser ? [
                            'id' => $phlebotomistUser->id,
                            'first_name' => $phlebotomistUser->first_name,
                            'middle_name' => $phlebotomistUser->middle_name,
                            'last_name' => $phlebotomistUser->last_name,
                            'phone_nb'=> $phlebotomistUser->phone_nb,
                        ] : null,
                    ] : null,
                    'created_at' => $apt->created_at,
                    'updated_at' => $apt->updated_at,
                ];
            });

            // Merge and sort by appointment date
            // Convert both to regular collections since they contain arrays, not model instances
            $hospitalCollection = \Illuminate\Support\Collection::make($hospitalApptsFormatted->toArray());
            $homeCollection = \Illuminate\Support\Collection::make($homeApptsFormatted->toArray());
            
            $allAppointments = $hospitalCollection->merge($homeCollection)
                ->sortBy(function($apt) {
                    return $apt['appointment_date'] ?? '';
                })
                ->values();

            return response()->json([
                'success' => true,
                'appointments' => $allAppointments,
                'total' => $allAppointments->count(),
                'filters' => [
                    'dateRange' => $dateRange,
                    'donationType' => $donationType,
                    'urgency' => $urgency,
                    'state' => $state,
                    'phlebotomist' => $phlebotomist,
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching hospital appointments:', [
                'hospital_id' => $hospitalId ?? 'unknown',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch appointments',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }
}
