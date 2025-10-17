<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\Hospital;
use App\Models\HomeAppointment;
use App\Models\HospitalAppointment;


class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_date',
        'appointment_time',
        'donation_type',
        'state'
    ];

    public function hospital(){
        return $this->belongsTo(Hospital::class, 'id');
    }
    public function homeAppointments(){
        return $this->hasMany(HomeAppointment::class, 'id');
    }
    public function hospitalAppointments(){
        return $this->hasMany(HospitalAppointment::class, 'id');
    }
}
