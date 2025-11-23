<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BloodInventory;
use App\Models\BloodType;
use Carbon\Carbon;

class BloodInventoryController extends Controller
{
    /**
     * Display a listing of blood inventory
     */
    public function index(Request $request, $hospitalId = null)
    {
        $hospitalId = $hospitalId ?? $request->input('hospital_id');
        
        $query = BloodInventory::where('hospital_id', $hospitalId)
            ->with(['hospital', 'bloodType'])
            ->orderBy('expiry_date', 'asc');

        if ($request->has('blood_type_id')) {
            $query->where('blood_type_id', $request->blood_type_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Auto-update expired items
        BloodInventory::where('hospital_id', $hospitalId)
            ->where('expiry_date', '<', now()->toDateString())
            ->where('status', 'available')
            ->update(['status' => 'expired']);

        $inventory = $query->paginate($request->input('per_page', 15));

        // Get summary by blood type
        $summary = BloodInventory::where('hospital_id', $hospitalId)
            ->where('status', 'available')
            ->join('blood_types', 'blood_inventory.blood_type_id', '=', 'blood_types.id')
            ->select('blood_types.id', 'blood_types.type', 'blood_types.rh_factor', 
                \DB::raw('SUM(blood_inventory.quantity) as total'))
            ->groupBy('blood_types.id', 'blood_types.type', 'blood_types.rh_factor')
            ->get()
            ->map(function($item) {
                return [
                    'blood_type_id' => $item->id,
                    'blood_type' => $item->type . $item->rh_factor,
                    'quantity' => $item->total ?? 0,
                ];
            });

        return response()->json([
            'inventory' => $inventory->items(),
            'summary' => $summary,
            'total' => $inventory->total(),
            'current_page' => $inventory->currentPage(),
        ], 200);
    }

    /**
     * Store a newly created blood inventory entry
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'hospital_id' => 'required|exists:hospitals,id',
            'blood_type_id' => 'required|exists:blood_types,id',
            'quantity' => 'required|integer|min:1',
            'expiry_date' => 'required|date|after:today',
            'note' => 'nullable|string',
        ]);

        $inventory = BloodInventory::create([
            'hospital_id' => $validated['hospital_id'],
            'blood_type_id' => $validated['blood_type_id'],
            'quantity' => $validated['quantity'],
            'expiry_date' => $validated['expiry_date'],
            'status' => 'available',
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'message' => 'Blood inventory added successfully',
            'inventory' => $inventory->load(['hospital', 'bloodType']),
        ], 201);
    }

    /**
     * Update the specified blood inventory entry
     */
    public function update(Request $request, $id)
    {
        $inventory = BloodInventory::findOrFail($id);

        $validated = $request->validate([
            'quantity' => 'sometimes|required|integer|min:0',
            'expiry_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:available,expired,used',
            'note' => 'nullable|string',
        ]);

        $inventory->update($validated);

        return response()->json([
            'message' => 'Blood inventory updated successfully',
            'inventory' => $inventory->load(['hospital', 'bloodType']),
        ], 200);
    }

    /**
     * Remove the specified blood inventory entry
     */
    public function destroy($id)
    {
        $inventory = BloodInventory::findOrFail($id);
        $inventory->delete();

        return response()->json(['message' => 'Blood inventory entry deleted successfully'], 200);
    }
}
