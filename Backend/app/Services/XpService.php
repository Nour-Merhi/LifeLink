<?php

namespace App\Services;

use App\Models\XpTransaction;
use App\Models\Donor;
use App\Models\QuizLevel;
use App\Models\MiniGameUnlock;

use Illuminate\Support\Facades\DB;

class XpService
{
    /**
     * Award XP to a donor for a donation
     *
     * @param int $donorId
     * @param int $xpAmount
     * @param string $donationType ('blood', 'live_organ', 'after_death', 'financial')
     * @param string|null $referenceType Model class name (e.g., 'App\Models\HomeAppointment')
     * @param int|null $referenceId ID of the related record
     * @param string|null $description Optional description
     * @return XpTransaction
     */
    public static function awardXp($donorId, $xpAmount, $donationType, $referenceType = null, $referenceId = null, $description = null)
    {
        // Check if XP already awarded for this reference (prevent duplicates)
        if ($referenceType && $referenceId) {
            $existing = XpTransaction::where('donor_id', $donorId)
                ->where('reference_type', $referenceType)
                ->where('reference_id', $referenceId)
                ->first();

            if ($existing) {
                return $existing; // Already awarded
            }
        }

        // Create XP transaction
        $xpTransaction = XpTransaction::create([
            'donor_id' => $donorId,
            'xp_amount' => $xpAmount,
            'donation_type' => $donationType,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'description' => $description,
        ]);

        return $xpTransaction;
    }

    /**
     * Award XP for blood donation (500 XP)
     */
    public static function awardBloodDonationXp($donorId, $referenceType, $referenceId)
    {
        return self::awardXp(
            $donorId,
            500,
            'blood',
            $referenceType,
            $referenceId,
            'Blood donation completed'
        );
    }

    /**
     * Award XP for live organ donation (900 XP)
     */
    public static function awardLiveOrganDonationXp($donorId, $referenceType, $referenceId)
    {
        return self::awardXp(
            $donorId,
            900,
            'live_organ',
            $referenceType,
            $referenceId,
            'Live organ donation pledge completed'
        );
    }

    /**
     * Award XP for after-death organ donation (1500 XP)
     */
    public static function awardAfterDeathDonationXp($donorId, $referenceType, $referenceId)
    {
        return self::awardXp(
            $donorId,
            1500,
            'after_death',
            $referenceType,
            $referenceId,
            'After-death organ donation pledge completed'
        );
    }

    /**
     * Award XP for financial donation (amount equals XP)
     */
    public static function awardFinancialDonationXp($donorId, $amount, $referenceType = null, $referenceId = null)
    {
        return self::awardXp(
            $donorId,
            (int) $amount, // Convert to integer
            'financial',
            $referenceType,
            $referenceId,
            "Financial donation of {$amount}"
        );
    }

    /**
     * Award XP for a correct quiz answer
     *
     * @param int $donorId
     * @param int $quizLevel Level of the quiz (1-10)
     * @param int $questionId ID of the question (used for reference)
     * @return XpTransaction
     */
    public static function awardQuizAnswerXp($donorId, $quizLevel, $questionId){
        // Define XP bonus per answer depending on the quiz level
        // level 1 each answer is worth 10 XP, etc..
        $xpMap = [
            1 => 10, 2 => 10, 
            3 => 15, 4 => 15, 5 => 15,
            6 => 20, 7 => 20, 
            8 => 25, 9 => 25, 10 => 25,
        ];

        $xpAmount = $xpMap[$quizLevel] ?? 10;

        return self::awardXp(
            $donorId,
            $xpAmount,
            'quiz_correct_answer',
            'App\Models\QuizQuestion',
            $questionId,
            "Correct answer for quiz level {$quizLevel}, question {$questionId}"
        );
    }

    
    /**
     * Award XP for completing a quiz level
     *
     * @param int $donorId
     * @param int $quizLevel
     * @return XpTransaction
     */
    public static function awardQuizLevelCompletionXp($donorId, $levelNumber)
    {
         // Look up XP for the level in DB
        $level = QuizLevel::where('number', $levelNumber)->first();
        if (!$level) {
            throw new \Exception("Quiz level $levelNumber not found.");
        }

        return self::awardXp(
            $donorId,
            $level->xp_amount,
            'quiz-level',
            QuizLevel::class,
            $level->id, // Use level ID instead of level number for reference_id
            "Completed quiz level {$levelNumber}"
        );
    }
    
    /**
     * Award XP for mini-games (breaks)
     *
     * @param int $donorId
     * @param string $gameType 'tictactoe', 'hangman', 'memory'
     * @param string $outcome 'win' or 'played'
     * @return XpTransaction
     */
    public static function awardMiniGameXp($donorId, $gameType, $outcome)
    {
        // Define XP amounts based on outcome
        $xpMap = [
            'played' => 10,
            'win' => 50
        ];

        $xpAmount = $xpMap[$outcome] ?? 0;

        // Prevent duplicate XP for same mini-game and outcome
        $existing = XpTransaction::where('donor_id', $donorId)
            ->where('reference_type', 'App\Models\MiniGame')
            ->where('reference_id', $gameType)
            ->where('donation_type', "mini_game_{$outcome}")
            ->first();

        if ($existing) return $existing;

        return self::awardXp(
            $donorId,
            $xpAmount,
            "mini_game",
            'App\Models\MiniGame',
            $gameType,
            "Mini-game {$gameType} ({$outcome})"
        );
    }

    /**
     * Get total XP for a donor
     */
    public static function getTotalXp($donorId)
    {
        return XpTransaction::where('donor_id', $donorId)->sum('xp_amount');
    }

    /**
     * Calculate level from total XP (Level 1 = 100, Level 2 = 300, 3 = 600, etc.)
     */
    public static function calculateLevel($totalXp)
    {
        $level = 1;

        while (true) {

            // XP required to REACH the next level
            $requiredXp = 50 * pow($level, 2) + 50 * $level;

            if ($totalXp < $requiredXp) {
                return $level; // current level
            }

            $level++;
        }
    }

}

