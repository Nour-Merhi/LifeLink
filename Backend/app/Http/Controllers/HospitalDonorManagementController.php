<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Models\Hospital;
use App\Models\HospitalAppointment;
use App\Models\HomeAppointment;
use App\Models\MobilePhlebotomist;
use App\Models\User;
use App\Services\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HospitalDonorManagementController extends Controller
{
    /**
     * Get all donors for a specific hospital with filters
     * Includes donors who have appointments (hospital or home) with this hospital
     * Supports filtering by donation type, appointment type, and status
     */
    public function getDonors(Request $request, $hospitalId = null)
    {
        try {
            // Get hospital ID from parameter, request, or authenticated user
            // Resolve hospital from authenticated manager regardless of role casing ("manager" vs "Manager").
            // This prevents 400s when role is stored with different capitalization.
            if ($request->user()) {
                $user = $request->user();
                if ($user->healthCenterManager && $user->healthCenterManager->hospital_id) {
                    $hospitalId = $user->healthCenterManager->hospital_id;
                }
            }
            
            $hospitalId = $hospitalId ?? $request->input('hospital_id');
            
            if (!$hospitalId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital ID is required'
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
            $donationType = $request->input('donation_type'); // 'Home Blood Donation', 'Hospital Blood Donation', 'Alive Organ Donation', or null (all)
            $appointmentType = $request->input('appointment_type'); // 'urgent', 'regular', or null (all)
            $status = $request->input('status'); // 'pending', 'completed', 'canceled', or null (all)

            // Get donor IDs based on filters
            $hospitalAppointmentDonorIds = collect();
            $homeAppointmentDonorIds = collect();

            // Filter hospital appointments
            $hospitalApptQuery = HospitalAppointment::where('hospital_Id', $hospitalId);
            
            if ($status) {
                $hospitalApptQuery->where('state', $status);
            }
            
            // If filtering by appointment type or donation type, need to check related appointment
            if ($appointmentType || $donationType) {
                $hospitalApptQuery->whereHas('appointments', function($query) use ($appointmentType, $donationType) {
                    if ($appointmentType) {
                        $query->where('appointment_type', $appointmentType);
                    }
                    if ($donationType) {
                        $query->where('donation_type', $donationType);
                    }
                });
            }
            
            $hospitalAppointmentDonorIds = $hospitalApptQuery->distinct()->pluck('donor_id')->filter();

            // Filter home appointments
            $homeApptQuery = HomeAppointment::where('hospital_id', $hospitalId);
            
            if ($status) {
                $homeApptQuery->where('state', $status);
            }
            
            // If filtering by appointment type or donation type, need to check related appointment
            if ($appointmentType || $donationType) {
                $homeApptQuery->whereHas('appointment', function($query) use ($appointmentType, $donationType) {
                    if ($appointmentType) {
                        $query->where('appointment_type', $appointmentType);
                    }
                    if ($donationType) {
                        $query->where('donation_type', $donationType);
                    }
                });
            }
            
            $homeAppointmentDonorIds = $homeApptQuery->distinct()->pluck('donor_id')->filter();

            // Combine and get unique donor IDs
            $allDonorIds = $hospitalAppointmentDonorIds->merge($homeAppointmentDonorIds)->unique();

            // Get donors with their user information and related data
            $donors = Donor::whereIn('id', $allDonorIds)
                ->with([
                    'user',
                    'bloodType',
                    'hospitalAppointments.appointments' => function($query) use ($hospitalId, $appointmentType, $donationType, $status) {
                        $query->where('hospital_id', $hospitalId);
                        if ($appointmentType) {
                            $query->where('appointment_type', $appointmentType);
                        }
                        if ($donationType) {
                            $query->where('donation_type', $donationType);
                        }
                    },
                    'hospitalAppointments' => function($query) use ($hospitalId, $status) {
                        $query->where('hospital_Id', $hospitalId);
                        if ($status) {
                            $query->where('state', $status);
                        }
                    },
                    'homeAppointments.appointment' => function($query) use ($hospitalId, $appointmentType, $donationType) {
                        $query->where('hospital_id', $hospitalId);
                        if ($appointmentType) {
                            $query->where('appointment_type', $appointmentType);
                        }
                        if ($donationType) {
                            $query->where('donation_type', $donationType);
                        }
                    },
                    'homeAppointments' => function($query) use ($hospitalId, $status) {
                        $query->where('hospital_id', $hospitalId);
                        if ($status) {
                            $query->where('state', $status);
                        }
                    }
                ])
                ->get()
                ->map(function($donor) use ($hospitalId, $appointmentType, $donationType, $status) {
                    $user = $donor->user;
                    
                    // Calculate age
                    $age = null;
                    if ($donor->date_of_birth) {
                        $birthDate = Carbon::parse($donor->date_of_birth);
                        $age = $birthDate->age;
                    }

                    // Get appointments for this hospital (already filtered by relationships above)
                    $hospitalAppointments = $donor->hospitalAppointments->filter(function($apt) use ($appointmentType, $donationType) {
                        $appointment = $apt->appointments;
                        if (!$appointment) return false;
                        if ($appointmentType && $appointment->appointment_type !== $appointmentType) return false;
                        if ($donationType && $appointment->donation_type !== $donationType) return false;
                        return true;
                    });
                    
                    $homeAppointments = $donor->homeAppointments->filter(function($apt) use ($appointmentType, $donationType) {
                        $appointment = $apt->appointment;
                        if (!$appointment) return false;
                        if ($appointmentType && $appointment->appointment_type !== $appointmentType) return false;
                        if ($donationType && $appointment->donation_type !== $donationType) return false;
                        return true;
                    });

                    $totalDonations = $hospitalAppointments->where('state', 'completed')->count() 
                                   + $homeAppointments->where('state', 'completed')->count();

                    $pendingAppointments = $hospitalAppointments->where('state', 'pending')->count()
                                        + $homeAppointments->where('state', 'pending')->count();

                    // Get last donation date
                    $lastDonation = null;
                    $lastHospitalAppointment = $hospitalAppointments->where('state', 'completed')
                        ->sortByDesc('created_at')
                        ->first();
                    $lastHomeAppointment = $homeAppointments->where('state', 'completed')
                        ->sortByDesc('created_at')
                        ->first();

                    if ($lastHospitalAppointment || $lastHomeAppointment) {
                        $dates = collect([
                            $lastHospitalAppointment ? $lastHospitalAppointment->created_at : null,
                            $lastHomeAppointment ? $lastHomeAppointment->created_at : null,
                            $donor->last_donation
                        ])->filter()->sortDesc()->first();
                        
                        if ($dates) {
                            $lastDonation = Carbon::parse($dates)->format('Y-m-d');
                        }
                    }

                    // Get latest appointment info
                    $latestHospitalAppt = $hospitalAppointments->sortByDesc('created_at')->first();
                    $latestHomeAppt = $homeAppointments->sortByDesc('created_at')->first();
                    
                    $latestAppt = collect([$latestHospitalAppt, $latestHomeAppt])
                        ->filter()
                        ->sortByDesc(function($apt) {
                            return $apt->created_at ? $apt->created_at->timestamp : 0;
                        })
                        ->first();
                    
                    $latestAppointmentType = null;
                    $latestAppointmentStatus = null;
                    $latestAppointmentDate = null;
                    $latestDonationType = null;
                    $latestAppointmentId = null;
                    $latestAppointmentTypeDb = null; // 'hospital' or 'home'
                    
                    if ($latestAppt) {
                        $latestAppointmentStatus = $latestAppt->state;
                        $latestAppointmentId = $latestAppt->id;
                        
                        if ($latestAppt instanceof HospitalAppointment) {
                            $latestAppointmentTypeDb = 'hospital';
                            $appointment = $latestAppt->appointments;
                            if ($appointment) {
                                $latestAppointmentType = $appointment->appointment_type;
                                $latestDonationType = $appointment->donation_type;
                                $latestAppointmentDate = $appointment->appointment_date;
                            }
                        } else {
                            $latestAppointmentTypeDb = 'home';
                            $appointment = $latestAppt->appointment;
                            if ($appointment) {
                                $latestAppointmentType = $appointment->appointment_type;
                                $latestDonationType = $appointment->donation_type;
                                $latestAppointmentDate = $appointment->appointment_date;
                            }
                        }
                    }

                    return [
                        'id' => $donor->id,
                        'code' => $donor->code,
                        'name' => $user ? trim(($user->first_name ?? '') . ' ' . ($user->middle_name ?? '') . ' ' . ($user->last_name ?? '')) : 'N/A',
                        'email' => $user ? $user->email : null,
                        'phone_nb' => $user ? $user->phone_nb : null,
                        'age' => $age,
                        'gender' => $donor->gender,
                        'blood_type' => $donor->bloodType ? $donor->bloodType->type . ($donor->bloodType->rh_factor ?? '') : null,
                        'blood_type_id' => $donor->blood_type_id,
                        'last_donation' => $lastDonation,
                        'date_of_birth' => $donor->date_of_birth,
                        'address' => $donor->address ?? ($user ? $user->address : null) ?? null,
                        'medical_conditions' => $donor->medical_conditions ?? [],
                        'total_donations' => $totalDonations,
                        'pending_appointments' => $pendingAppointments,
                        'status' => $donor->status ?? 'active',
                        'availability' => $donor->availability ?? null,
                        'organ_consent' => $donor->organ_consent ?? false,
                        'weight' => $donor->weight ?? null,
                        'emergency_contact_name' => $donor->emergency_contact_name ?? null,
                        'emergency_contact_phone' => $donor->emergency_contact_phone ?? null,
                        'hospital_appointments_count' => $hospitalAppointments->count(),
                        'home_appointments_count' => $homeAppointments->count(),
                        'latest_appointment_type' => $latestAppointmentType,
                        'latest_appointment_status' => $latestAppointmentStatus,
                        'latest_appointment_date' => $latestAppointmentDate,
                        'latest_donation_type' => $latestDonationType,
                        'latest_appointment_id' => $latestAppointmentId,
                        'latest_appointment_type_db' => $latestAppointmentTypeDb, // 'hospital' or 'home'
                    ];
                })
                ->sortBy('name')
                ->values();

            return response()->json([
                'success' => true,
                'donors' => $donors,
                'total' => $donors->count(),
                'filters' => [
                    'donation_type' => $donationType,
                    'appointment_type' => $appointmentType,
                    'status' => $status,
                ],
                'hospital' => [
                    'id' => $hospital->id,
                    'name' => $hospital->name,
                    'code' => $hospital->code,
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching hospital donors:', [
                'hospital_id' => $hospitalId ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch donors',
                'error' => $e->getMessage(),
                'donors' => [],
                'total' => 0,
            ], 500);
        }
    }

    /**
     * Bulk delete donors "records" for this hospital (appointment registrations).
     * This does NOT delete the donor account globally; it removes the donor's
     * home + hospital appointment entries that are associated with this hospital.
     */
    public function bulkDeleteDonorsForHospital(Request $request)
    {
        $validated = $request->validate([
            'donor_ids' => ['required', 'array', 'min:1'],
            'donor_ids.*' => ['integer'],
        ]);

        $user = $request->user();
        $hospitalId = null;
        if ($user && $user->healthCenterManager && $user->healthCenterManager->hospital_id) {
            $hospitalId = $user->healthCenterManager->hospital_id;
        }

        if (!$hospitalId) {
            return response()->json([
                'success' => false,
                'message' => 'Hospital ID is required',
            ], 400);
        }

        $donorIds = collect($validated['donor_ids'])->unique()->values()->all();

        try {
            $result = DB::transaction(function () use ($hospitalId, $donorIds) {
                $deletedHospitalAppointments = HospitalAppointment::where('hospital_Id', $hospitalId)
                    ->whereIn('donor_id', $donorIds)
                    ->delete();

                $deletedHomeAppointments = HomeAppointment::where('hospital_id', $hospitalId)
                    ->whereIn('donor_id', $donorIds)
                    ->delete();

                return [
                    'deleted_hospital_appointments' => $deletedHospitalAppointments,
                    'deleted_home_appointments' => $deletedHomeAppointments,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Deleted donor appointment records for this hospital',
                'data' => $result,
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error bulk deleting hospital donor records:', [
                'hospital_id' => $hospitalId,
                'donor_ids' => $donorIds,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete selected donors records',
            ], 500);
        }
    }

    /**
     * Get a single donor's details for a hospital
     */
    public function getDonor(Request $request, $hospitalId, $donorCode)
    {
        try {
            $hospital = Hospital::find($hospitalId);
            if (!$hospital) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital not found'
                ], 404);
            }

            $donor = Donor::where('code', $donorCode)
                ->with([
                    'user',
                    'bloodType',
                    'hospitalAppointments.appointments.hospital',
                    'homeAppointments.appointment.hospital',
                    'hospitalAppointments' => function($query) use ($hospitalId) {
                        // Note: Using 'hospital_Id' (capital I) to match database column
                        $query->where('hospital_Id', $hospitalId)
                              ->orderBy('created_at', 'desc');
                    },
                    'homeAppointments' => function($query) use ($hospitalId) {
                        $query->where('hospital_id', $hospitalId)
                              ->orderBy('created_at', 'desc');
                    }
                ])
                ->first();

            if (!$donor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Donor not found'
                ], 404);
            }

            // Check if donor has any appointments with this hospital
            $hasAppointments = $donor->hospitalAppointments->count() > 0 
                            || $donor->homeAppointments->count() > 0;

            if (!$hasAppointments) {
                return response()->json([
                    'success' => false,
                    'message' => 'Donor has no appointments with this hospital'
                ], 403);
            }

            $user = $donor->user;

            // Calculate age
            $age = null;
            if ($donor->date_of_birth) {
                $birthDate = Carbon::parse($donor->date_of_birth);
                $age = $birthDate->age;
            }

            // Get appointment history
            $appointmentHistory = collect()
                ->merge($donor->hospitalAppointments->map(function($apt) {
                    return [
                        'id' => $apt->id,
                        'code' => $apt->code,
                        'type' => 'hospital',
                        'state' => $apt->state,
                        'appointment_date' => $apt->appointments->appointment_date ?? null,
                        'appointment_time' => $apt->appointment_time ?? null,
                        'created_at' => $apt->created_at,
                    ];
                }))
                ->merge($donor->homeAppointments->map(function($apt) {
                    return [
                        'id' => $apt->id,
                        'code' => $apt->code,
                        'type' => 'home',
                        'state' => $apt->state,
                        'appointment_date' => $apt->appointment->appointment_date ?? null,
                        'appointment_time' => $apt->appointment_time ?? null,
                        'created_at' => $apt->created_at,
                    ];
                }))
                ->sortByDesc('created_at')
                ->values();

            return response()->json([
                'success' => true,
                'donor' => [
                    'id' => $donor->id,
                    'code' => $donor->code,
                    'name' => $user ? trim(($user->first_name ?? '') . ' ' . ($user->middle_name ?? '') . ' ' . ($user->last_name ?? '')) : 'N/A',
                    'email' => $user ? $user->email : null,
                    'phone_nb' => $user ? $user->phone_nb : null,
                    'age' => $age,
                    'gender' => $donor->gender,
                    'blood_type' => $donor->bloodType ? $donor->bloodType->type . ($donor->bloodType->rh_factor ?? '') : null,
                    'date_of_birth' => $donor->date_of_birth,
                    'address' => $donor->address ?? $user->address ?? null,
                    'medical_conditions' => $donor->medical_conditions ?? [],
                    'last_donation' => $donor->last_donation,
                    'status' => $donor->status ?? 'active',
                    'availability' => $donor->availability ?? null,
                    'organ_consent' => $donor->organ_consent ?? false,
                    'weight' => $donor->weight ?? null,
                    'emergency_contact_name' => $donor->emergency_contact_name ?? null,
                    'emergency_contact_phone' => $donor->emergency_contact_phone ?? null,
                    'appointment_history' => $appointmentHistory,
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching hospital donor:', [
                'hospital_id' => $hospitalId,
                'donor_code' => $donorCode,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch donor details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update appointment status for a donor
     */
    public function updateAppointmentStatus(Request $request, $hospitalId, $donorId)
    {
        try {
            $validated = $request->validate([
                'appointment_id' => 'required|integer',
                'appointment_type' => 'required|in:hospital,home',
                'status' => 'required|in:pending,completed,canceled'
            ]);

            $hospital = Hospital::findOrFail($hospitalId);

            // Verify the appointment belongs to this hospital and donor
            if ($validated['appointment_type'] === 'hospital') {
                $appointment = HospitalAppointment::where('id', $validated['appointment_id'])
                    ->where('hospital_Id', $hospitalId)
                    ->where('donor_id', $donorId)
                    ->firstOrFail();
                
                // Check if state is being changed to 'completed' to award XP
                $wasCompleted = $appointment->state === 'completed';
                $willBeCompleted = $validated['status'] === 'completed' && !$wasCompleted;
                
                $appointment->state = $validated['status'];
                if ($validated['status'] === 'completed' && !$wasCompleted) {
                    $appointment->completed_at = now();
                    try {
                        $appointment->expires_at = Carbon::parse($appointment->completed_at)->addDays(42)->toDateString();
                    } catch (\Exception $e) {
                        $appointment->expires_at = null;
                    }
                }
                if ($validated['status'] !== 'completed') {
                    $appointment->completed_at = null;
                    $appointment->expires_at = null;
                }
                $appointment->save();

                // Award XP if donation was just completed
                if ($willBeCompleted && $appointment->donor_id) {
                    try {
                        XpService::awardBloodDonationXp(
                            $appointment->donor_id,
                            HospitalAppointment::class,
                            $appointment->id
                        );
                    } catch (\Exception $e) {
                        \Log::warning('Failed to award XP for hospital appointment:', [
                            'appointment_id' => $appointment->id,
                            'donor_id' => $appointment->donor_id,
                            'error' => $e->getMessage()
                        ]);
                        // Continue even if XP award fails
                    }
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Hospital appointment status updated successfully',
                    'appointment' => [
                        'id' => $appointment->id,
                        'code' => $appointment->code,
                        'state' => $appointment->state,
                    ]
                ], 200);

            } else {
                $appointment = HomeAppointment::where('id', $validated['appointment_id'])
                    ->where('hospital_id', $hospitalId)
                    ->where('donor_id', $donorId)
                    ->firstOrFail();
                
                // Check if state is being changed to 'completed' to award XP
                $wasCompleted = $appointment->state === 'completed';
                $willBeCompleted = $validated['status'] === 'completed' && !$wasCompleted;
                
                $appointment->state = $validated['status'];
                if ($validated['status'] === 'completed' && !$wasCompleted) {
                    $appointment->completed_at = now();
                    try {
                        $appointment->expires_at = Carbon::parse($appointment->completed_at)->addDays(42)->toDateString();
                    } catch (\Exception $e) {
                        $appointment->expires_at = null;
                    }
                }
                if ($validated['status'] !== 'completed') {
                    $appointment->completed_at = null;
                    $appointment->expires_at = null;
                }
                $appointment->save();

                // If the home appointment is finished (completed/canceled), free up the assigned phlebotomist.
                if (in_array($validated['status'], ['completed', 'canceled'], true) && $appointment->phlebotomist_id) {
                    $p = MobilePhlebotomist::find($appointment->phlebotomist_id);
                    if ($p) {
                        if (strtolower((string)($p->status ?? '')) === 'inactive') {
                            $p->availability = 'unavailable';
                        } else {
                            $p->availability = 'available';
                        }
                        $p->save();
                    }
                }

                // Award XP if donation was just completed
                if ($willBeCompleted && $appointment->donor_id) {
                    try {
                        XpService::awardBloodDonationXp(
                            $appointment->donor_id,
                            HomeAppointment::class,
                            $appointment->id
                        );
                    } catch (\Exception $e) {
                        \Log::warning('Failed to award XP for home appointment:', [
                            'appointment_id' => $appointment->id,
                            'donor_id' => $appointment->donor_id,
                            'error' => $e->getMessage()
                        ]);
                        // Continue even if XP award fails
                    }
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Home appointment status updated successfully',
                    'appointment' => [
                        'id' => $appointment->id,
                        'code' => $appointment->code,
                        'state' => $appointment->state,
                    ]
                ], 200);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Appointment not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error updating appointment status:', [
                'hospital_id' => $hospitalId,
                'donor_id' => $donorId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update appointment status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get latest appointment for a donor at this hospital
     */
    public function getDonorLatestAppointment(Request $request, $hospitalId, $donorId)
    {
        try {
            $hospital = Hospital::findOrFail($hospitalId);

            // Get latest hospital appointment
            $latestHospitalAppt = HospitalAppointment::where('hospital_Id', $hospitalId)
                ->where('donor_id', $donorId)
                ->with('appointments')
                ->latest('created_at')
                ->first();

            // Get latest home appointment
            $latestHomeAppt = HomeAppointment::where('hospital_id', $hospitalId)
                ->where('donor_id', $donorId)
                ->with('appointment')
                ->latest('created_at')
                ->first();

            // Determine which is more recent
            $latestAppointment = null;
            $appointmentType = null;

            if ($latestHospitalAppt && $latestHomeAppt) {
                if ($latestHospitalAppt->created_at > $latestHomeAppt->created_at) {
                    $latestAppointment = $latestHospitalAppt;
                    $appointmentType = 'hospital';
                } else {
                    $latestAppointment = $latestHomeAppt;
                    $appointmentType = 'home';
                }
            } elseif ($latestHospitalAppt) {
                $latestAppointment = $latestHospitalAppt;
                $appointmentType = 'hospital';
            } elseif ($latestHomeAppt) {
                $latestAppointment = $latestHomeAppt;
                $appointmentType = 'home';
            }

            if (!$latestAppointment) {
                return response()->json([
                    'success' => false,
                    'message' => 'No appointments found for this donor'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'appointment' => [
                    'id' => $latestAppointment->id,
                    'code' => $latestAppointment->code,
                    'type' => $appointmentType,
                    'status' => $latestAppointment->state,
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching latest appointment:', [
                'hospital_id' => $hospitalId,
                'donor_id' => $donorId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch appointment',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

