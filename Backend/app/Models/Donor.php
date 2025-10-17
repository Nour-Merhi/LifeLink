<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
        'blood_type',
        'gender'
    ];

    public function user(){
        return $this->belongsTo(User::class, 'id');
    }
    public function homeAppointments(){
        return $this->hasMany(HomeAppointment::class, 'id');
    }
    public function hospitalAppointments(){
        return $this->hasMany(HospitalAppointment::class, 'id');
    }
    public function bloodType(){
        return $this->belongsTo(BloodType::class, 'id');
    }


}
