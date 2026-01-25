<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\HospitalSetting;
use App\Models\Hospital;

class HospitalSettingController extends Controller
{
    private function resolveHospitalIdFromAuth(Request $request)
    {
        $user = $request->user();
        if (!$user) return null;

        $role = strtolower((string)($user->role ?? ''));
        if ($role !== 'manager') return null;

        if ($user->healthCenterManager && $user->healthCenterManager->hospital_id) {
            return $user->healthCenterManager->hospital_id;
        }

        return null;
    }

    /**
     * Display hospital settings for authenticated manager (hospital-scoped).
     */
    public function showForManager(Request $request)
    {
        $hospitalId = $this->resolveHospitalIdFromAuth($request);
        if (!$hospitalId) {
            return response()->json(['message' => 'Unauthorized or hospital not resolved from user'], 403);
        }

        $hospital = Hospital::find($hospitalId);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found'], 404);
        }

        $settings = HospitalSetting::firstOrCreate(
            ['hospital_id' => $hospitalId],
            ['default_time_gap_minutes' => 60]
        );

        return response()->json([
            'settings' => [
                'hospitalName' => $hospital->name,
                'address' => $hospital->address,
                'phone' => $hospital->phone_nb,
                'email' => $hospital->email,
                'operatingHours' => $hospital->hours,
                'emergencyContact' => $settings->emergency_contact ?? '',
                'bloodBankCapacity' => $settings->blood_bank_capacity ?? '',
                'autoReorderThreshold' => $settings->auto_reorder_threshold ?? '',
            ],
            'raw' => [
                'hospital' => $hospital,
                'hospital_settings' => $settings,
            ]
        ], 200);
    }

    /**
     * Update hospital settings for authenticated manager (hospital-scoped).
     */
    public function updateForManager(Request $request)
    {
        $hospitalId = $this->resolveHospitalIdFromAuth($request);
        if (!$hospitalId) {
            return response()->json(['message' => 'Unauthorized or hospital not resolved from user'], 403);
        }

        $hospital = Hospital::find($hospitalId);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found'], 404);
        }

        $validated = $request->validate([
            'hospitalName' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'operatingHours' => 'nullable|string|max:255',
            'emergencyContact' => 'nullable|string|max:255',
            'bloodBankCapacity' => 'nullable|integer|min:0',
            'autoReorderThreshold' => 'nullable|integer|min:0',
        ]);

        // Update hospital core fields (kept on hospitals table)
        $hospital->fill([
            'name' => $validated['hospitalName'] ?? $hospital->name,
            'address' => $validated['address'] ?? $hospital->address,
            'phone_nb' => $validated['phone'] ?? $hospital->phone_nb,
            'email' => $validated['email'] ?? $hospital->email,
            'hours' => $validated['operatingHours'] ?? $hospital->hours,
        ]);
        $hospital->save();

        // Update settings extensions (kept on hospital_settings table)
        $settings = HospitalSetting::firstOrCreate(['hospital_id' => $hospitalId], ['default_time_gap_minutes' => 60]);
        $settings->fill([
            'emergency_contact' => $validated['emergencyContact'] ?? $settings->emergency_contact,
            'blood_bank_capacity' => $validated['bloodBankCapacity'] ?? $settings->blood_bank_capacity,
            'auto_reorder_threshold' => $validated['autoReorderThreshold'] ?? $settings->auto_reorder_threshold,
        ]);
        $settings->save();

        return response()->json([
            'message' => 'Hospital settings updated successfully',
            'settings' => [
                'hospitalName' => $hospital->name,
                'address' => $hospital->address,
                'phone' => $hospital->phone_nb,
                'email' => $hospital->email,
                'operatingHours' => $hospital->hours,
                'emergencyContact' => $settings->emergency_contact ?? '',
                'bloodBankCapacity' => $settings->blood_bank_capacity ?? '',
                'autoReorderThreshold' => $settings->auto_reorder_threshold ?? '',
            ],
        ], 200);
    }

    /**
     * Display the specified hospital settings
     */
    public function show($hospitalId)
    {
        $settings = HospitalSetting::firstOrCreate(
            ['hospital_id' => $hospitalId],
            ['default_time_gap_minutes' => 60]
        );

        return response()->json([
            'settings' => $settings->load('hospital'),
        ], 200);
    }

    /**
     * Update the specified hospital settings
     */
    public function update(Request $request, $hospitalId)
    {
        $validated = $request->validate([
            'logo' => 'nullable|string',
            'about' => 'nullable|string',
            'phone_number' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'working_hours' => 'nullable|array',
            'default_time_gap_minutes' => 'nullable|integer|min:15|max:480',
            'auto_approval_rules' => 'nullable|array',
        ]);

        $settings = HospitalSetting::firstOrCreate(['hospital_id' => $hospitalId]);
        $settings->update($validated);

        return response()->json([
            'message' => 'Hospital settings updated successfully',
            'settings' => $settings->load('hospital'),
        ], 200);
    }
}
