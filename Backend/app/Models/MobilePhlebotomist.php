<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\User;
use App\Models\Hospital;
use App\Models\HomeAppointment;
use App\Models\HealthCenterManager;
use Illuminate\Support\Str;



class MobilePhlebotomist extends Model
{
    use HasFactory;

    protected $fillable = [
        'license_number',
        'availability',
        'max_appointments',
        'start_time',
        'end_time',
        'working_dates',
        'user_id',
        'hospital_id',
        'manager_id',
        'code',
    ];

    protected $casts = [
        'working_dates' => 'array',
    ];
    protected static function booted()
    {
        static::creating(function ($phleb) {
            // Only generate if not already set
            if (!$phleb->code) {
                $phleb->code = 'MP-' . strtoupper(Str::random(8)); // MN-ABCDEFGH
            }
        });
    }

    public function user(){
        return $this->belongsTo(User::class, 'user_id');
    }
    public function hospital(){
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }
    public function homeAppointment(){
        return $this->hasMany(HomeAppointment::class, 'phlebotomist_id');
    }
    public function healthCenterManager(){
        return $this->belongsTo(HealthCenterManager::class, 'manager_id');
    }
}
