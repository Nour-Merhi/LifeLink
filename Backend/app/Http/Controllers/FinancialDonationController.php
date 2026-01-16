<?php

namespace App\Http\Controllers;

use App\Models\FinancialDonation;
use App\Models\Donor;
use App\Models\PatientCase;
use App\Services\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class FinancialDonationController extends Controller
{
    /**
     * Store a new financial donation
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'donation_type' => 'required|in:one time,monthly',
            'donation_amount' => 'required|numeric|min:0.01',
            'recipient_chosen' => 'nullable|in:general patient,specific patient',
            'payment_method' => 'required|in:credit card,wish,cash',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'patient_case_id' => 'nullable|integer|exists:patient_cases,id', // Will work when patient_cases table exists
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $donorId = null;
            
            // If user is authenticated, get their donor ID
            if (Auth::check()) {
                $user = Auth::user();
                $donor = Donor::where('user_id', $user->id)->first();
                if ($donor) {
                    $donorId = $donor->id;
                }
            }

            // Create the donation
            $donation = FinancialDonation::create([
                'donor_id' => $donorId,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'donation_type' => $request->donation_type,
                'donation_amount' => $request->donation_amount,
                'recipient_chosen' => $request->recipient_chosen ?? 'general patient',
                'patient_case_id' => $request->patient_case_id,
                'payment_method' => $request->payment_method,
                'status' => 'pending', // Will be updated when payment is processed
            ]);

            // Award XP to donor if authenticated
            if ($donorId) {
                try {
                    XpService::awardFinancialDonationXp(
                        $donorId,
                        $donation->donation_amount,
                        'FinancialDonation',
                        $donation->id
                    );
                } catch (\Exception $e) {
                    // Log but don't fail the donation if XP fails
                    Log::warning('Failed to award XP for financial donation', [
                        'donation_id' => $donation->id,
                        'donor_id' => $donorId,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Update patient case funding if this is a specific patient donation
            if ($donation->patient_case_id && $donation->status === 'completed') {
                try {
                    $patientCase = PatientCase::find($donation->patient_case_id);
                    if ($patientCase) {
                        $patientCase->updateFunding();
                    }
                } catch (\Exception $e) {
                    // Log but don't fail the donation
                    Log::warning('Failed to update patient case funding', [
                        'donation_id' => $donation->id,
                        'patient_case_id' => $donation->patient_case_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            return response()->json([
                'message' => 'Financial donation submitted successfully',
                'donation' => $donation
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating financial donation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to process donation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all financial donations (for admin/authenticated users)
     */
    public function index(Request $request)
    {
        try {
            $query = FinancialDonation::with('donor.user');

            // If user is authenticated and is a donor, show only their donations
            if (Auth::check()) {
                $user = Auth::user();
                $donor = Donor::where('user_id', $user->id)->first();
                
                // If user is not admin, filter by donor_id
                if ($donor && $user->role !== 'admin') {
                    $query->where('donor_id', $donor->id);
                }
            } else {
                // Non-authenticated users can't see donations
                return response()->json([
                    'message' => 'Unauthorized'
                ], 401);
            }

            $donations = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'donations' => $donations,
                'total' => $donations->count()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching financial donations', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to fetch donations'
            ], 500);
        }
    }

    /**
     * Get a specific donation by ID or code
     */
    public function show($id)
    {
        try {
            // Try to find by code first, then by id
            $donation = FinancialDonation::with(['donor.user', 'patientCase.hospital'])
                ->where(function($query) use ($id) {
                    $query->where('code', $id)
                          ->orWhere('id', $id);
                })
                ->firstOrFail();

            // Check authorization
            if (Auth::check()) {
                $user = Auth::user();
                $donor = Donor::where('user_id', $user->id)->first();
                
                // If user is not admin and not the owner, deny access
                if ($user->role !== 'admin' && $donation->donor_id !== $donor?->id) {
                    return response()->json([
                        'message' => 'Unauthorized'
                    ], 403);
                }
            } else {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 401);
            }

            return response()->json([
                'donation' => $donation
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Donation not found'
            ], 404);
        }
    }

    /**
     * Update a financial donation (admin only)
     * Note: This method is called from admin dashboard routes, so admin access is assumed
     */
    public function update(Request $request, $id)
    {
        try {
            // Try to find by code first, then by id
            $donation = FinancialDonation::where(function($query) use ($id) {
                    $query->where('code', $id)
                          ->orWhere('id', $id);
                })
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'status' => 'nullable|in:pending,completed,failed',
                'donation_amount' => 'nullable|numeric|min:0.01',
                'payment_method' => 'nullable|in:credit card,wish,cash',
                'name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $oldStatus = $donation->status;
            $donation->fill($request->only([
                'status',
                'donation_amount',
                'payment_method',
                'name',
                'email',
                'phone'
            ]));
            $donation->save();

            // If status changed to completed and it's linked to a patient case, update funding
            if ($oldStatus !== 'completed' && $donation->status === 'completed' && $donation->patient_case_id) {
                try {
                    $patientCase = PatientCase::find($donation->patient_case_id);
                    if ($patientCase) {
                        $patientCase->updateFunding();
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to update patient case funding after donation update', [
                        'donation_id' => $donation->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            $donation->load('donor.user', 'patientCase');

            return response()->json([
                'message' => 'Transaction updated successfully',
                'donation' => $donation
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Transaction not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error updating financial donation', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to update transaction: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a financial donation (admin only)
     * Note: This method is called from admin dashboard routes, so admin access is assumed
     */
    public function destroy($id)
    {
        try {
            // Try to find by code first, then by id
            $donation = FinancialDonation::where(function($query) use ($id) {
                    $query->where('code', $id)
                          ->orWhere('id', $id);
                })
                ->firstOrFail();

            $donation->delete();

            return response()->json([
                'message' => 'Transaction deleted successfully'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Transaction not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting financial donation', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to delete transaction: ' . $e->getMessage()
            ], 500);
        }
    }
}
