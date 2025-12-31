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
        'donor_id',
        'hospital_Id',
        'appointment_id',
        'state',
        'note',
        'code',
    ];

    protected static function booted()
    {
        static::creating(function ($hospitalAppointment) {
            // Only generate if not already set
            if (!$hospitalAppointment->code) {
                $hospitalAppointment->code = 'HOSP-' . strtoupper(Str::random(8)); // HOSP-ABCDEFGH
            }
        });
    }

    public function hospital(){
        return $this->belongsTo(Hospital::class, 'hospital_Id'); // Note: migration uses hospital_Id
    }
    public function donor(){
        return $this->belongsTo(Donor::class, 'donor_id');
    }
    public function appointments(){
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }
    

}
