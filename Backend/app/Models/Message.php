<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

use App\Models\User;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'subject',
        'body',
        'read_at',
        'code',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($message) {
            // Only generate if not already set
            if (!$message->code) {
                $message->code = 'MSG-' . strtoupper(Str::random(8)); // MSG-ABCDEFGH
            }
        });
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
