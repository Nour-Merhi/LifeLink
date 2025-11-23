<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\HospitalSetting;
use App\Models\Hospital;

class HospitalSettingController extends Controller
{
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
