<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\Hospital;

class HospitalSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'hospital_id',
        'logo',
        'about',
        'phone_number',
        'address',
        'working_hours',
        'default_time_gap_minutes',
        'auto_approval_rules',
    ];

    protected $casts = [
        'working_hours' => 'array',
        'auto_approval_rules' => 'array',
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }
}
