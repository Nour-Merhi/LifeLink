<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RewardProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title',
        'description',
        'cost_xp',
        'image_path',
        'is_active',
    ];

    protected $casts = [
        'cost_xp' => 'integer',
        'is_active' => 'boolean',
    ];
}

