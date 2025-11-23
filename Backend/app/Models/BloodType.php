<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;


use App\Models\Donor;


class BloodType extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'rh_factor',
        'code'
    ];

    protected static function booted()
    {
        static::creating(function ($blood) {
            // Only generate if not already set
            if (!$blood->code) {
                $blood->code = 'B-' . strtoupper(Str::random(8)); // MN-ABCDEFGH
            }
        });
    }

    public function donor(){
        return $this->hasMany(Donor::class, 'id');
    }
}
