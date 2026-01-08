<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SupportTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subject',
        'category',
        'message',
        'status',
        'code',
    ];

    protected static function booted()
    {
        static::creating(function ($ticket) {
            // Only generate if not already set
            if (!$ticket->code) {
                $ticket->code = 'ST-' . strtoupper(Str::random(8)); // ST-ABCDEFGH
            }
        });
    }

    /**
     * Get the user that created the support ticket
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
