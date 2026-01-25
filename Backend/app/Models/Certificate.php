<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_id',
        'hospital_id',
        'donor_name',
        'description_option',
        'certificate_date',
        'image_path',
    ];

    protected $casts = [
        'certificate_date' => 'date',
    ];

    public function donor()
    {
        return $this->belongsTo(Donor::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
}
