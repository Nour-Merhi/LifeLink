<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\XpTransaction;
use App\Models\MiniGameUnlock;

class QuizLevel extends Model
{
    use HasFactory;

    protected $table = 'quiz_levels'; // optional if you follow Laravel naming

    // Allow mass assignment
    protected $fillable = [
        'name',
        'number',
        'xp_amount'
    ];

    // If you want to format or cast attributes
    protected $casts = [
        'xp_amount' => 'integer',
        'number' => 'integer'
    ];

    public function xpTransactions()
    {
        return $this->hasMany(XpTransaction::class, 'reference_id')
                    ->where('reference_type', self::class);
    }

    public function miniGameUnlocks()
    {
        return $this->hasMany(MiniGameUnlock::class, 'quiz_level_id');
    }


}
