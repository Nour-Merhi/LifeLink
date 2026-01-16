<?php

namespace App\Http\Controllers;

use App\Models\LivingDonor;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class LivingDonorController extends Controller
{
    /**
     * Store a newly created living donor pledge.
     */
    public function store(Request $request)
    {
        try {
            // Normalize checkbox boolean coming from FormData:
            // - Frontend may send `agree_intrest` (typo) and FormData stringifies booleans as "true"/"false"
            // - Laravel boolean validator accepts: true/false/1/0/"1"/"0" but NOT "true"/"false"
            if ($request->has('agree_intrest') && !$request->has('agree_interest')) {
                $request->merge(['agree_interest' => $request->input('agree_intrest')]);
            }
            if ($request->has('agree_interest')) {
                $v = $request->input('agree_interest');
                if (is_string($v)) {
                    $vv = strtolower(trim($v));
                    if (in_array($vv, ['true', 'on', 'yes'], true)) {
                        $request->merge(['agree_interest' => 1]);
                    } elseif (in_array($vv, ['false', 'off', 'no', ''], true)) {
                        $request->merge(['agree_interest' => 0]);
                    }
                }
            }

            // Handle both FormData and JSON requests
            // Get donation_type first to determine validation rules
            $donationType = $request->input('donation_type');
            
            // If donation_type is not set, check for donationType (from frontend)
            if (!$donationType) {
                $donationTypeInput = $request->input('donationType');
                if ($donationTypeInput === 'direct-donation') {
                    $donationType = 'directed';
                } elseif ($donationTypeInput === 'non-direct-donation') {
                    $donationType = 'non-directed';
                }
            }

            // Base validation rules - handle both snake_case and camelCase field names
            $rules = [
                'first_name' => 'required|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'required|string|max:100',
                'email' => 'required|email',
                'phone' => 'required|string|max:30',
                'birth_date' => 'required|date|before:today',
                'gender' => 'required|in:male,female',
                'address' => 'required|string',
                'blood_type' => 'required|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
                'organ' => 'required|in:kidney,liver-partial,bone-marrow',
                'donation_type' => 'required|in:directed,non-directed',
                'medical_conditions' => 'nullable',
                'agree_interest' => 'nullable|boolean',
                'id_picture' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120', // 5MB max
            ];

            // Handle medical_conditions if it's a JSON string
            if ($request->has('medical_conditions') && is_string($request->input('medical_conditions'))) {
                try {
                    $medicalConditions = json_decode($request->input('medical_conditions'), true);
                    $request->merge(['medical_conditions' => $medicalConditions]);
                } catch (\Exception $e) {
                    // If JSON decode fails, continue with original value
                }
            }

            // Conditional validation based on donation type
            if ($donationType === 'directed') {
                // For directed donations, require recipient fields
                // Laravel automatically handles nested arrays from FormData
                $rules['recipient'] = 'required|array';
                $rules['recipient.full_name'] = 'required|string|max:255';
                $rules['recipient.age'] = 'required|integer|min:1|max:120';
                $rules['recipient.contact'] = 'required|string|max:255';
                $rules['recipient.contact_type'] = 'required|in:phone,email';
                $rules['recipient.blood_type'] = 'required|in:A+,A-,B+,B-,AB+,AB-,O+,O-';
                $rules['recipient.hospital_id'] = 'required|exists:hospitals,id';
            } elseif ($donationType === 'non-directed') {
                // For non-directed donations
                $rules['hospital_selection'] = 'required|in:general,specific';
                if ($request->input('hospital_selection') === 'specific') {
                    $rules['hospital_id'] = 'required|exists:hospitals,id';
                }
            }

            $validated = $request->validate($rules);
            
            // Normalize donation_type
            $validated['donation_type'] = $donationType;

            // Handle ID picture upload
            $idPicturePath = null;
            if ($request->hasFile('id_picture')) {
                $file = $request->file('id_picture');
                $filename = 'id_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $idPicturePath = $file->storeAs('living_donors/id_pictures', $filename, 'public');
            }

            // Handle medical_conditions - can be array or JSON string
            $medicalConditions = [];
            if (isset($validated['medical_conditions'])) {
                if (is_array($validated['medical_conditions'])) {
                    $medicalConditions = $validated['medical_conditions'];
                } elseif (is_string($validated['medical_conditions'])) {
                    try {
                        $medicalConditions = json_decode($validated['medical_conditions'], true) ?? [];
                    } catch (\Exception $e) {
                        $medicalConditions = [];
                    }
                }
            }

            // Map organ value
            $organMap = [
                'kidney' => 'Kidney',
                'liver-partial' => 'Liver (Partial)',
                'bone-marrow' => 'Bone Marrow'
            ];
            $organ = $organMap[$validated['organ']] ?? $validated['organ'];

            // Prepare data for creation
            $livingDonorData = [
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone_nb' => $validated['phone'],
                'date_of_birth' => $validated['birth_date'],
                'gender' => $validated['gender'],
                'address' => $validated['address'],
                'blood_type' => $validated['blood_type'],
                'organ' => $organ,
                'medical_conditions' => $medicalConditions,
                'donation_type' => $validated['donation_type'],
                'medical_status' => 'not_started',
                'ethics_status' => 'pending',
                'id_picture' => $idPicturePath,
            ];

            // Add recipient data for directed donations
            // Laravel automatically handles nested arrays from FormData (recipient[full_name] becomes recipient.full_name)
            if ($validated['donation_type'] === 'directed' && isset($validated['recipient'])) {
                $recipient = $validated['recipient'];
                $livingDonorData['recipient_full_name'] = $recipient['full_name'] ?? null;
                $livingDonorData['recipient_age'] = (int)($recipient['age'] ?? 0);
                $livingDonorData['recipient_contact'] = $recipient['contact'] ?? null;
                $livingDonorData['recipient_contact_type'] = $recipient['contact_type'] ?? null;
                $livingDonorData['recipient_blood_type'] = $recipient['blood_type'] ?? null;
                $livingDonorData['hospital_id'] = (int)($recipient['hospital_id'] ?? 0);
            }

            // Add hospital selection for non-directed donations
            if ($validated['donation_type'] === 'non-directed') {
                $livingDonorData['hospital_selection'] = $validated['hospital_selection'] ?? null;
                if (($validated['hospital_selection'] ?? '') === 'specific' && isset($validated['hospital_id'])) {
                    $livingDonorData['hospital_id'] = (int)$validated['hospital_id'];
                }
            }

            // Create living donor
            $livingDonor = LivingDonor::create($livingDonorData);

            return response()->json([
                'message' => 'Living organ donation pledge submitted successfully.',
                'living_donor' => $livingDonor
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Delete uploaded file if validation fails
            if ($request->hasFile('id_picture')) {
                Storage::disk('public')->delete($idPicturePath ?? '');
            }
            
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            // Delete uploaded file if creation fails
            if (isset($idPicturePath) && $idPicturePath) {
                Storage::disk('public')->delete($idPicturePath);
            }

            \Log::error('Error creating living donor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->except(['id_picture', 'password'])
            ]);

            return response()->json([
                'message' => 'An error occurred while submitting the pledge.',
                'error' => config('app.debug') ? $e->getMessage() : 'Please try again later.'
            ], 500);
        }
    }

    /**
     * Display a listing of living donors for admin dashboard.
     */
    public function index()
    {
        try {
            $livingDonors = LivingDonor::with('hospital.healthCenterManager.user')
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform data to match frontend format
            $transformedDonors = $livingDonors->map(function ($donor) {
                // Calculate age
                $age = $donor->date_of_birth ? Carbon::parse($donor->date_of_birth)->age : null;

                // Get hospital name and manager name
                $hospitalName = 'Not Assigned';
                $managerName = 'N/A';
                
                if ($donor->hospital) {
                    $hospitalName = $donor->hospital->name ?? 'Not Assigned';
                    if ($donor->hospital->healthCenterManager && $donor->hospital->healthCenterManager->user) {
                        $user = $donor->hospital->healthCenterManager->user;
                        $nameParts = array_filter([
                            $user->first_name,
                            $user->middle_name,
                            $user->last_name
                        ]);
                        $managerName = implode(' ', $nameParts);
                    }
                }

                // Format donation type
                $donationType = $donor->donation_type === 'directed' ? 'Directed' : 'Altruistic';

                return [
                    'id' => $donor->code,
                    'donor_name' => $donor->full_name,
                    'blood_type' => $donor->blood_type,
                    'age' => $age,
                    'email' => $donor->email,
                    'phone_nb' => $donor->phone_nb,
                    'organ' => $donor->organ,
                    'medical_status' => $donor->medical_status,
                    'hospital_name' => $hospitalName,
                    'manager_name' => $managerName,
                    'ethics_status' => $donor->ethics_status,
                    'donation_type' => $donationType,
                    'created_at' => $donor->created_at ? $donor->created_at->format('Y-m-d') : null,
                ];
            });

            return response()->json([
                'living_donors' => $transformedDonors,
                'total' => $transformedDonors->count()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching living donors: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'living_donors' => [],
                'total' => 0,
                'error' => 'Failed to fetch living donors'
            ], 500);
        }
    }

    /**
     * Display a single living donor pledge (full details) for admin dashboard.
     */
    public function show(string $code)
    {
        try {
            $donor = LivingDonor::with('hospital.healthCenterManager.user')
                ->where('code', $code)
                ->firstOrFail();

            $age = $donor->date_of_birth ? Carbon::parse($donor->date_of_birth)->age : null;

            $hospitalName = 'Not Assigned';
            $managerName = 'N/A';
            if ($donor->hospital) {
                $hospitalName = $donor->hospital->name ?? 'Not Assigned';
                if ($donor->hospital->healthCenterManager && $donor->hospital->healthCenterManager->user) {
                    $user = $donor->hospital->healthCenterManager->user;
                    $nameParts = array_filter([
                        $user->first_name,
                        $user->middle_name,
                        $user->last_name
                    ]);
                    $managerName = implode(' ', $nameParts);
                }
            }

            $idPictureUrl = null;
            if ($donor->id_picture) {
                $idPictureUrl = asset('storage/' . $donor->id_picture);
            }

            return response()->json([
                'living_donor' => [
                    'id' => $donor->code,
                    'first_name' => $donor->first_name,
                    'middle_name' => $donor->middle_name,
                    'last_name' => $donor->last_name,
                    'full_name' => $donor->full_name,
                    'email' => $donor->email,
                    'phone_nb' => $donor->phone_nb,
                    'date_of_birth' => $donor->date_of_birth ? Carbon::parse($donor->date_of_birth)->format('Y-m-d') : null,
                    'age' => $age,
                    'gender' => $donor->gender,
                    'address' => $donor->address,
                    'blood_type' => $donor->blood_type,
                    'organ' => $donor->organ,
                    'medical_conditions' => $donor->medical_conditions ?? [],
                    'donation_type' => $donor->donation_type, // directed | non-directed
                    'medical_status' => $donor->medical_status,
                    'ethics_status' => $donor->ethics_status,
                    'agree_interest' => $donor->agree_interest ?? null,
                    'hospital_selection' => $donor->hospital_selection,
                    'hospital_id' => $donor->hospital_id,
                    'hospital_name' => $hospitalName,
                    'manager_name' => $managerName,
                    'recipient_full_name' => $donor->recipient_full_name,
                    'recipient_age' => $donor->recipient_age,
                    'recipient_contact' => $donor->recipient_contact,
                    'recipient_contact_type' => $donor->recipient_contact_type,
                    'recipient_blood_type' => $donor->recipient_blood_type,
                    'id_picture' => $idPictureUrl,
                    'created_at' => $donor->created_at ? $donor->created_at->toISOString() : null,
                ]
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Living donor pledge not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error fetching living donor details: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'code' => $code
            ]);

            return response()->json([
                'message' => 'Failed to fetch living donor details'
            ], 500);
        }
    }

    /**
     * Update a living donor pledge (admin).
     */
    public function update(Request $request, string $code)
    {
        try {
            $donor = LivingDonor::where('code', $code)->firstOrFail();

            $validated = $request->validate([
                'medical_status' => 'nullable|in:not_started,in_progress,cleared,rejected',
                'ethics_status' => 'nullable|in:pending,approved,N/A',
                'hospital_selection' => 'nullable|in:general,specific',
                'hospital_id' => 'nullable|exists:hospitals,id',
            ]);

            // If hospital_selection is specific, require hospital_id
            if (($validated['hospital_selection'] ?? $donor->hospital_selection) === 'specific') {
                $hospitalId = $validated['hospital_id'] ?? $donor->hospital_id;
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

            $donor->fill($validated);
            $donor->save();

            return response()->json([
                'message' => 'Living donor pledge updated successfully.',
                'living_donor' => $donor->fresh()
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Living donor pledge not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating living donor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'code' => $code
            ]);

            return response()->json([
                'message' => 'Failed to update living donor pledge'
            ], 500);
        }
    }

    /**
     * Delete a living donor pledge (admin).
     */
    public function destroy(string $code)
    {
        try {
            $donor = LivingDonor::where('code', $code)->firstOrFail();

            // Remove stored id picture if exists
            if ($donor->id_picture) {
                Storage::disk('public')->delete($donor->id_picture);
            }

            $donor->delete();

            return response()->json([
                'message' => 'Living donor pledge deleted successfully.'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Living donor pledge not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting living donor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'code' => $code
            ]);

            return response()->json([
                'message' => 'Failed to delete living donor pledge'
            ], 500);
        }
    }
}
