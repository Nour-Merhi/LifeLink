<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;


use App\Models\HospitalAppointment;
use App\Models\HomeAppointment;
use App\Models\BloodType;
use App\Models\User;

class Donor extends Model
{
    use HasFactory;

    protected $fillable = [
        'last_donation',
        'date_of_birth',
        'blood_type_id',
        'user_id',
        'organ_consent',
        'availability',
        'gender',
        'medical_conditions',
        'status',
        'code'
    ];

    protected $casts = [
        'medical_conditions' => 'array',
    ];
    protected static function booted()
    {
        static::creating(function ($donor) {
            // Only generate if not already set
            if (!$donor->code) {
                $donor->code = 'D-' . strtoupper(Str::random(8)); // MN-ABCDEFGH
            }
        });
    }

    public function user(){
        return $this->belongsTo(User::class, 'user_id');
    }
    public function homeAppointments(){
        return $this->hasMany(HomeAppointment::class, 'donor_id');
    }
    public function hospitalAppointments(){
        return $this->hasMany(HospitalAppointment::class, 'donor_id');
    }
    public function bloodType(){
        return $this->belongsTo(BloodType::class, 'blood_type_id');
    }


}
