<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;


use App\Models\Hospital;
use App\Models\HomeAppointment;
use App\Models\HospitalAppointment;


class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_date',
        'appointment_time',
        'time_slots',
        'donation_type',
        'appointment_type',
        'due_date',
        'due_time',
        'blood_type',
        'state',
        'hospital_id',
        'max_capacity',
        'code',
    ];

    protected static function booted()
    {
        static::creating(function ($appointment) {
            // Only generate if not already set
            if (!$appointment->code) {
                $appointment->code = 'APT-' . strtoupper(Str::random(8)); // APT-ABCDEFGH
            }
        });
    }

    protected $casts = [
        'time_slots' => 'array',
    ];

    public function hospital(){
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }
    public function homeAppointments(){
        return $this->hasMany(HomeAppointment::class, 'appointment_id');
    }
    public function hospitalAppointments(){
        return $this->hasMany(HospitalAppointment::class, 'appointment_id');
    }
}
