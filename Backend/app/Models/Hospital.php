<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;


use App\Models\MobilePhlebotomist;
use App\Models\HomeAppointment;
use App\Models\HospitalAppointment;
use App\Models\HealthCenterManager;
use App\Models\Appointment;
use App\Models\EmergencyRequest;
use App\Models\BloodInventory;
use App\Models\HospitalSetting;
use App\Models\CustomNotification;
use App\Models\StaffRole;


class Hospital extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone_nb',
        'email',
        'address',
        'latitude',
        'longitude',
        'code',
        'status',
    ];
    protected static function booted()
    {
        static::creating(function ($hospital) {
            // Only generate if not already set
            if (!$hospital->code) {
                $hospital->code = 'HSP-' . strtoupper(Str::random(8)); // MN-ABCDEFGH
            }
        });
    }

    public function mobilePhlebotomist(){
        return $this->hasMany(MobilePhlebotomist::class, 'hospital_id');
    } 
    public function healthCenterManager(){
        return $this->hasOne(HealthCenterManager::class, 'hospital_id');
    }
    public function homeAppointments(){
        return $this->hasMany(HomeAppointment::class, 'hospital_id');
    }
    public function hospitalAppointments(){
        return $this->hasMany(HospitalAppointment::class, 'hospital_id');
    }
    public function appointments(){
        return $this->hasMany(Appointment::class, 'hospital_id');
    }

    public function emergencyRequests(){
        return $this->hasMany(EmergencyRequest::class, 'hospital_id');
    }

    public function bloodInventory(){
        return $this->hasMany(BloodInventory::class, 'hospital_id');
    }

    public function settings(){
        return $this->hasOne(HospitalSetting::class, 'hospital_id');
    }

    public function notifications(){
        return $this->hasMany(CustomNotification::class, 'hospital_id');
    }

    public function staffRoles(){
        return $this->hasMany(StaffRole::class, 'hospital_id');
    }

}
