<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class LivingDonor extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone_nb',
        'date_of_birth',
        'gender',
        'address',
        'blood_type',
        'organ',
        'medical_conditions',
        'donation_type',
        'medical_status',
        'ethics_status',
        'appointment_status',
        'suggested_appointments',
        'suggestions_sent_at',
        'selected_appointment_at',
        'selected_at',
        'appointment_completed_at',
        'appointment_cancelled_at',
        'appointment_cancel_reason',
        'hospital_id',
        'recipient_full_name',
        'recipient_age',
        'recipient_contact',
        'recipient_contact_type',
        'recipient_blood_type',
        'id_picture',
        'hospital_selection',
    ];

    protected $casts = [
        'medical_conditions' => 'array',
        'date_of_birth' => 'date',
        'suggested_appointments' => 'array',
        'suggestions_sent_at' => 'datetime',
        'selected_appointment_at' => 'datetime',
        'selected_at' => 'datetime',
        'appointment_completed_at' => 'datetime',
        'appointment_cancelled_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($livingDonor) {
            // Only generate if not already set
            if (!$livingDonor->code) {
                $livingDonor->code = 'LO-' . strtoupper(Str::random(8)); // LO-ABCDEFGH
            }
        });
    }

    // Relationships
    public function hospital()
    {
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }

    // Helper method to get full name
    public function getFullNameAttribute()
    {
        $nameParts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name
        ]);
        return implode(' ', $nameParts);
    }

    // Helper method to get age
    public function getAgeAttribute()
    {
        return $this->date_of_birth ? $this->date_of_birth->age : null;
    }
}
