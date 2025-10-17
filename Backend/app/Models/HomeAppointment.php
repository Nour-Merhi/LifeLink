<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\Hospital;
use App\Models\MobilePhlebotomist;
use App\models\Donor;
use App\Models\Appointment;


class HomeAppointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_date',
        'appointment_time',
        'weight(kg)',
        'address',
        'medical_conditions',
        'emerg_contact',
        'emerg_phone',
        'note',
        'state'
    ];
    protected $casts = [
        'medical_conditions' => 'array',
    ];

    public function mobilePhlebotomist(){
        return $this->belongsTo(MobilePhlebotomist::class, 'id');
    }
    public function hospital(){
        return $this->belongsTo(Hospital::class, 'id');
    }
    public function donor(){
        return $this->belongsTo(Donor::class, 'id');
    }
     public function appointments(){
        return $this->belongsTo(Appointment::class, 'id');
    }
}
