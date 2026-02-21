<?php

namespace App\Http\Controllers;

use App\Models\AfterDeathPledge;
use App\Mail\AfterDeathPledgeThankYou;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class AfterDeathPledgeController extends Controller
{
    /**
     * Store a newly created after-death pledge.
     */
    public function store(Request $request)
    {
        $idPhotoPath = null;
        $fatherIdPhotoPath = null;
        $motherIdPhotoPath = null;

        try {
            // Validation rules
            $rules = [
                // Step 1: General Information
                'first_name' => 'required|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'required|string|max:100',
                'email' => 'required|email',
                'phone' => 'required|string|max:30',
                'birth_date' => 'required|date|before:today',
                'gender' => 'required|in:male,female',
                'address' => 'required|string',
                'emergency_contact' => 'nullable|string|max:100',
                'emergency_contact_number' => 'nullable|string|max:30',
                
                // Step 2: Personal Information
                'marital_status' => 'required|in:single,married,divorced,widowed',
                'education_level' => 'required|string|max:100',
                'professional_status' => 'required|in:no-work,working',
                'work_type' => 'nullable|string|max:255',
                'mother_name' => 'nullable|string|max:100',
                'spouse_name' => 'nullable|string|max:100',
                'id_photo' => 'required|file|image|mimes:jpeg,jpg,png,webp|max:5120', // 5MB max
                'father_id_photo' => 'nullable|file|image|mimes:jpeg,jpg,png,webp|max:5120',
                'mother_id_photo' => 'nullable|file|image|mimes:jpeg,jpg,png,webp|max:5120',
                
                // Step 3: Organ Selection
                'pledged_organs' => 'required|array|min:1',
                'pledged_organs.*' => 'string|in:heart,corneas,liver,skin,kidneys,bones,lungs,valves,pancrease,tendons,intestines,blood-vesseles,all-organs',
                
                // Required
                'blood_type' => 'required|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
                
                // Hospital Selection
                'hospital_selection' => 'required|in:general,specific',
                'hospital_id' => 'nullable|exists:hospitals,id',
            ];

            $validated = $request->validate($rules);

            // Conditional validation based on marital status
            if ($validated['marital_status'] === 'single') {
                if (empty($validated['mother_name'])) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors' => ['mother_name' => ['Mother\'s name is required for single individuals.']]
                    ], 422);
                }
            } elseif (in_array($validated['marital_status'], ['married', 'divorced', 'widowed'])) {
                if (empty($validated['spouse_name'])) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors' => ['spouse_name' => ['Spouse name is required for married/divorced/widowed individuals.']]
                    ], 422);
                }
            }

            // Conditional validation based on professional status
            if ($validated['professional_status'] === 'working' && empty($validated['work_type'])) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => ['work_type' => ['Work type is required when professional status is "working".']]
                ], 422);
            }

            // Conditional validation based on age (under 18 requires parent ID photos)
            $birthDate = \Carbon\Carbon::parse($validated['birth_date']);
            $age = $birthDate->diffInYears(\Carbon\Carbon::now());
            
            if ($age < 18) {
                if (!$request->hasFile('father_id_photo') || !$request->hasFile('mother_id_photo')) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors' => [
                            'father_id_photo' => ['Father\'s ID photo is required for individuals under 18.'],
                            'mother_id_photo' => ['Mother\'s ID photo is required for individuals under 18.']
                        ]
                    ], 422);
                }
            }

            // Conditional validation for hospital selection
            if ($validated['hospital_selection'] === 'specific' && empty($validated['hospital_id'])) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => ['hospital_id' => ['Hospital is required when selecting specific hospital.']]
                ], 422);
            }

            // Handle file uploads with better organization
            if ($request->hasFile('id_photo')) {
                $file = $request->file('id_photo');
                $filename = 'id_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $idPhotoPath = $file->storeAs('after_death_pledges/id_photos', $filename, 'public');
            }

            if ($request->hasFile('father_id_photo')) {
                $file = $request->file('father_id_photo');
                $filename = 'father_id_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $fatherIdPhotoPath = $file->storeAs('after_death_pledges/id_photos', $filename, 'public');
            }

            if ($request->hasFile('mother_id_photo')) {
                $file = $request->file('mother_id_photo');
                $filename = 'mother_id_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $motherIdPhotoPath = $file->storeAs('after_death_pledges/id_photos', $filename, 'public');
            }

            // Process pledged organs - ensure it's an array
            $pledgedOrgans = $validated['pledged_organs'];
            if (!is_array($pledgedOrgans)) {
                $pledgedOrgans = [$pledgedOrgans];
            }

            // Create after-death pledge
            $pledge = AfterDeathPledge::create([
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone_nb' => $validated['phone'],
                'date_of_birth' => $validated['birth_date'],
                'gender' => $validated['gender'],
                'address' => $validated['address'],
                'emergency_contact_name' => $validated['emergency_contact'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_number'] ?? null,
                'marital_status' => $validated['marital_status'],
                'education_level' => $validated['education_level'],
                'professional_status' => $validated['professional_status'],
                'work_type' => $validated['work_type'] ?? null,
                'mother_name' => $validated['mother_name'] ?? null,
                'spouse_name' => $validated['spouse_name'] ?? null,
                'id_photo_path' => $idPhotoPath,
                'father_id_photo_path' => $fatherIdPhotoPath,
                'mother_id_photo_path' => $motherIdPhotoPath,
                'pledged_organs' => $pledgedOrgans,
                'blood_type' => $validated['blood_type'],
                'hospital_selection' => $validated['hospital_selection'],
                'hospital_id' => ($validated['hospital_selection'] === 'specific' && isset($validated['hospital_id'])) 
                    ? (int)$validated['hospital_id'] 
                    : null,
                'status' => 'active',
            ]);

            // Award XP for after-death organ donation pledge
            // Try to find donor by email
            $user = \App\Models\User::where('email', $validated['email'])->first();
            if ($user && $user->donor) {
                \App\Services\XpService::awardAfterDeathDonationXp(
                    $user->donor->id,
                    \App\Models\AfterDeathPledge::class,
                    $pledge->id
                );
            }

            // Send thank-you email to the donor
            // Use queue() so response returns immediately; avoids mobile timeout when SMTP is slow
            try {
                Mail::to($validated['email'])->queue(new AfterDeathPledgeThankYou($pledge));
            } catch (\Exception $e) {
                \Log::error('Failed to send after-death pledge thank-you email:', [
                    'pledge_id' => $pledge->id,
                    'email' => $validated['email'],
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            return response()->json([
                'message' => 'After-death organ donation pledge submitted successfully.',
                'pledge' => $pledge
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Delete uploaded files if validation fails
            if ($idPhotoPath) {
                Storage::disk('public')->delete($idPhotoPath);
            }
            if ($fatherIdPhotoPath) {
                Storage::disk('public')->delete($fatherIdPhotoPath);
            }
            if ($motherIdPhotoPath) {
                Storage::disk('public')->delete($motherIdPhotoPath);
            }

            return response()->json([
                'message' => 'Validation failed. Please check all required fields.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            // Delete uploaded files if creation fails
            if ($idPhotoPath) {
                Storage::disk('public')->delete($idPhotoPath);
            }
            if ($fatherIdPhotoPath) {
                Storage::disk('public')->delete($fatherIdPhotoPath);
            }
            if ($motherIdPhotoPath) {
                Storage::disk('public')->delete($motherIdPhotoPath);
            }

            \Log::error('Error creating after-death pledge: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->except(['id_photo', 'father_id_photo', 'mother_id_photo'])
            ]);

            return response()->json([
                'message' => 'An error occurred while submitting the pledge.',
                'error' => config('app.debug') ? $e->getMessage() : 'Please try again later.'
            ], 500);
        }
    }

    /**
     * Display a listing of after-death pledges for admin dashboard.
     */
    public function index()
    {
        try {
            $pledges = AfterDeathPledge::with('hospital')->orderBy('created_at', 'desc')->get();

            // Transform data to match frontend format
            $transformedPledges = $pledges->map(function ($pledge) {
                // Calculate age using the model's accessor
                $age = $pledge->age;

                // Get ID photo URLs - use full URL if path exists
                $idPhotoUrl = null;
                if ($pledge->id_photo_path) {
                    $idPhotoUrl = asset('storage/' . $pledge->id_photo_path);
                }

                $fatherIdPhotoUrl = null;
                if ($pledge->father_id_photo_path) {
                    $fatherIdPhotoUrl = asset('storage/' . $pledge->father_id_photo_path);
                }

                $motherIdPhotoUrl = null;
                if ($pledge->mother_id_photo_path) {
                    $motherIdPhotoUrl = asset('storage/' . $pledge->mother_id_photo_path);
                }

                return [
                    'id' => $pledge->code,
                    'donor_name' => $pledge->full_name,
                    'blood_type' => $pledge->blood_type ?? 'N/A',
                    'age' => $age,
                    'gender' => ucfirst($pledge->gender),
                    'email' => $pledge->email,
                    'phone_nb' => $pledge->phone_nb,
                    'pledged_organs' => $pledge->pledged_organs_string,
                    'emergency_contact_name' => $pledge->emergency_contact_name ?? 'N/A',
                    'emergency_contact_phone' => $pledge->emergency_contact_phone ?? 'N/A',
                    'mother_name' => $pledge->mother_name ?? null,
                    'spouse_name' => $pledge->spouse_name ?? null,
                    'id_photo' => $idPhotoUrl,
                    'father_id_photo' => $fatherIdPhotoUrl,
                    'mother_id_photo' => $motherIdPhotoUrl,
                    'hospital_selection' => $pledge->hospital_selection ?? 'general',
                    'hospital_id' => $pledge->hospital_id ?? null,
                    'hospital_name' => $pledge->hospital ? $pledge->hospital->name : null,
                    'status' => $pledge->status,
                    'created_at' => $pledge->created_at ? $pledge->created_at->format('Y-m-d') : null,
                ];
            });

            return response()->json([
                'after_death_pledges' => $transformedPledges,
                'total' => $transformedPledges->count()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching after-death pledges: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'after_death_pledges' => [],
                'total' => 0,
                'error' => 'Failed to fetch after-death pledges'
            ], 500);
        }
    }

    /**
     * Display a single after-death pledge (full details) for admin dashboard.
     */
    public function show(string $code)
    {
        try {
            $pledge = AfterDeathPledge::with('hospital')
                ->where('code', $code)
                ->firstOrFail();

            $idPhotoUrl = $pledge->id_photo_path ? asset('storage/' . $pledge->id_photo_path) : null;
            $fatherIdPhotoUrl = $pledge->father_id_photo_path ? asset('storage/' . $pledge->father_id_photo_path) : null;
            $motherIdPhotoUrl = $pledge->mother_id_photo_path ? asset('storage/' . $pledge->mother_id_photo_path) : null;

            return response()->json([
                'after_death_pledge' => [
                    'id' => $pledge->code,
                    'first_name' => $pledge->first_name,
                    'middle_name' => $pledge->middle_name,
                    'last_name' => $pledge->last_name,
                    'full_name' => $pledge->full_name,
                    'email' => $pledge->email,
                    'phone_nb' => $pledge->phone_nb,
                    'date_of_birth' => $pledge->date_of_birth ? Carbon::parse($pledge->date_of_birth)->format('Y-m-d') : null,
                    'age' => $pledge->age,
                    'gender' => $pledge->gender,
                    'address' => $pledge->address,
                    'emergency_contact_name' => $pledge->emergency_contact_name,
                    'emergency_contact_phone' => $pledge->emergency_contact_phone,
                    'marital_status' => $pledge->marital_status,
                    'education_level' => $pledge->education_level,
                    'professional_status' => $pledge->professional_status,
                    'work_type' => $pledge->work_type,
                    'mother_name' => $pledge->mother_name,
                    'spouse_name' => $pledge->spouse_name,
                    'pledged_organs' => $pledge->pledged_organs ?? [],
                    'pledged_organs_string' => $pledge->pledged_organs_string,
                    'blood_type' => $pledge->blood_type,
                    'hospital_selection' => $pledge->hospital_selection,
                    'hospital_id' => $pledge->hospital_id,
                    'hospital_name' => $pledge->hospital ? $pledge->hospital->name : null,
                    'status' => $pledge->status,
                    'id_photo' => $idPhotoUrl,
                    'father_id_photo' => $fatherIdPhotoUrl,
                    'mother_id_photo' => $motherIdPhotoUrl,
                    'created_at' => $pledge->created_at ? $pledge->created_at->toISOString() : null,
                ]
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'After-death pledge not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error fetching after-death pledge details: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'code' => $code
            ]);

            return response()->json([
                'message' => 'Failed to fetch after-death pledge details'
            ], 500);
        }
    }

    /**
     * Update an after-death pledge (admin).
     */
    public function update(Request $request, string $code)
    {
        try {
            $pledge = AfterDeathPledge::where('code', $code)->firstOrFail();

            $validated = $request->validate([
                'status' => 'nullable|in:active,cancelled',
                'email' => 'nullable|email|max:255',
                'phone_nb' => 'nullable|string|max:50',
                'emergency_contact_name' => 'nullable|string|max:255',
                'emergency_contact_phone' => 'nullable|string|max:50',
                'pledged_organs' => 'nullable|array|min:1',
                'pledged_organs.*' => 'in:all-organs,heart,corneas,liver,skin,kidneys,bones,lungs,valves,pancrease,tendons,intestines,blood-vessels,blood-vesseles',
                'hospital_selection' => 'nullable|in:general,specific',
                'hospital_id' => 'nullable|exists:hospitals,id',
            ]);

            // If hospital_selection is specific, require hospital_id
            if (($validated['hospital_selection'] ?? $pledge->hospital_selection) === 'specific') {
                $hospitalId = $validated['hospital_id'] ?? $pledge->hospital_id;
                if (!$hospitalId) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors' => ['hospital_id' => ['Hospital is required when selecting specific hospital.']]
                    ], 422);
                }
            }

            // If hospital_selection becomes general, clear hospital_id
            if (array_key_exists('hospital_selection', $validated) && $validated['hospital_selection'] === 'general') {
                $validated['hospital_id'] = null;
            }

            $pledge->fill($validated);
            $pledge->save();

            return response()->json([
                'message' => 'After-death pledge updated successfully.',
                'after_death_pledge' => $pledge->fresh()
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'After-death pledge not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating after-death pledge: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'code' => $code
            ]);

            return response()->json([
                'message' => 'Failed to update after-death pledge'
            ], 500);
        }
    }

    /**
     * Delete an after-death pledge (admin).
     */
    public function destroy(string $code)
    {
        try {
            $pledge = AfterDeathPledge::where('code', $code)->firstOrFail();

            if ($pledge->id_photo_path) {
                Storage::disk('public')->delete($pledge->id_photo_path);
            }
            if ($pledge->father_id_photo_path) {
                Storage::disk('public')->delete($pledge->father_id_photo_path);
            }
            if ($pledge->mother_id_photo_path) {
                Storage::disk('public')->delete($pledge->mother_id_photo_path);
            }

            $pledge->delete();

            return response()->json([
                'message' => 'After-death pledge deleted successfully.'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'After-death pledge not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting after-death pledge: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'code' => $code
            ]);

            return response()->json([
                'message' => 'Failed to delete after-death pledge'
            ], 500);
        }
    }
}
