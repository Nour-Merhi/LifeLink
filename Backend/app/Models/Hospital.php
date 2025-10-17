<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\MobilePhlebotomist;
use App\Models\HomeAppointment;
use App\Models\HospitalAppointment;
use App\Models\HealthCenterManager;


class Hospital extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone_nb',
        'email',
        'address'
    ];

    public function mobilePhlebotomist(){
        return $this->hasMany(MobilePhlebotomist::class, 'id');
    } 
    public function healthCenterManager(){
        return $this->hasOne(HealthCenterManager::class, 'id');
    }
    public function homeAppointments(){
        return $this->hasMany(HomeAppointment::class, 'id');
    }
    public function hospitalAppointments(){
        return $this->hasMany(HospitalAppointment::class, 'id');
    }


}
