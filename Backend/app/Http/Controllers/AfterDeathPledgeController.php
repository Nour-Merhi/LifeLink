<?php

namespace App\Http\Controllers;

use App\Models\AfterDeathPledge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class AfterDeathPledgeController extends Controller
{
    /**
     * Store a newly created after-death pledge.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
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
                'education_level' => 'required|string',
                'professional_status' => 'required|in:no-work,working',
                'work_type' => 'nullable|string|max:255',
                'mother_name' => 'nullable|string|max:100',
                'spouse_name' => 'nullable|string|max:100',
                'id_photo' => 'required|file|image|max:5120', // 5MB max
                'father_id_photo' => 'nullable|file|image|max:5120',
                'mother_id_photo' => 'nullable|file|image|max:5120',
                
                // Step 3: Organ Selection
                'pledged_organs' => 'required|array|min:1',
                'pledged_organs.*' => 'string',
                
                // Required
                'blood_type' => 'required|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            ]);

            // Handle file uploads
            $idPhotoPath = null;
            $fatherIdPhotoPath = null;
            $motherIdPhotoPath = null;

            if ($request->hasFile('id_photo')) {
                $idPhotoPath = $request->file('id_photo')->store('id_photos', 'public');
            }

            if ($request->hasFile('father_id_photo')) {
                $fatherIdPhotoPath = $request->file('father_id_photo')->store('id_photos', 'public');
            }

            if ($request->hasFile('mother_id_photo')) {
                $motherIdPhotoPath = $request->file('mother_id_photo')->store('id_photos', 'public');
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
                'marital_status' => $validated['marital_status'] ?? null,
                'education_level' => $validated['education_level'] ?? null,
                'professional_status' => $validated['professional_status'] ?? null,
                'work_type' => $validated['work_type'] ?? null,
                'mother_name' => $validated['mother_name'] ?? null,
                'spouse_name' => $validated['spouse_name'] ?? null,
                'id_photo_path' => $idPhotoPath,
                'father_id_photo_path' => $fatherIdPhotoPath,
                'mother_id_photo_path' => $motherIdPhotoPath,
                'pledged_organs' => $validated['pledged_organs'],
                'blood_type' => $validated['blood_type'] ?? null,
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

            return response()->json([
                'message' => 'After-death organ donation pledge submitted successfully.',
                'pledge' => $pledge
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed. Please check all required fields.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating after-death pledge: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->except(['id_photo', 'father_id_photo', 'mother_id_photo']) // Don't log file contents
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
            $pledges = AfterDeathPledge::orderBy('created_at', 'desc')->get();

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
}
