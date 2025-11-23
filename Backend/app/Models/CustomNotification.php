<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

use App\Models\Hospital;
use App\Models\User;

class CustomNotification extends Model
{
    use HasFactory;

    protected $table = 'notifications';

    protected $fillable = [
        'code',
        'hospital_id',
        'user_id',
        'type',
        'title',
        'message',
        'is_read',
        'metadata',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'metadata' => 'array',
    ];

    protected static function booted()
    {
        static::creating(function ($notification) {
            if (!$notification->code) {
                $notification->code = 'NOT-' . strtoupper(Str::random(8));
            }
        });
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
