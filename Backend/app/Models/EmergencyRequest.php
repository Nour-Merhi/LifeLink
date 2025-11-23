<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

use App\Models\Hospital;

class EmergencyRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'patient_name',
        'hospital_id',
        'required_blood_type',
        'required_organ',
        'required_quantity',
        'deadline',
        'status',
        'note',
    ];

    protected static function booted()
    {
        static::creating(function ($request) {
            if (!$request->code) {
                $request->code = 'ER-' . strtoupper(Str::random(8));
            }
        });
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }
}
