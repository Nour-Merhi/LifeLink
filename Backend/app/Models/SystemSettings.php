<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSettings extends Model
{
    use HasFactory;

    protected $table = 'system_settings';

    protected $fillable = [
        'platform_name',
        'system_logo',
        'system_email',
        'contact_phone',
        'default_language',
        'timezone',
        'min_days_between_donations',
        'allowed_blood_types',
        'emergency_request_expiry',
        'donor_age_min',
        'donor_age_max',
    ];

    protected $casts = [
        'allowed_blood_types' => 'array',
    ];

    /**
     * Get the system settings singleton instance
     */
    public static function getSettings()
    {
        $settings = self::first();
        
        // If no settings exist, create default ones
        if (!$settings) {
            $settings = self::create([
                'platform_name' => 'LifeLink',
                'system_email' => null,
                'contact_phone' => null,
                'default_language' => 'en',
                'timezone' => 'UTC',
                'min_days_between_donations' => 56,
                'allowed_blood_types' => ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
                'emergency_request_expiry' => '24h',
                'donor_age_min' => 18,
                'donor_age_max' => 65,
            ]);
        }
        
        return $settings;
    }

    /**
     * Update system settings
     */
    public static function updateSettings(array $data)
    {
        $settings = self::getSettings();
        $settings->update($data);
        return $settings;
    }
}


