<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class XpTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_id',
        'xp_amount',
        'donation_type',
        'reference_type',
        'reference_id',
        'code',
        'description',
    ];

    protected static function booted()
    {
        static::creating(function ($xpTransaction) {
            if (!$xpTransaction->code) {
                $xpTransaction->code = 'XP-' . strtoupper(Str::random(8));
            }
        });
    }

    // Relationships
    public function donor()
    {
        return $this->belongsTo(Donor::class, 'donor_id');
    }

    // Polymorphic relationship to the related record
    public function reference()
    {
        return $this->morphTo('reference', 'reference_type', 'reference_id');
    }
}
