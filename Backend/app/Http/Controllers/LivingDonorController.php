<?php

namespace App\Http\Controllers;

use App\Models\LivingDonor;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Carbon\Carbon;

class LivingDonorController extends Controller
{
    /**
     * Store a newly created living donor pledge.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'required|string|max:100',
                'email' => 'required|email',
                'phone' => 'required|string|max:30',
                'birth-date' => 'required|date|before:today',
                'gender' => 'required|in:male,female',
                'address' => 'required|string',
                'blood-type' => 'required|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
                'living-organ' => 'required|in:kidney,liver-partial,bone-marrow',
                'donationType' => 'required|in:direct-donation,non-direct-donation',
                'health' => 'nullable|array',
            ]);

            // Map donation type
            $donationType = $validated['donationType'] === 'direct-donation' ? 'directed' : 'non-directed';

            // Map organ value
            $organMap = [
                'kidney' => 'Kidney',
                'liver-partial' => 'Liver (Partial)',
                'bone-marrow' => 'Bone Marrow'
            ];
            $organ = $organMap[$validated['living-organ']] ?? $validated['living-organ'];

            // Create living donor
            $livingDonor = LivingDonor::create([
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone_nb' => $validated['phone'],
                'date_of_birth' => $validated['birth-date'],
                'gender' => $validated['gender'],
                'address' => $validated['address'],
                'blood_type' => $validated['blood-type'],
                'organ' => $organ,
                'medical_conditions' => $validated['health'] ?? [],
                'donation_type' => $donationType,
                'medical_status' => 'not_started',
                'ethics_status' => 'pending',
            ]);

            return response()->json([
                'message' => 'Living organ donation pledge submitted successfully.',
                'living_donor' => $livingDonor
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating living donor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
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
}
