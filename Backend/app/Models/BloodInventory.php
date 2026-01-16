<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

use App\Models\Hospital;
use App\Models\BloodType;

class BloodInventory extends Model
{
    use HasFactory;

    // Explicitly set table name since migration uses singular
    protected $table = 'blood_inventory';

    protected $fillable = [
        'code',
        'hospital_id',
        'blood_type_id',
        'quantity',
        'expiry_date',
        'status',
        'note',
    ];

    protected static function booted()
    {
        static::creating(function ($inventory) {
            if (!$inventory->code) {
                $inventory->code = 'BI-' . strtoupper(Str::random(8));
            }
        });
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }

    public function bloodType()
    {
        return $this->belongsTo(BloodType::class, 'blood_type_id');
    }
}
