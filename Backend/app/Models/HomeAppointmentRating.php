<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HomeAppointmentRating extends Model
{
    use HasFactory;

    protected $fillable = [
        'home_appointment_id',
        'donor_id',
        'rating',
        'comment',
    ];

    public function homeAppointment()
    {
        return $this->belongsTo(HomeAppointment::class, 'home_appointment_id');
    }

    public function donor()
    {
        return $this->belongsTo(Donor::class, 'donor_id');
    }
}

