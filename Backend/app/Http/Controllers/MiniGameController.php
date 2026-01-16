<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\XpService;
use App\Models\XpTransaction;
use App\Models\MiniGameUnlock;
use App\Models\QuizLevel;

class MiniGameController extends Controller
{
    public function playGame(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $donor = $user->donor;
        if (!$donor) {
            return response()->json(['message' => 'Donor profile not found'], 404);
        }

        $gameType = strtolower($request->game_type ?? '');
        $outcome = strtolower($request->outcome ?? 'played');

        // --- Get unlock rules from DB ---
        $allowedLevels = MiniGameUnlock::where('game_type', $gameType)
            ->pluck('unlock_level')
            ->toArray();


        // --- Get completed quiz level NUMBERS ---
        $completedLevels = QuizLevel::whereIn(
                'id',
                XpTransaction::where('donor_id', $donor->id)
                    ->where('reference_type', QuizLevel::class)
                    ->pluck('reference_id')
            )->pluck('number')->toArray();
        

        // --- Check unlock eligibility ---
        $canPlay = count(array_intersect($allowedLevels, $completedLevels)) > 0;

        if (!$canPlay) {
            return response()->json([
                'message' => "Mini-game {$gameType} is locked. Complete more quiz levels to unlock.",
                'xpEarned' => 0
            ], 403);
        }

        // --- Prevent duplicate XP for specific outcome/game ---
        $existingXp = XpTransaction::where('donor_id', $donor->id)
            ->where('reference_type', 'mini_game')
            ->where('reference_id', $gameType)
            ->where('donation_type', "mini_game_{$outcome}")
            ->first();

        if ($existingXp) {
            return response()->json([
                'message' => "XP for {$gameType} ({$outcome}) already awarded.",
                'xpEarned' => 0
            ], 200);
        }

        // --- Award XP ---
        $xpTransaction = XpService::awardMiniGameXp(
            $donor->id,
            $gameType,
            $outcome
        );

        return response()->json([
            'message' => "Mini-game {$gameType} recorded",
            'xpEarned' => $xpTransaction->xp_amount ?? 0
        ]);
    }
}
