<?php

namespace App\Http\Controllers;

use App\Models\LivingDonor;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\LivingOrganPledgeSubmitted;
use App\Mail\LivingOrganAppointmentSuggestions;
use App\Mail\LivingOrganAppointmentCompleted;
use App\Mail\LivingOrganAppointmentCancelled;
use App\Mail\LivingOrganMedicalClearedThankYou;

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

            // Step 1: Email donor after registration (thank you + wait for approval)
            try {
                if ($livingDonor->email) {
                    Mail::to($livingDonor->email)->queue(new LivingOrganPledgeSubmitted($livingDonor));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send living organ pledge submitted email', [
                    'living_donor_code' => $livingDonor->code,
                    'error' => $e->getMessage(),
                ]);
            }

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
                    'appointment_status' => $donor->appointment_status,
                    'selected_appointment_at' => $donor->selected_appointment_at ? $donor->selected_appointment_at->toISOString() : null,
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
                    'appointment_status' => $donor->appointment_status,
                    'suggested_appointments' => $donor->suggested_appointments ?? [],
                    'suggestions_sent_at' => $donor->suggestions_sent_at ? $donor->suggestions_sent_at->toISOString() : null,
                    'selected_appointment_at' => $donor->selected_appointment_at ? $donor->selected_appointment_at->toISOString() : null,
                    'selected_at' => $donor->selected_at ? $donor->selected_at->toISOString() : null,
                    'appointment_completed_at' => $donor->appointment_completed_at ? $donor->appointment_completed_at->toISOString() : null,
                    'appointment_cancelled_at' => $donor->appointment_cancelled_at ? $donor->appointment_cancelled_at->toISOString() : null,
                    'appointment_cancel_reason' => $donor->appointment_cancel_reason,
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

            $oldEthics = $donor->ethics_status;
            $oldAppointmentStatus = $donor->appointment_status;
            $oldMedical = $donor->medical_status;

            $validated = $request->validate([
                'medical_status' => 'nullable|in:not_started,in_progress,cleared,rejected',
                'ethics_status' => 'nullable|in:pending,approved,rejected,N/A',
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

            // Step 2: If ethics approved, auto-clear medical state and move to scheduling
            if (array_key_exists('ethics_status', $validated) && $validated['ethics_status'] === 'approved' && $oldEthics !== 'approved') {
                // "cleared" here means allowed to proceed with appointment scheduling
                $donor->medical_status = 'cleared';
                $donor->appointment_status = 'awaiting_scheduling';
            }

            // If medical/ethics rejected -> cancel workflow (Step 6 email)
            if (
                (array_key_exists('ethics_status', $validated) && $validated['ethics_status'] === 'rejected') ||
                (array_key_exists('medical_status', $validated) && $validated['medical_status'] === 'rejected')
            ) {
                $donor->appointment_status = 'cancelled';
                if (!$donor->appointment_cancelled_at) $donor->appointment_cancelled_at = now();
                $donor->appointment_cancel_reason = $donor->appointment_cancel_reason ?: 'Case rejected during review.';
            }

            $donor->save();

            // Final thank-you email when medical state becomes cleared
            try {
                if ($donor->medical_status === 'cleared' && $oldMedical !== 'cleared' && $donor->email) {
                    Mail::to($donor->email)->queue(new LivingOrganMedicalClearedThankYou($donor));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send living organ medical cleared thank you email (admin update)', [
                    'living_donor_code' => $donor->code,
                    'error' => $e->getMessage(),
                ]);
            }

            // If it got cancelled here, email donor (Step 6)
            try {
                if ($donor->appointment_status === 'cancelled' && $oldAppointmentStatus !== 'cancelled' && $donor->email) {
                    Mail::to($donor->email)->queue(new LivingOrganAppointmentCancelled($donor, $donor->appointment_cancel_reason));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send living organ appointment cancelled email (admin update)', [
                    'living_donor_code' => $donor->code,
                    'error' => $e->getMessage(),
                ]);
            }

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

    /**
     * Step 3: Admin suggests appointment options to the donor and emails them.
     */
    public function suggestAppointments(Request $request, string $code)
    {
        try {
            $donor = LivingDonor::where('code', $code)->firstOrFail();

            $validated = $request->validate([
                'suggested_appointments' => 'required|array|min:1|max:10',
                'suggested_appointments.*' => 'required|string',
            ]);

            if (($donor->ethics_status ?? '') !== 'approved') {
                return response()->json(['message' => 'Ethics must be approved before suggesting appointments.'], 422);
            }

            // Normalize to ISO strings (no strict timezone conversion here; keep what frontend sends)
            $slots = array_values(array_filter(array_map(function ($s) {
                $v = trim((string)$s);
                return $v !== '' ? $v : null;
            }, $validated['suggested_appointments'])));

            if (count($slots) === 0) {
                return response()->json(['message' => 'Please provide at least one appointment option.'], 422);
            }

            $donor->suggested_appointments = $slots;
            $donor->suggestions_sent_at = now();
            $donor->appointment_status = 'awaiting_donor_choice';
            $donor->save();

            $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
            $dashboardUrl = $frontend . '/donor/my-appointments?focus=living&code=' . urlencode($donor->code);

            try {
                if ($donor->email) {
                    Mail::to($donor->email)->queue(new LivingOrganAppointmentSuggestions($donor, $slots, $dashboardUrl));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send living organ appointment suggestions email', [
                    'living_donor_code' => $donor->code,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'message' => 'Appointment options saved and email sent to donor.',
                'living_donor' => $donor->fresh(),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Living donor pledge not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error suggesting living donor appointments:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to suggest appointments'], 500);
        }
    }

    /**
     * Step 4/5/6: Admin updates appointment status (pending/in_progress/completed/cancelled) and triggers emails.
     */
    public function updateAppointmentStatus(Request $request, string $code)
    {
        try {
            $donor = LivingDonor::where('code', $code)->firstOrFail();
            $oldStatus = $donor->appointment_status;

            $validated = $request->validate([
                'appointment_status' => 'required|in:awaiting_donor_choice,in_progress,completed,cancelled,awaiting_scheduling,awaiting_approval',
                'cancel_reason' => 'nullable|string|max:255',
            ]);

            $donor->appointment_status = $validated['appointment_status'];

            if ($validated['appointment_status'] === 'in_progress') {
                $donor->medical_status = 'in_progress';
            }

            if ($validated['appointment_status'] === 'completed') {
                if (!$donor->appointment_completed_at) $donor->appointment_completed_at = now();
            }

            if ($validated['appointment_status'] === 'cancelled') {
                if (!$donor->appointment_cancelled_at) $donor->appointment_cancelled_at = now();
                $donor->appointment_cancel_reason = $validated['cancel_reason'] ?? ($donor->appointment_cancel_reason ?: 'Appointment cancelled.');
            }

            $donor->save();

            // Step 5: completed email
            if ($donor->appointment_status === 'completed' && $oldStatus !== 'completed' && $donor->email) {
                try {
                    Mail::to($donor->email)->queue(new LivingOrganAppointmentCompleted($donor));
                } catch (\Exception $e) {
                    \Log::warning('Failed to send living organ appointment completed email', [
                        'living_donor_code' => $donor->code,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Step 6: cancelled email
            if ($donor->appointment_status === 'cancelled' && $oldStatus !== 'cancelled' && $donor->email) {
                try {
                    Mail::to($donor->email)->queue(new LivingOrganAppointmentCancelled($donor, $donor->appointment_cancel_reason));
                } catch (\Exception $e) {
                    \Log::warning('Failed to send living organ appointment cancelled email', [
                        'living_donor_code' => $donor->code,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return response()->json([
                'message' => 'Appointment status updated.',
                'living_donor' => $donor->fresh(),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Living donor pledge not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating living donor appointment status:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to update appointment status'], 500);
        }
    }
}
