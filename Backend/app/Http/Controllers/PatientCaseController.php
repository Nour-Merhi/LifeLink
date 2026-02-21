<?php

namespace App\Http\Controllers;

use App\Models\PatientCase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PatientCaseController extends Controller
{
    /**
     * Get active patient cases for public display
     */
    public function index(Request $request)
    {
        try {
            // Get only active cases
            // Order by severity (high first) then due_date - use CASE for MySQL/PostgreSQL compatibility
            $query = PatientCase::where('status', 'active')
                ->with('hospital')
                ->orderByRaw("CASE severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END")
                ->orderBy('due_date', 'asc'); // Urgent cases first (earliest due date)

            // Calculate additional fields for each case
            $patientCases = $query->get()->map(function ($case) {
                // Calculate age
                $age = Carbon::parse($case->date_of_birth)->age;
                
                // Calculate days remaining
                $daysRemaining = (int) max(0, Carbon::now()->diffInDays(Carbon::parse($case->due_date), false));
                
                // Get donor count (DB-agnostic: COUNT(DISTINCT donor_id))
                $donorsCount = (int) $case->financialDonations()
                    ->where('status', 'completed')
                    ->selectRaw('COUNT(DISTINCT donor_id) as c')
                    ->value('c');
                
                // Calculate funding percentage
                $fundingPercentage = $case->target_amount > 0 
                    ? round(($case->current_funding / $case->target_amount) * 100, 2)
                    : 0;

                return [
                    'id' => $case->id,
                    'code' => $case->code,
                    'patientName' => $case->full_name,
                    'condition' => $case->case_title,
                    'description' => $case->description,
                    'age' => $age,
                    'currentFunding' => floatval($case->current_funding),
                    'targetFunding' => floatval($case->target_amount),
                    'donorsCount' => $donorsCount,
                    'hospital' => $case->hospital_name,
                    'hospitalId' => $case->hospital_id,
                    'daysRemaining' => $daysRemaining,
                    'status' => $case->status,
                    'severity' => $case->severity,
                    'image' => $case->image,
                    'fundingPercentage' => $fundingPercentage,
                    'created_at' => $case->created_at->format('Y-m-d'),
                ];
            });

            return response()->json([
                'patientCases' => $patientCases,
                'total' => $patientCases->count()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching patient cases', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'patientCases' => [],
                'total' => 0,
                'error' => 'Failed to fetch patient cases'
            ], 500);
        }
    }

    /**
     * Get a specific patient case by ID or code
     */
    public function show($identifier)
    {
        try {
            $patientCase = PatientCase::where('id', $identifier)
                ->orWhere('code', $identifier)
                ->with('hospital')
                ->firstOrFail();

            // Calculate age
            $age = Carbon::parse($patientCase->date_of_birth)->age;
            
            // Calculate days remaining
            $daysRemaining = max(0, Carbon::now()->diffInDays(Carbon::parse($patientCase->due_date), false));
            $daysRemaining = (int) $daysRemaining;
            
            // Get donor count (DB-agnostic)
            $donorsCount = (int) $patientCase->financialDonations()
                ->where('status', 'completed')
                ->selectRaw('COUNT(DISTINCT donor_id) as c')
                ->value('c');
            
            // Calculate funding percentage
            $fundingPercentage = $patientCase->target_amount > 0 
                ? round(($patientCase->current_funding / $patientCase->target_amount) * 100, 2)
                : 0;

            $caseData = [
                'id' => $patientCase->id,
                'code' => $patientCase->code,
                'patientName' => $patientCase->full_name,
                'condition' => $patientCase->case_title,
                'description' => $patientCase->description,
                'age' => $age,
                'currentFunding' => floatval($patientCase->current_funding),
                'targetFunding' => floatval($patientCase->target_amount),
                'donorsCount' => $donorsCount,
                'hospital' => $patientCase->hospital_name,
                'hospitalId' => $patientCase->hospital_id,
                'daysRemaining' => $daysRemaining,
                'status' => $patientCase->status,
                'severity' => $patientCase->severity,
                'image' => $patientCase->image,
                'fundingPercentage' => $fundingPercentage,
                'dateOfBirth' => $patientCase->date_of_birth->format('Y-m-d'),
                'gender' => $patientCase->gender,
                'dueDate' => $patientCase->due_date->format('Y-m-d'),
                'created_at' => $patientCase->created_at->format('Y-m-d'),
            ];

            return response()->json([
                'patientCase' => $caseData
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching patient case', [
                'identifier' => $identifier,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Patient case not found'
            ], 404);
        }
    }
}
