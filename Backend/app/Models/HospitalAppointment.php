<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;


use App\Models\Hospital;
use App\Models\Donor;
use App\Models\Appointment;


class HospitalAppointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_date',
        'appointment_time',
        'state',
        'note',
    ];

    public function hospital(){
        return $this->belongsTo(Hospital::class , 'id');
    }
    public function donor(){
        return $this->belongsTo(Donor::class, 'id');
    }
    public function appointments(){
        return $this->belongsTo(Appointment::class, 'id');
    }
    

}
