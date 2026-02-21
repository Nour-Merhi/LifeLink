<?php

namespace App\Http\Controllers;

use App\Models\SystemSettings;
use Illuminate\Database\QueryException;

class SystemSettingsPublicController extends Controller
{
    /**
     * Public settings endpoint (used by landing page / dashboards for logo, name, etc.)
     */
    public function show()
    {
        try {
            try {
                $settings = SystemSettings::getSettings();
            } catch (QueryException $qe) {
                return response()->json([
                    'message' => 'System settings storage is not available. Please run database migrations.',
                    'hint' => 'Run: php artisan migrate',
                    'error' => config('app.debug') ? $qe->getMessage() : null,
                ], 503);
            }

            return response()->json([
                'platform_name' => $settings->platform_name,
                'system_logo' => $settings->system_logo, // stored as base64 data URL (or null)
                'contact_phone' => $settings->contact_phone,
                'system_email' => $settings->system_email,
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching public system settings:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch system settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}

