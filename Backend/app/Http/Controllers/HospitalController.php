<?php

namespace App\Http\Controllers;

use App\Models\Hospital;
use App\Models\User;
use App\Models\HealthCenterManager;
use App\Models\BloodInventory;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;



class HospitalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $hospitals = Hospital::with(['healthCenterManager.user'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($hospital) {
                // Count requests (appointments created by this hospital)
                $requestsCount = Appointment::where('hospital_id', $hospital->id)->count();
                
                // Get blood stocks grouped by blood type
                $bloodStocks = BloodInventory::where('hospital_id', $hospital->id)
                    ->where('status', 'available')
                    ->with('bloodType')
                    ->get()
                    ->groupBy(function ($item) {
                        return $item->bloodType ? $item->bloodType->type . $item->bloodType->rh_factor : 'Unknown';
                    })
                    ->map(function ($items, $bloodType) {
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
                
                // Get all blood types and set default values for missing ones
                $allBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
                $completeBloodStocks = [];
                $completeShortageStates = [];
                
                foreach ($allBloodTypes as $bt) {
                    $completeBloodStocks[$bt] = $bloodStocks[$bt] ?? 0;
                    if (!isset($shortageStates[$bt])) {
                        $completeShortageStates[$bt] = 'critical'; // No stock = critical
                    } else {
                        $completeShortageStates[$bt] = $shortageStates[$bt];
                    }
                }
                
                // Add the computed data to hospital
                $hospitalArray = $hospital->toArray();
                $hospitalArray['requests'] = $requestsCount;
                $hospitalArray['blood_stock'] = $completeBloodStocks;
                $hospitalArray['shortage_states'] = $completeShortageStates;
                // Return full URL for path-based images (base64 and full URLs pass through)
                if (!empty($hospitalArray['image'])) {
                    $img = $hospitalArray['image'];
                    if (!str_starts_with($img, 'data:') && !str_starts_with($img, 'http')) {
                        $hospitalArray['image_url'] = asset(ltrim($img, '/'));
                    } else {
                        $hospitalArray['image_url'] = $img;
                    }
                } else {
                    $hospitalArray['image_url'] = null;
                }
                return $hospitalArray;
            });
        
        return response()->json([
            'hospitals' => $hospitals,
            'total' => $hospitals->count()
        ], 200);
    }

    public function getHospital($id){
        $hospital = Hospital::find($id);
        if(!$hospital){
            return response()->json(['message'=> 'Hospital not found'], 404);
        }
        $data = $hospital->toArray();
        if (!empty($data['image'])) {
            $img = $data['image'];
            $data['image_url'] = (str_starts_with($img, 'data:') || str_starts_with($img, 'http'))
                ? $img
                : asset(ltrim($img, '/'));
        } else {
            $data['image_url'] = null;
        }
        return response()->json($data, 200);
    }

    /**
     * Get a single hospital by code
     */
    public function show($code)
    {
        try {
            $hospital = Hospital::where('code', $code)
                ->with([
                    'healthCenterManager.user',
                    'mobilePhlebotomist.user'
                ])
                ->firstOrFail();
            
            // Count requests (appointments created by this hospital)
            $requestsCount = Appointment::where('hospital_id', $hospital->id)->count();
            
            // Get blood stocks grouped by blood type
            $bloodStocks = BloodInventory::where('hospital_id', $hospital->id)
                ->where('status', 'available')
                ->with('bloodType')
                ->get()
                ->groupBy(function ($item) {
                    return $item->bloodType ? $item->bloodType->type . $item->bloodType->rh_factor : 'Unknown';
                })
                ->map(function ($items, $bloodType) {
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
            
            // Get all blood types and set default values for missing ones
            $allBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            $completeBloodStocks = [];
            $completeShortageStates = [];
            
            foreach ($allBloodTypes as $bt) {
                $completeBloodStocks[$bt] = $bloodStocks[$bt] ?? 0;
                if (!isset($shortageStates[$bt])) {
                    $completeShortageStates[$bt] = 'critical'; // No stock = critical
                } else {
                    $completeShortageStates[$bt] = $shortageStates[$bt];
                }
            }
            
            // Calculate statistics
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
            
            // Get manager additional info
            $managerInfo = null;
            if ($hospital->healthCenterManager) {
                $managerInfo = [
                    'position' => $hospital->healthCenterManager->position,
                    'office_location' => $hospital->healthCenterManager->office_location,
                    'working_hours' => $hospital->healthCenterManager->working_hours,
                ];
            }
            
            // Convert to array and add statistics and manager info
            $hospitalData = $hospital->toArray();
            $hospitalData['stats'] = $stats;
            $hospitalData['manager_additional_info'] = $managerInfo;
            $hospitalData['requests'] = $requestsCount;
            $hospitalData['blood_stock'] = $completeBloodStocks;
            $hospitalData['shortage_states'] = $completeShortageStates;
            if (!empty($hospitalData['image'])) {
                $img = $hospitalData['image'];
                $hospitalData['image_url'] = (str_starts_with($img, 'data:') || str_starts_with($img, 'http'))
                    ? $img
                    : asset(ltrim($img, '/'));
            } else {
                $hospitalData['image_url'] = null;
            }
            return response()->json([
                'hospital' => $hospitalData
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Hospital not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error fetching hospital:', [
                'code' => $code,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to fetch hospital: ' . $e->getMessage()
            ], 500);
        }
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
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'phone_nb' => 'required|string',
            'email' => 'required|email',
            'image' => 'nullable|string',
            'description' => 'nullable|string',
            'services' => 'nullable|array',
            'hours' => 'nullable|string|max:255',
            'established' => 'nullable|string|max:255',
            'urgent_needs' => 'nullable|array',
        
            'manager' => 'required|array',
            'manager.first_name' => 'required|string|max:255',
            'manager.middle_name' => 'nullable|string|max:255',
            'manager.last_name' => 'nullable|string|max:255',
            'manager.phone_nb' => 'required|string|unique:users,phone_nb',
            'manager.email' => 'required|email|unique:users,email',
            'manager.password' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',       // uppercase
                'regex:/[a-z]/',       // lowercase
                'regex:/[0-9]/',       // number
                'regex:/[^A-Za-z0-9]/' // special
            ],
            'manager.start_time' => 'required',
            'manager.end_time' => 'required',
            'manager.working_dates' => 'array',
        ]);
        
        try {
            DB::transaction(function () use ($validated) {
                // Create hospital
                $hospital = Hospital::create([
                    'name' => $validated['name'],
                    'address' => $validated['address'],
                    'latitude' => $validated['latitude'] ?? null,
                    'longitude' => $validated['longitude'] ?? null,
                    'phone_nb' => $validated['phone_nb'],
                    'email' => $validated['email'],
                    'status' => 'verified', // Set default status to verified
                    'image' => $validated['image'] ?? null,
                    'description' => $validated['description'] ?? null,
                    'services' => $validated['services'] ?? null,
                    'hours' => $validated['hours'] ?? null,
                    'established' => $validated['established'] ?? null,
                    'urgent_needs' => $validated['urgent_needs'] ?? null,
                ]);
        
                //Create User 
                $user = User::create([
                    'first_name'=>$validated['manager']['first_name'],
                    'middle_name'=>$validated['manager']['middle_name'] ?? null,
                    'last_name'=>$validated['manager']['last_name'] ?? '',
                    'email'=>$validated['manager']['email'],
                    'phone_nb'=>$validated['manager']['phone_nb'],
                    'role'=>'Manager',
                    'password'=>Hash::make($validated['manager']['password'])
                ]);

                // Create manager
                HealthCenterManager::create([
                    'user_id'=> $user->id,
                    'hospital_id' => $hospital->id,
                    'position'=>'organ transfer manager',
                    'start_time' => $validated['manager']['start_time'],
                    'end_time' => $validated['manager']['end_time'],
                    'working_dates' => json_encode($validated['manager']['working_dates'] ?? []),
                ]);            
            });
        
            return response()->json(['message' => 'Hospital added successfully'], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error adding hospital:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to add hospital: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $code)
    {
        try {
            $hospital = Hospital::where('code', $code)
                ->with(['healthCenterManager.user'])
                ->firstOrFail();

            $managerUserId = $hospital->healthCenterManager?->user_id;
            
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'address' => 'sometimes|string',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'phone_nb' => 'sometimes|string|max:30',
                'email' => 'sometimes|email',
                'status' => 'sometimes|in:verified,unverified',
                'image' => 'nullable|string',
                'description' => 'nullable|string',
                'services' => 'nullable|array',
                'hours' => 'nullable|string|max:255',
                'established' => 'nullable|string|max:255',
                'urgent_needs' => 'nullable|array',

                // Optional manager update (nested)
                'manager' => 'sometimes|array',
                'manager.first_name' => 'sometimes|string|max:255',
                'manager.middle_name' => 'nullable|string|max:255',
                'manager.last_name' => 'nullable|string|max:255',
                'manager.phone_nb' => [
                    'sometimes',
                    'string',
                    'max:50',
                    Rule::unique('users', 'phone_nb')->ignore($managerUserId),
                ],
                'manager.email' => [
                    'sometimes',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->ignore($managerUserId),
                ],
                'manager.password' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'min:8',
                    'regex:/[A-Z]/',       // uppercase
                    'regex:/[a-z]/',       // lowercase
                    'regex:/[0-9]/',       // number
                    'regex:/[^A-Za-z0-9]/' // special
                ],
                'manager.start_time' => 'sometimes|nullable',
                'manager.end_time' => 'sometimes|nullable',
                'manager.working_dates' => 'sometimes|array',
                'manager.working_dates.*' => 'string|max:20',
                'manager.position' => 'sometimes|nullable|string|max:255',
                'manager.office_location' => 'sometimes|nullable|string|max:255',
            ]);

            DB::transaction(function () use (&$hospital, $validated, $request) {
                // 1) Hospital fields (everything except "manager")
                $hospitalFields = $validated;
                unset($hospitalFields['manager']);
                if (!empty($hospitalFields)) {
                    $hospital->update($hospitalFields);
                }

                // 2) Manager fields (optional)
                if ($request->has('manager')) {
                    $manager = $hospital->healthCenterManager;
                    if (!$manager) {
                        throw new \InvalidArgumentException('Hospital manager not found for this hospital.');
                    }

                    $managerPayload = $validated['manager'] ?? [];
                    $user = $manager->user;
                    if (!$user) {
                        throw new \InvalidArgumentException('Manager user not found for this hospital.');
                    }

                    // Update user identity/contact
                    $userUpdates = [];
                    foreach (['first_name', 'middle_name', 'last_name', 'email', 'phone_nb'] as $k) {
                        if (array_key_exists($k, $managerPayload)) {
                            $userUpdates[$k] = $managerPayload[$k];
                        }
                    }
                    if (!empty($userUpdates)) {
                        $user->fill($userUpdates);
                    }
                    if (array_key_exists('password', $managerPayload) && $managerPayload['password']) {
                        $user->password = Hash::make($managerPayload['password']);
                    }
                    if ($user->isDirty()) {
                        $user->save();
                    }

                    // Update manager schedule/details
                    foreach (['start_time', 'end_time', 'position', 'office_location'] as $k) {
                        if (array_key_exists($k, $managerPayload)) {
                            $manager->{$k} = $managerPayload[$k];
                        }
                    }
                    if (array_key_exists('working_dates', $managerPayload)) {
                        $manager->working_dates = $managerPayload['working_dates'];
                    }
                    if ($manager->isDirty()) {
                        $manager->save();
                    }
                }
            });

            $hospital->refresh();
            $hospital->load(['healthCenterManager.user']);

            return response()->json([
                'message' => 'Hospital updated successfully',
                'hospital' => $hospital
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Hospital not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating hospital:', [
                'code' => $code,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to update hospital: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($code)
    {
        try {
            $hospital = Hospital::where('code', $code)->firstOrFail();
            
            // Delete the hospital - related records will be handled by database cascade deletes
            $hospital->delete();

            return response()->json([
                'message' => 'Hospital deleted successfully'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Hospital not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting hospital:', [
                'code' => $code,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to delete hospital: ' . $e->getMessage()
            ], 500);
        }
    }
}
