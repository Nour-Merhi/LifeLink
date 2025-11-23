<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;


use App\Models\User;
use App\Models\Hospital;


class HealthCenterManager extends Model
{
    use HasFactory;

    protected $fillable = [
        'position',
        'office_location',
        'start_time',
        'end_time',
        'working_hours',
        'user_id',
        'hospital_id',
        'code', 
    ];

    protected static function booted()
    {
        static::creating(function ($manager) {
            // Only generate if not already set
            if (!$manager->code) {
                $manager->code = 'MN-' . strtoupper(Str::random(8)); // MN-ABCDEFGH
            }
        });
    }

    public function user(){
        return $this->belongsTo(User::class, 'user_id');
    }
    public function hospital(){
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }
    
}
