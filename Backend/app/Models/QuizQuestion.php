<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'level',
        'question',
        'options',
        'correct_answer',
        'points',
    ];

    protected $casts = [
        'options' => 'array', // automatically cast JSON to array
    ];
}
