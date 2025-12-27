<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;


use App\Models\Hospital;
use App\Models\MobilePhlebotomist;
use App\Models\Donor;
use App\Models\Appointment;


class HomeAppointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_id',
        'hospital_id',
        'appointment_id',
        'appointment_time',
        'phlebotomist_id',
        'weight(kg)',
        'address',
        'latitude',
        'longitude',
        'medical_conditions',
        'emerg_contact',
        'emerg_phone',
        'note',
        'state',
        'code',
    ];

    protected static function booted()
    {
        static::creating(function ($homeAppointment) {
            // Only generate if not already set
            if (!$homeAppointment->code) {
                $homeAppointment->code = 'HAP-' . strtoupper(Str::random(8)); // HAP-ABCDEFGH
            }
        });
    }
    protected $casts = [
        'medical_conditions' => 'array',
    ];

    public function mobilePhlebotomist(){
        return $this->belongsTo(MobilePhlebotomist::class, 'phlebotomist_id');
    }
    public function hospital(){
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }
    public function donor(){
        return $this->belongsTo(Donor::class, 'donor_id');
    }
    public function appointment(){
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }
}
