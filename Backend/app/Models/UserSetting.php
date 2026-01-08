<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'sms_notifications',
        'app_notifications',
        'email_notifications',
        'appointment_reminders',
        'emergency_alerts',
        'campaign_updates',
        'mute_non_urgent',
        'preferred_channel',
        'hospital_updates',
        'donation_campaigns',
    ];

    protected $casts = [
        'sms_notifications' => 'boolean',
        'app_notifications' => 'boolean',
        'email_notifications' => 'boolean',
        'appointment_reminders' => 'boolean',
        'emergency_alerts' => 'boolean',
        'campaign_updates' => 'boolean',
        'mute_non_urgent' => 'boolean',
        'hospital_updates' => 'boolean',
        'donation_campaigns' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
