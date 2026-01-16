<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Donor;
use App\Models\UserSetting;
use App\Models\BloodType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    /**
     * Get all user settings (profile, medical, notifications, communication)
     */
    public function getAll(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }

            $user->load('donor.bloodType');
            $donor = $user->donor;

            // Get or create user settings
            $settings = UserSetting::firstOrCreate(
                ['user_id' => $user->id],
                [] // Use defaults from migration
            );

            // Get blood types for dropdowns
            $bloodTypes = BloodType::all();

            // Format blood types for frontend
            $bloodTypesFormatted = $bloodTypes->map(function($bt) {
                return [
                    'id' => $bt->id,
                    'type' => $bt->type,
                    'rh_factor' => $bt->rh_factor,
                    'full_name' => $bt->type . $bt->rh_factor,
                    'full_type' => $bt->type . $bt->rh_factor // Alias for compatibility
                ];
            });

            return response()->json([
                'profile' => [
                    'user' => [
                        'first_name' => $user->first_name,
                        'middle_name' => $user->middle_name,
                        'last_name' => $user->last_name,
                        'email' => $user->email,
                        'phone_nb' => $user->phone_nb,
                        'city' => $user->city,
                        'address' => $user->address,
                        'profile_picture' => $user->profile_picture,
                    ],
                    'donor' => $donor ? [
                        'blood_type_id' => $donor->blood_type_id,
                        'blood_type' => $donor->bloodType ? $donor->bloodType->type . $donor->bloodType->rh_factor : null,
                        'date_of_birth' => $donor->date_of_birth,
                        'address' => $donor->address,
                    ] : null
                ],
                'medical' => $donor ? [
                    'blood_type_id' => $donor->blood_type_id,
                    'blood_type' => $donor->bloodType ? $donor->bloodType->type . $donor->bloodType->rh_factor : null,
                    'weight' => $donor->weight,
                    'emergency_contact_name' => $donor->emergency_contact_name,
                    'emergency_contact_phone' => $donor->emergency_contact_phone,
                    'medical_conditions' => $donor->medical_conditions,
                ] : null,
                'notifications' => [
                    'sms_notifications' => $settings->sms_notifications,
                    'app_notifications' => $settings->app_notifications,
                    'email_notifications' => $settings->email_notifications,
                    'appointment_reminders' => $settings->appointment_reminders,
                    'emergency_alerts' => $settings->emergency_alerts,
                    'campaign_updates' => $settings->campaign_updates,
                    'mute_non_urgent' => $settings->mute_non_urgent,
                ],
                'communication' => [
                    'preferred_channel' => $settings->preferred_channel,
                    'hospital_updates' => $settings->hospital_updates,
                    'donation_campaigns' => $settings->donation_campaigns,
                ],
                'blood_types' => $bloodTypesFormatted
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching all settings:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get user profile settings
     */
    public function getProfile(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }

            $user->load('donor.bloodType');
            $donor = $user->donor;

            return response()->json([
                'user' => [
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'phone_nb' => $user->phone_nb,
                    'city' => $user->city,
                    'address' => $user->address,
                    'profile_picture' => $user->profile_picture,
                ],
                'donor' => $donor ? [
                    'blood_type_id' => $donor->blood_type_id,
                    'blood_type' => $donor->bloodType ? $donor->bloodType->type . $donor->bloodType->rh_factor : null,
                    'date_of_birth' => $donor->date_of_birth,
                    'address' => $donor->address,
                ] : null
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching profile settings:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch profile settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Update user profile settings
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }

            $validated = $request->validate([
                'first_name' => 'sometimes|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'sometimes|string|max:100',
                'email' => 'sometimes|email|unique:users,email,' . $user->id,
                'phone_nb' => 'sometimes|string|max:30|unique:users,phone_nb,' . $user->id,
                'city' => 'nullable|string|max:100',
                'address' => 'nullable|string',
                'profile_picture' => ['nullable', function ($attribute, $value, $fail) {
                    if ($value && !is_string($value)) {
                        $fail('The profile picture must be a valid string.');
                        return;
                    }
                    // Validate base64 image if it's a data URL
                    if ($value && strpos($value, 'data:image') === 0) {
                        $base64 = explode(',', $value)[1] ?? '';
                        // Check if it's valid base64
                        if (!base64_decode($base64, true)) {
                            $fail('The profile picture must be a valid base64 encoded image.');
                            return;
                        }
                        // Check size (max 2MB when decoded, base64 is ~33% larger)
                        if (strlen($base64) > 2800000) { // ~2MB * 1.4 for base64 overhead
                            $fail('The profile picture must be smaller than 2MB.');
                            return;
                        }
                    }
                }],
                'blood_type_id' => 'nullable|exists:blood_types,id',
                'date_of_birth' => 'nullable|date|before:today',
                'donor_address' => 'nullable|string',
            ]);

            // Update user fields
            $userUpdates = [];
            if (isset($validated['first_name'])) $userUpdates['first_name'] = $validated['first_name'];
            if (isset($validated['middle_name'])) $userUpdates['middle_name'] = $validated['middle_name'];
            if (isset($validated['last_name'])) $userUpdates['last_name'] = $validated['last_name'];
            if (isset($validated['email'])) $userUpdates['email'] = $validated['email'];
            if (isset($validated['phone_nb'])) $userUpdates['phone_nb'] = $validated['phone_nb'];
            if (isset($validated['city'])) $userUpdates['city'] = $validated['city'];
            if (isset($validated['address'])) $userUpdates['address'] = $validated['address'];
            // Handle profile picture - set to null if empty string, otherwise use the value
            if (array_key_exists('profile_picture', $validated)) {
                $userUpdates['profile_picture'] = $validated['profile_picture'] ?: null;
            }

            if (!empty($userUpdates)) {
                $user->update($userUpdates);
            }

            // Update donor fields if user is a donor
            $donor = $user->donor;
            if ($donor) {
                $donorUpdates = [];
                if (isset($validated['blood_type_id'])) $donorUpdates['blood_type_id'] = $validated['blood_type_id'];
                if (isset($validated['date_of_birth'])) $donorUpdates['date_of_birth'] = $validated['date_of_birth'];
                if (isset($validated['donor_address'])) $donorUpdates['address'] = $validated['donor_address'];

                if (!empty($donorUpdates)) {
                    $donor->update($donorUpdates);
                }
            }

            $user->load('donor.bloodType');

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => $user
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating profile settings:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update profile settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Permanently delete the authenticated user's account.
     * This will cascade-delete related records (donor/phlebotomist/manager/settings/messages, etc.)
     * based on existing FK constraints.
     */
    public function deleteAccount(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated. Please log in to access this endpoint.'
            ], 401);
        }

        try {
            DB::transaction(function () use ($request, $user) {
                // Revoke tokens if Sanctum personal tokens are in use
                if (method_exists($user, 'tokens')) {
                    try {
                        $user->tokens()->delete();
                    } catch (\Throwable $e) {
                        // ignore if tokens table isn't used in this project
                    }
                }

                // Logout session (if any)
                Auth::guard('web')->logout();
                if ($request->hasSession()) {
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                }

                // Deleting the user cascades to donor/mobile_phlebotomist/health_center_manager/etc.
                $user->delete();
            });

            return response()->json([
                'message' => 'Account deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error deleting account:', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to delete account',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get medical information
     */
    public function getMedicalInfo(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }

            $donor = $user->donor;

            if (!$donor) {
                return response()->json([
                    'message' => 'Donor record not found.',
                    'error' => 'donor_not_found'
                ], 404);
            }

            $donor->load('bloodType');

            return response()->json([
                'blood_type_id' => $donor->blood_type_id,
                'blood_type' => $donor->bloodType ? $donor->bloodType->type . $donor->bloodType->rh_factor : null,
                'weight' => $donor->weight,
                'emergency_contact_name' => $donor->emergency_contact_name,
                'emergency_contact_phone' => $donor->emergency_contact_phone,
                'medical_conditions' => $donor->medical_conditions,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching medical information:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch medical information',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Update medical information
     */
    public function updateMedicalInfo(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }

            $donor = $user->donor;

            if (!$donor) {
                return response()->json([
                    'message' => 'Donor record not found.',
                    'error' => 'donor_not_found'
                ], 404);
            }

            $validated = $request->validate([
                'blood_type_id' => 'sometimes|exists:blood_types,id',
                'weight' => 'nullable|numeric|min:0|max:500',
                'emergency_contact_name' => 'nullable|string|max:100',
                'emergency_contact_phone' => 'nullable|string|max:30',
                'medical_conditions' => 'nullable|string|max:500',
            ]);

            $updates = [];
            if (isset($validated['blood_type_id'])) $updates['blood_type_id'] = $validated['blood_type_id'];
            if (isset($validated['weight'])) $updates['weight'] = $validated['weight'];
            if (isset($validated['emergency_contact_name'])) $updates['emergency_contact_name'] = $validated['emergency_contact_name'];
            if (isset($validated['emergency_contact_phone'])) $updates['emergency_contact_phone'] = $validated['emergency_contact_phone'];
            if (isset($validated['medical_conditions'])) {
                // Store as JSON array if it's a string
                $updates['medical_conditions'] = is_string($validated['medical_conditions']) 
                    ? json_decode($validated['medical_conditions'], true) ?? $validated['medical_conditions']
                    : $validated['medical_conditions'];
            }

            $donor->update($updates);
            $donor->load('bloodType');

            return response()->json([
                'message' => 'Medical information updated successfully',
                'donor' => $donor
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating medical information:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update medical information',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }

            $validated = $request->validate([
                'current_password' => 'required|string',
                'new_password' => [
                    'required',
                    'string',
                    'min:8',
                    'regex:/[A-Z]/',       // uppercase
                    'regex:/[a-z]/',       // lowercase
                    'regex:/[0-9]/',       // number
                    'regex:/[^A-Za-z0-9]/', // special character
                    'confirmed'
                ],
            ], [
                'new_password.regex' => 'The password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
            ]);

            // Verify current password
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Current password is incorrect',
                    'errors' => ['current_password' => ['The current password you entered is incorrect.']]
                ], 422);
            }

            // Update password
            $user->update([
                'password' => Hash::make($validated['new_password'])
            ]);

            return response()->json([
                'message' => 'Password updated successfully'
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating password:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update password',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get notification settings
     */
    public function getNotificationSettings(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }

            $settings = UserSetting::firstOrCreate(
                ['user_id' => $user->id],
                [] // Use defaults from migration
            );

            return response()->json([
                'sms_notifications' => $settings->sms_notifications,
                'app_notifications' => $settings->app_notifications,
                'email_notifications' => $settings->email_notifications,
                'appointment_reminders' => $settings->appointment_reminders,
                'emergency_alerts' => $settings->emergency_alerts,
                'campaign_updates' => $settings->campaign_updates,
                'mute_non_urgent' => $settings->mute_non_urgent,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching notification settings:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch notification settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Update notification settings
     */
    public function updateNotificationSettings(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }

            $validated = $request->validate([
                'sms_notifications' => 'sometimes|boolean',
                'app_notifications' => 'sometimes|boolean',
                'email_notifications' => 'sometimes|boolean',
                'appointment_reminders' => 'sometimes|boolean',
                'emergency_alerts' => 'sometimes|boolean',
                'campaign_updates' => 'sometimes|boolean',
                'mute_non_urgent' => 'sometimes|boolean',
            ]);

            $settings = UserSetting::updateOrCreate(
                ['user_id' => $user->id],
                $validated
            );

            return response()->json([
                'message' => 'Notification settings updated successfully',
                'settings' => $settings
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating notification settings:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update notification settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get communication preferences
     */
    public function getCommunicationPreferences(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }

            $settings = UserSetting::firstOrCreate(
                ['user_id' => $user->id],
                [] // Use defaults from migration
            );

            return response()->json([
                'preferred_channel' => $settings->preferred_channel,
                'hospital_updates' => $settings->hospital_updates,
                'donation_campaigns' => $settings->donation_campaigns,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching communication preferences:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch communication preferences',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Update communication preferences
     */
    public function updateCommunicationPreferences(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }

            $validated = $request->validate([
                'preferred_channel' => 'sometimes|in:sms,email,both',
                'hospital_updates' => 'sometimes|boolean',
                'donation_campaigns' => 'sometimes|boolean',
            ]);

            $settings = UserSetting::updateOrCreate(
                ['user_id' => $user->id],
                $validated
            );

            return response()->json([
                'message' => 'Communication preferences updated successfully',
                'settings' => $settings
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating communication preferences:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update communication preferences',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}
