<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RewardOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'reward_order_id',
        'reward_product_id',
        'product_title',
        'xp_each',
        'qty',
        'xp_total',
    ];

    protected $casts = [
        'xp_each' => 'integer',
        'qty' => 'integer',
        'xp_total' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(RewardOrder::class, 'reward_order_id');
    }

    public function product()
    {
        return $this->belongsTo(RewardProduct::class, 'reward_product_id');
    }
}

