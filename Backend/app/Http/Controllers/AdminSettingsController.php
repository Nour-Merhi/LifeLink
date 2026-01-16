<?php

namespace App\Http\Controllers;

use App\Models\SystemSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\QueryException;

class AdminSettingsController extends Controller
{
    /**
     * Get all system settings
     */
    public function getSettings(Request $request)
    {
        try {
            // Check if user is admin
            $user = Auth::user();
            if (!$user || strtolower($user->role) !== 'admin') {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            try {
                $settings = SystemSettings::getSettings();
            } catch (QueryException $qe) {
                // Common local-dev issue: migrations not run / table missing
                return response()->json([
                    'message' => 'System settings storage is not available. Please run database migrations.',
                    'hint' => 'Run: php artisan migrate',
                    'error' => config('app.debug') ? $qe->getMessage() : null,
                ], 503);
            }

            // Format response to match frontend expectations
            return response()->json([
                'general' => [
                    'platform_name' => $settings->platform_name,
                    'system_logo' => $settings->system_logo,
                    'system_logo_preview' => $settings->system_logo, // For preview in frontend
                    'system_email' => $settings->system_email,
                    'contact_phone' => $settings->contact_phone,
                    'default_language' => $settings->default_language,
                    'timezone' => $settings->timezone,
                ],
                'medical' => [
                    'min_days_between_donations' => $settings->min_days_between_donations,
                    'allowed_blood_types' => $settings->allowed_blood_types ?? ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
                    'emergency_request_expiry' => $settings->emergency_request_expiry,
                    'donor_age_min' => $settings->donor_age_min,
                    'donor_age_max' => $settings->donor_age_max,
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching system settings:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Update general system settings
     */
    public function updateGeneralSettings(Request $request)
    {
        try {
            // Check if user is admin
            $user = Auth::user();
            if (!$user || strtolower($user->role) !== 'admin') {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            try {
                $validated = $request->validate([
                'platform_name' => 'required|string|max:100',
                'system_logo' => ['nullable', function ($attribute, $value, $fail) {
                    if ($value && !is_string($value)) {
                        $fail('The system logo must be a valid string.');
                        return;
                    }
                    // Validate base64 image if it's a data URL
                    if ($value && strpos($value, 'data:image') === 0) {
                        $base64 = explode(',', $value)[1] ?? '';
                        // Check if it's valid base64
                        if (!base64_decode($base64, true)) {
                            $fail('The system logo must be a valid base64 encoded image.');
                            return;
                        }
                        // Check size (max 2MB when decoded, base64 is ~33% larger)
                        if (strlen($base64) > 2800000) { // ~2MB * 1.4 for base64 overhead
                            $fail('The system logo must be smaller than 2MB.');
                            return;
                        }
                    }
                }],
                'system_email' => 'required|email|max:255',
                'contact_phone' => 'nullable|string|max:30',
                'default_language' => 'required|string|in:en,ar,fr',
                'timezone' => 'required|string|max:100',
                ]);
            } catch (QueryException $qe) {
                return response()->json([
                    'message' => 'System settings storage is not available. Please run database migrations.',
                    'hint' => 'Run: php artisan migrate',
                    'error' => config('app.debug') ? $qe->getMessage() : null,
                ], 503);
            }

            // Update settings
            $updateData = [
                'platform_name' => $validated['platform_name'],
                'system_email' => $validated['system_email'],
                'contact_phone' => $validated['contact_phone'] ?? null,
                'default_language' => $validated['default_language'],
                'timezone' => $validated['timezone'],
            ];

            // Handle logo update
            if (array_key_exists('system_logo', $validated)) {
                $updateData['system_logo'] = $validated['system_logo'] ?: null;
            }

            try {
                $settings = SystemSettings::updateSettings($updateData);
            } catch (QueryException $qe) {
                return response()->json([
                    'message' => 'System settings storage is not available. Please run database migrations.',
                    'hint' => 'Run: php artisan migrate',
                    'error' => config('app.debug') ? $qe->getMessage() : null,
                ], 503);
            }

            return response()->json([
                'message' => 'General settings updated successfully',
                'general' => [
                    'platform_name' => $settings->platform_name,
                    'system_logo' => $settings->system_logo,
                    'system_logo_preview' => $settings->system_logo,
                    'system_email' => $settings->system_email,
                    'contact_phone' => $settings->contact_phone,
                    'default_language' => $settings->default_language,
                    'timezone' => $settings->timezone,
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating general settings:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update general settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Update medical/donation settings
     */
    public function updateMedicalSettings(Request $request)
    {
        try {
            // Check if user is admin
            $user = Auth::user();
            if (!$user || strtolower($user->role) !== 'admin') {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            try {
                $validated = $request->validate([
                'min_days_between_donations' => 'required|integer|min:1|max:365',
                'allowed_blood_types' => 'required|array|min:1',
                'allowed_blood_types.*' => 'required|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
                'emergency_request_expiry' => 'required|string|in:6h,12h,24h,48h',
                'donor_age_min' => 'required|integer|min:16|max:100',
                'donor_age_max' => 'required|integer|min:16|max:100',
            ], [
                'allowed_blood_types.required' => 'At least one blood type must be selected.',
                'allowed_blood_types.min' => 'At least one blood type must be selected.',
                'donor_age_min.max' => 'Minimum age must be less than maximum age.',
                'donor_age_max.min' => 'Maximum age must be greater than minimum age.',
                ]);
            } catch (QueryException $qe) {
                return response()->json([
                    'message' => 'System settings storage is not available. Please run database migrations.',
                    'hint' => 'Run: php artisan migrate',
                    'error' => config('app.debug') ? $qe->getMessage() : null,
                ], 503);
            }

            // Additional validation: min age must be less than max age
            if ($validated['donor_age_min'] >= $validated['donor_age_max']) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => [
                        'donor_age_min' => ['Minimum age must be less than maximum age.'],
                        'donor_age_max' => ['Maximum age must be greater than minimum age.']
                    ]
                ], 422);
            }

            // Update settings
            $updateData = [
                'min_days_between_donations' => $validated['min_days_between_donations'],
                'allowed_blood_types' => $validated['allowed_blood_types'],
                'emergency_request_expiry' => $validated['emergency_request_expiry'],
                'donor_age_min' => $validated['donor_age_min'],
                'donor_age_max' => $validated['donor_age_max'],
            ];

            try {
                $settings = SystemSettings::updateSettings($updateData);
            } catch (QueryException $qe) {
                return response()->json([
                    'message' => 'System settings storage is not available. Please run database migrations.',
                    'hint' => 'Run: php artisan migrate',
                    'error' => config('app.debug') ? $qe->getMessage() : null,
                ], 503);
            }

            return response()->json([
                'message' => 'Medical settings updated successfully',
                'medical' => [
                    'min_days_between_donations' => $settings->min_days_between_donations,
                    'allowed_blood_types' => $settings->allowed_blood_types,
                    'emergency_request_expiry' => $settings->emergency_request_expiry,
                    'donor_age_min' => $settings->donor_age_min,
                    'donor_age_max' => $settings->donor_age_max,
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating medical settings:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update medical settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}


