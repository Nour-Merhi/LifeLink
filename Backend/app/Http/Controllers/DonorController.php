<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Models\User;
use App\Models\BloodType;
use App\Models\HomeAppointment;
use App\Models\HospitalAppointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DonorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Get all donors with user relationship, ordered by newest first
        $donors = Donor::with('user')
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Get donor IDs
        $donorIds = $donors->pluck('id')->toArray();
        
        // Get the most recent home appointment with coordinates for each donor (optimized query)
        $latestHomeAppointments = HomeAppointment::whereIn('donor_id', $donorIds)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select('donor_id', 'latitude', 'longitude', 'address', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('donor_id')
            ->map(function ($appointments) {
                return $appointments->first(); // Get the most recent one
            });
        
        $formattedDonors = $donors->map(function ($donor) use ($latestHomeAppointments) {
            $donorArray = $donor->toArray();
            
            // Add latitude and longitude from the most recent home appointment if available
            if ($latestHomeAppointments->has($donor->id)) {
                $latestAppointment = $latestHomeAppointments->get($donor->id);
                $donorArray['latitude'] = $latestAppointment->latitude;
                $donorArray['longitude'] = $latestAppointment->longitude;
                // Also update address if it's not set or if home appointment has a more recent address
                if (empty($donorArray['address']) || !$donorArray['address']) {
                    $donorArray['address'] = $latestAppointment->address;
                }
            } else {
                $donorArray['latitude'] = null;
                $donorArray['longitude'] = null;
            }
            
            return $donorArray;
        });
        
        return response()->json([
            'donors' => $formattedDonors,
            'total' => $formattedDonors->count()
        ], 200);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name'=> 'required|string|max:100',
            'middle_name'=> 'nullable|string|max:100',
            'last_name'=> 'required|string|max:100',
            'email'=> 'required|email|unique:users,email',
            'phone_nb'=> 'required|string|max:30|unique:users,phone_nb',
            'password'=> [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',       // uppercase
                'regex:/[a-z]/',       // lowercase
                'regex:/[0-9]/',       // number
                'regex:/[^A-Za-z0-9]/' // special
            ],
            'gender'=> 'required|in:male,female',
            'date_of_birth'=> 'required|date|before:today',
            'blood_type_id' => 'required|exists:blood_types,id',
            'last_donation' => 'nullable|date|before_or_equal:today',
            'city' => 'nullable|string|max:100',
        ]);

        $result = DB::transaction(function () use ($validated) {
            $user = User::create([
                'first_name'=> $validated['first_name'],
                'middle_name'=> $validated['middle_name'] ?? null,
                'last_name'=> $validated['last_name'] ?? '',
                'email'=> $validated['email'],
                'phone_nb'=> $validated['phone_nb'],
                'city'=> $validated['city'] ?? null,
                'role'=> 'donor',
                'password'=> Hash::make($validated['password']),
            ]);

            $donor = Donor::create([
                'user_id'=> $user->id,
                'gender'=> $validated['gender'],
                'date_of_birth'=> $validated['date_of_birth'],
                'blood_type_id'=> $validated['blood_type_id'],
                'last_donation'=> $validated['last_donation'] ?? null,
            ]);

            return [$user, $donor];
        });

        [$user, $donor] = $result;

        return response()->json([
            'message' => 'Donor created successfully',
            'user' => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone_nb' => $user->phone_nb,
            ],
            'donor' => [
                'userID' => $donor->userID,
                'gender' => $donor->gender,
                'date_of_birth' => $donor->date_of_birth,
                'blood_type_id' => $donor->blood_type_id,
            ]
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($code)
    {
        try {
            // Find donor by code
            $donor = Donor::where('code', $code)
                ->with([
                    'user',
                    'bloodType',
                    'homeAppointments.appointment.hospital',
                    'homeAppointments.mobilePhlebotomist.user',
                    'hospitalAppointments.appointment.hospital'
                ])
                ->firstOrFail();

            // Calculate age
            $age = null;
            if ($donor->date_of_birth) {
                $birthDate = new \DateTime($donor->date_of_birth);
                $today = new \DateTime();
                $age = $today->diff($birthDate)->y;
            }

            // Get organ pledges - match by email since they might not have user_id
            $livingDonor = \App\Models\LivingDonor::where('email', $donor->user->email)->first();
            $afterDeathPledge = \App\Models\AfterDeathPledge::where('email', $donor->user->email)->first();

            // Combine all appointments
            $allAppointments = collect([]);
            
            // Add home appointments
            foreach ($donor->homeAppointments as $homeAppt) {
                $allAppointments->push([
                    'id' => $homeAppt->code,
                    'date' => $homeAppt->appointment->appointment_date ?? null,
                    'time' => $homeAppt->appointment_time ?? null,
                    'status' => $homeAppt->state === 'canceled' ? 'canceled' : ($homeAppt->state === 'completed' ? 'completed' : 'pending'),
                    'type' => 'Home Blood Donation',
                    'hospital' => $homeAppt->appointment->hospital->name ?? 'N/A',
                    'notes' => $homeAppt->note ?? 'No notes',
                    'created_at' => $homeAppt->created_at
                ]);
            }
            
            // Add hospital appointments
            foreach ($donor->hospitalAppointments as $hospAppt) {
                $allAppointments->push([
                    'id' => $hospAppt->code,
                    'date' => $hospAppt->appointment->appointment_date ?? null,
                    'time' => $hospAppt->appointment->appointment_time ?? null,
                    'status' => $hospAppt->state === 'canceled' ? 'canceled' : ($hospAppt->state === 'completed' ? 'completed' : 'pending'),
                    'type' => 'Hospital Blood Donation',
                    'hospital' => $hospAppt->appointment->hospital->name ?? 'N/A',
                    'notes' => $hospAppt->note ?? 'No notes',
                    'created_at' => $hospAppt->created_at
                ]);
            }

            // Sort by date (most recent first)
            $allAppointments = $allAppointments->sortByDesc('created_at')->values();
            
            // Calculate total donations (completed appointments)
            $totalDonations = $donor->donation_nb ?? count($allAppointments->where('status', 'completed'));

            // Process pledged organs
            $pledgedOrgans = [];
            if ($livingDonor && $livingDonor->organ) {
                $organ = is_array($livingDonor->organ) ? $livingDonor->organ : json_decode($livingDonor->organ, true);
                if (is_array($organ)) {
                    $pledgedOrgans = array_merge($pledgedOrgans, $organ);
                } elseif (is_string($livingDonor->organ)) {
                    $pledgedOrgans[] = $livingDonor->organ;
                }
            }
            if ($afterDeathPledge && $afterDeathPledge->pledged_organs) {
                $organs = is_array($afterDeathPledge->pledged_organs) ? $afterDeathPledge->pledged_organs : json_decode($afterDeathPledge->pledged_organs, true);
                if (is_array($organs)) {
                    $pledgedOrgans = array_merge($pledgedOrgans, $organs);
                }
            }

            return response()->json([
                'donor' => [
                    'id' => $donor->id,
                    'code' => $donor->code,
                    'name' => trim(($donor->user->first_name ?? '') . ' ' . ($donor->user->middle_name ?? '') . ' ' . ($donor->user->last_name ?? '')),
                    'age' => $age,
                    'gender' => $donor->gender,
                    'blood_type' => $donor->bloodType ? ($donor->bloodType->type . $donor->bloodType->rh_factor) : 'N/A',
                    'total_donations' => $totalDonations,
                    'last_donation' => $donor->last_donation,
                    'status' => $donor->status ?? 'active',
                    'registration_date' => $donor->created_at->format('Y-m-d'),
                    'verification_status' => 'verified', // You can add this field to donors table if needed
                    'account_status' => $donor->status ?? 'active',
                ],
                'contact' => [
                    'phone' => $donor->user->phone_nb ?? 'N/A',
                    'email' => $donor->user->email ?? 'N/A',
                    'address' => 'N/A', // Address can be added later if needed
                ],
                'organ_pledges' => [
                    'living_donation' => $livingDonor ? 'Yes' : 'No',
                    'after_death' => $afterDeathPledge ? 'Yes' : 'No',
                    'pledged_organs' => array_unique($pledgedOrgans)
                ],
                'appointments' => $allAppointments,
                'medical_conditions' => $donor->medical_conditions ?? []
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching donor details:', [
                'code' => $code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Donor not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Donor $donor)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $code)
    {
        try {
            $donor = Donor::where('code', $code)->with('user')->firstOrFail();
            
            $validated = $request->validate([
                'first_name' => 'sometimes|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'sometimes|string|max:100',
                'email' => 'sometimes|email|unique:users,email,' . $donor->user_id,
                'phone_nb' => 'sometimes|string|max:30|unique:users,phone_nb,' . $donor->user_id,
                'gender' => 'sometimes|in:male,female',
                'date_of_birth' => 'sometimes|date|before:today',
                'blood_type_id' => 'sometimes|exists:blood_types,id',
                'status' => 'sometimes|in:active,inactive,blocked',
            ]);

            DB::transaction(function () use ($donor, $validated) {
                // Update user information
                if (isset($validated['first_name']) || isset($validated['last_name']) || isset($validated['email']) || isset($validated['phone_nb'])) {
                    $userData = [];
                    if (isset($validated['first_name'])) $userData['first_name'] = $validated['first_name'];
                    if (isset($validated['middle_name'])) $userData['middle_name'] = $validated['middle_name'];
                    if (isset($validated['last_name'])) $userData['last_name'] = $validated['last_name'];
                    if (isset($validated['email'])) $userData['email'] = $validated['email'];
                    if (isset($validated['phone_nb'])) $userData['phone_nb'] = $validated['phone_nb'];
                    
                    $donor->user->update($userData);
                }

                // Update donor information
                $donorData = [];
                if (isset($validated['gender'])) $donorData['gender'] = $validated['gender'];
                if (isset($validated['date_of_birth'])) $donorData['date_of_birth'] = $validated['date_of_birth'];
                if (isset($validated['blood_type_id'])) $donorData['blood_type_id'] = $validated['blood_type_id'];
                if (isset($validated['status'])) $donorData['status'] = $validated['status'];
                
                if (!empty($donorData)) {
                    $donor->update($donorData);
                }
            });

            $donor->refresh();
            $donor->load('user', 'bloodType');

            return response()->json([
                'message' => 'Donor updated successfully',
                'donor' => $donor
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Donor not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error updating donor:', [
                'code' => $code,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Failed to update donor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($code)
    {
        try {
            $donor = Donor::where('code', $code)->with('user')->firstOrFail();
            
            // Check if donor has active appointments
            $hasActiveAppointments = $donor->homeAppointments()
                ->where('state', '!=', 'canceled')
                ->exists() || $donor->hospitalAppointments()
                ->where('state', '!=', 'canceled')
                ->exists();
            
            if ($hasActiveAppointments) {
                return response()->json([
                    'message' => 'Cannot delete donor. There are active appointments associated with this donor.'
                ], 422);
            }

            DB::transaction(function () use ($donor) {
                // Delete user (cascade will handle donor deletion)
                $donor->user->delete();
            });

            return response()->json([
                'message' => 'Donor deleted successfully'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Donor not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting donor:', [
                'code' => $code,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Failed to delete donor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all blood types
     */
    public function getBloodTypes()
    {
        $bloodTypes = BloodType::orderBy('id', 'asc')->get();
        
        return response()->json([
            'blood_types' => $bloodTypes,
            'total' => $bloodTypes->count()
        ], 200);
    }

    /**
     * Check donor eligibility for blood donation (56-day rule)
     * Returns days remaining until eligible, or 0 if eligible
     */
    public function checkEligibility(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'eligible' => true,
                    'daysRemaining' => 0,
                    'lastDonationDate' => null,
                    'message' => 'Guest users are eligible (eligibility will be checked on submission)'
                ], 200);
            }

            $donor = Donor::where('user_id', $user->id)->first();
            
            if (!$donor) {
                // No donor record means they've never donated
                return response()->json([
                    'eligible' => true,
                    'daysRemaining' => 0,
                    'lastDonationDate' => null,
                    'message' => 'Eligible to donate'
                ], 200);
            }

            // Get the most recent completed hospital appointment
            $lastHospitalAppt = HospitalAppointment::where('donor_id', $donor->id)
                ->where('state', 'completed')
                ->with('appointments')
                ->get()
                ->filter(function($appt) {
                    return $appt->appointments && $appt->appointments->appointment_date;
                })
                ->sortByDesc(function($appt) {
                    return $appt->appointments->appointment_date;
                })
                ->first();
            
            // Get the most recent completed home appointment
            $lastHomeAppt = HomeAppointment::where('donor_id', $donor->id)
                ->where('state', 'completed')
                ->with('appointment')
                ->get()
                ->filter(function($appt) {
                    return $appt->appointment && $appt->appointment->appointment_date;
                })
                ->sortByDesc(function($appt) {
                    return $appt->appointment->appointment_date;
                })
                ->first();
            
            // Get the most recent donation date from either type
            $hospitalDate = $lastHospitalAppt && $lastHospitalAppt->appointments 
                ? Carbon::parse($lastHospitalAppt->appointments->appointment_date) 
                : null;
            $homeDate = $lastHomeAppt && $lastHomeAppt->appointment 
                ? Carbon::parse($lastHomeAppt->appointment->appointment_date) 
                : null;
            
            $lastDonationDate = null;
            if ($hospitalDate && $homeDate) {
                $lastDonationDate = $hospitalDate->greaterThan($homeDate) ? $hospitalDate : $homeDate;
            } elseif ($hospitalDate) {
                $lastDonationDate = $hospitalDate;
            } elseif ($homeDate) {
                $lastDonationDate = $homeDate;
            } elseif ($donor->last_donation) {
                // Fallback to donor.last_donation if no completed appointments
                $lastDonationDate = Carbon::parse($donor->last_donation);
            }
            
            if (!$lastDonationDate) {
                // No last donation found
                return response()->json([
                    'eligible' => true,
                    'daysRemaining' => 0,
                    'lastDonationDate' => null,
                    'message' => 'Eligible to donate'
                ], 200);
            }

            // Calculate days since last donation
            $today = Carbon::today();
            $daysSinceLastDonation = $lastDonationDate->diffInDays($today);
            $daysRemaining = max(0, 56 - $daysSinceLastDonation);
            $eligible = $daysRemaining === 0;

            return response()->json([
                'eligible' => $eligible,
                'daysRemaining' => $daysRemaining,
                'lastDonationDate' => $lastDonationDate->format('Y-m-d'),
                'daysSinceLastDonation' => $daysSinceLastDonation,
                'message' => $eligible 
                    ? 'Eligible to donate' 
                    : "You must wait {$daysRemaining} more day" . ($daysRemaining !== 1 ? 's' : '') . " before you can donate again."
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error checking donor eligibility:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // On error, default to eligible (don't block user)
            return response()->json([
                'eligible' => true,
                'daysRemaining' => 0,
                'lastDonationDate' => null,
                'message' => 'Eligible to donate',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 200);
        }
    }
}
