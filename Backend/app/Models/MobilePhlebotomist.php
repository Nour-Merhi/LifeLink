<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\User;
use App\Models\Hospital;
use App\Models\HomeAppointment;
use App\Models\HealthCenterManager;


class MobilePhlebotomist extends Model
{
    use HasFactory;

    protected $fillable = [
        'license_number',
        'availability'
    ];

    public function user(){
        return $this->belongsTo(User::class, 'id');
    }
    public function hospital(){
        return $this->belongsTo(Hospital::class, 'id');
    }
    public function homeAppointment(){
        return $this->hasMany(HomeAppointment::class, 'id');
    }
    public function healthCenterManager(){
        return $this->belongsTo(HealthCenterManager::class, 'id');
    }
}
