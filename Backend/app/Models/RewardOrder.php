<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class RewardOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_id',
        'code',
        'total_xp_spent',
        'status',
    ];

    protected $casts = [
        'total_xp_spent' => 'integer',
    ];

    protected static function booted()
    {
        static::creating(function ($order) {
            if (!$order->code) {
                $order->code = 'RO-' . strtoupper(Str::random(8));
            }
        });
    }

    public function donor()
    {
        return $this->belongsTo(Donor::class, 'donor_id');
    }

    public function items()
    {
        return $this->hasMany(RewardOrderItem::class, 'reward_order_id');
    }
}

