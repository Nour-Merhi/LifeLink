<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EmergencyRequest;
use App\Models\Hospital;
use App\Models\Donor;
use App\Models\BloodType;
use Illuminate\Support\Facades\DB;

class EmergencyRequestController extends Controller
{
    /**
     * Display a listing of emergency requests
     */
    public function index(Request $request, $hospitalId = null)
    {
        $hospitalId = $hospitalId ?? $request->input('hospital_id');
        
        $query = EmergencyRequest::where('hospital_id', $hospitalId)
            ->with('hospital')
            ->orderBy('deadline', 'asc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('blood_type')) {
            $query->where('required_blood_type', $request->blood_type);
        }

        $requests = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'emergency_requests' => $requests->items(),
            'total' => $requests->total(),
            'current_page' => $requests->currentPage(),
        ], 200);
    }

    /**
     * Store a newly created emergency request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'hospital_id' => 'required|exists:hospitals,id',
            'patient_name' => 'required|string|max:255',
            'required_blood_type' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'required_organ' => 'nullable|string',
            'required_quantity' => 'required|integer|min:1',
            'deadline' => 'required|date|after:now',
            'note' => 'nullable|string',
        ]);

        // At least one requirement must be specified
        if (empty($validated['required_blood_type']) && empty($validated['required_organ'])) {
            return response()->json([
                'message' => 'Either blood type or organ must be specified'
            ], 422);
        }

        $request = EmergencyRequest::create([
            'hospital_id' => $validated['hospital_id'],
            'patient_name' => $validated['patient_name'],
            'required_blood_type' => $validated['required_blood_type'] ?? null,
            'required_organ' => $validated['required_organ'] ?? null,
            'required_quantity' => $validated['required_quantity'],
            'deadline' => $validated['deadline'],
            'status' => 'pending',
            'note' => $validated['note'] ?? null,
        ]);

        // TODO: Auto-notify suitable donors

        return response()->json([
            'message' => 'Emergency request created successfully',
            'emergency_request' => $request->load('hospital'),
        ], 201);
    }

    /**
     * Display the specified emergency request
     */
    public function show($id)
    {
        $request = EmergencyRequest::with('hospital')->findOrFail($id);
        return response()->json(['emergency_request' => $request], 200);
    }

    /**
     * Update the specified emergency request
     */
    public function update(Request $request, $id)
    {
        $emergencyRequest = EmergencyRequest::findOrFail($id);

        $validated = $request->validate([
            'patient_name' => 'sometimes|required|string|max:255',
            'required_blood_type' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'required_organ' => 'nullable|string',
            'required_quantity' => 'sometimes|required|integer|min:1',
            'deadline' => 'sometimes|required|date|after:now',
            'status' => 'sometimes|required|in:pending,fulfilled,failed',
            'note' => 'nullable|string',
        ]);

        $emergencyRequest->update($validated);

        return response()->json([
            'message' => 'Emergency request updated successfully',
            'emergency_request' => $emergencyRequest->load('hospital'),
        ], 200);
    }

    /**
     * Remove the specified emergency request
     */
    public function destroy($id)
    {
        $request = EmergencyRequest::findOrFail($id);
        $request->delete();

        return response()->json(['message' => 'Emergency request deleted successfully'], 200);
    }

    /**
     * Get suitable donors for an emergency request
     */
    public function getSuitableDonors($id)
    {
        $emergencyRequest = EmergencyRequest::findOrFail($id);

        $query = Donor::with(['user', 'bloodType'])
            ->where('status', 'active');

        if ($emergencyRequest->required_blood_type) {
            $bloodType = BloodType::where('type', substr($emergencyRequest->required_blood_type, 0, -1))
                ->where('rh_factor', substr($emergencyRequest->required_blood_type, -1))
                ->first();
            
            if ($bloodType) {
                $query->where('blood_type_id', $bloodType->id);
            }
        }

        $donors = $query->get();

        return response()->json([
            'donors' => $donors,
            'total' => $donors->count(),
        ], 200);
    }
}
