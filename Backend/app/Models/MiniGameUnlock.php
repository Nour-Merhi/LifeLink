<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\QuizLevel;
use App\Models\XpTransaction;

class MiniGameUnlock extends Model
{
    use HasFactory;

    protected $table = 'mini_game_unlocks'; // optional, Laravel uses this by default

    // Allow mass assignment
    protected $fillable = [
        'game_type',
        'unlock_level'
    ];

    // Casts
    protected $casts = [
        'unlock_level' => 'integer'
    ];

    /**
     * Optional: relation to donor XP transactions if needed later
     */
    public function xpTransactions()
    {
        return $this->hasMany(\App\Models\XpTransaction::class, 'reference_id')
                    ->where('reference_type', self::class);
    }

    public function quizLevel()
    {
        return $this->belongsTo(QuizLevel::class, 'quiz_level_id');
    }

}
