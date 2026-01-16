<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\QuizQuestion;
use App\Models\QuizLevel;
use App\Models\MiniGameUnlock;
use App\Models\XpTransaction;
use App\Services\XpService;
use Illuminate\Support\Facades\Auth;

class QuizController extends Controller
{
    public function answerQuestion(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $donor = $user->donor;
        if (!$donor) return response()->json(['message' => 'Donor profile not found'], 404);

        $question = QuizQuestion::find($request->question_id);
        if (!$question) return response()->json(['message' => 'Question not found'], 404);

        $isCorrect = $question->correct_answer == $request->answer;

        $xpEarned = 0;
        if ($isCorrect) {
            $xpTransaction = XpService::awardQuizAnswerXp(
                $donor->id,
                $request->quiz_level,
                $question->id
            );
            $xpEarned = $xpTransaction->xp_amount ?? 0;
        }

        return response()->json([
            'isCorrect' => $isCorrect,
            'xpEarned' => $xpEarned,
        ]);
    }

    public function completeLevel(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $donor = $user->donor;
        if (!$donor) return response()->json(['message' => 'Donor profile not found'], 404);

        $levelNumber = $request->level_number;

        try {
            $xpTransaction = XpService::awardQuizLevelCompletionXp(
                $donor->id,
                $levelNumber
            );

            return response()->json([
                'message' => "Level {$levelNumber} completed",
                'xpEarned' => $xpTransaction->xp_amount ?? 0
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'xpEarned' => 0
            ], 400);
        }
    }

    public function getQuestions($level)
    {
        $questions = QuizQuestion::where('level', $level)->get();
        
        // Transform questions to match frontend format
        $formattedQuestions = $questions->map(function ($question) {
            $options = is_array($question->options) ? $question->options : json_decode($question->options, true);
            
            // Format options with letters (A, B, C, D)
            $formattedOptions = [];
            $letters = ['A', 'B', 'C', 'D'];
            foreach ($options as $index => $option) {
                $formattedOptions[] = [
                    'option' => $option,
                    'isCorrect' => $option === $question->correct_answer,
                    'letter' => $letters[$index] ?? chr(65 + $index) // A, B, C, D...
                ];
            }
            
            return [
                'id' => $question->id,
                'question' => $question->question,
                'options' => $formattedOptions,
                'answer' => $question->correct_answer,
            ];
        });

        return response()->json($formattedQuestions);
    }

    public function getLeaderboard(Request $request)
    {
        $limit = $request->get('limit', 10); // Default to top 10
        
        // Get donors with their total XP using a subquery for better performance
        $donors = \App\Models\Donor::with(['user', 'bloodType'])
            ->get()
            ->map(function ($donor) {
                return [
                    'donor' => $donor,
                    'totalXp' => XpService::getTotalXp($donor->id),
                ];
            })
            ->filter(function ($item) {
                return $item['totalXp'] > 0; // Only include donors with XP
            })
            ->sortByDesc('totalXp')
            ->take($limit)
            ->values();

        // Format leaderboard data
        $leaderboard = $donors->map(function ($item, $index) {
            $donor = $item['donor'];
            $user = $donor->user;
            $bloodType = $donor->bloodType;
            
            // Format blood type (e.g., "O+", "A-")
            $bloodTypeString = '';
            if ($bloodType) {
                $bloodTypeString = ($bloodType->type ?? '') . ($bloodType->rh_factor ?? '');
            }

            // Get full name
            $firstName = $user->first_name ?? '';
            $lastName = $user->last_name ?? '';
            $fullName = trim($firstName . ' ' . $lastName);
            if (empty($fullName)) {
                $fullName = $user->email ?? 'Anonymous';
            }

            return [
                'rank' => $index + 1,
                'name' => $fullName,
                'bloodType' => $bloodTypeString,
                'score' => $item['totalXp'],
            ];
        });

        return response()->json($leaderboard);
    }

    public function getProgress(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $donor = $user->donor;
        if (!$donor) return response()->json(['message' => 'Donor profile not found'], 404);

        $totalXp = XpService::getTotalXp($donor->id);
        $currentLevel = XpService::calculateLevel($totalXp);

        // completed level NUMBERS
        $completedLevels = XpTransaction::where('donor_id', $donor->id)
            ->where('reference_type', QuizLevel::class)
            ->pluck('reference_id')
            ->map(fn($id) => QuizLevel::find($id)?->number)
            ->filter()
            ->toArray();

        // unlock rules from DB
        $unlockRules = MiniGameUnlock::all()
            ->groupBy('game_type')
            ->map(fn($group) => $group->pluck('unlock_level')->toArray())
            ->toArray();

        // unlocked status
        $miniGameStatus = [];
        foreach ($unlockRules as $game => $levels) {
            $miniGameStatus[$game] =
                count(array_intersect($levels, $completedLevels)) > 0;
        }

        return response()->json([
            'totalXp' => $totalXp,
            'currentLevel' => $currentLevel,
            'completedLevels' => $completedLevels,
            'miniGameStatus' => $miniGameStatus
        ]);
    }

    public function getQuizHistory(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $donor = $user->donor;
        if (!$donor) return response()->json(['message' => 'Donor profile not found'], 404);

        $totalXp = XpService::getTotalXp($donor->id);
        $currentLevel = XpService::calculateLevel($totalXp);

        // Get completed levels
        $completedLevels = XpTransaction::where('donor_id', $donor->id)
            ->where('reference_type', QuizLevel::class)
            ->with('reference')
            ->get()
            ->map(function ($transaction) {
                $level = $transaction->reference;
                return $level ? $level->number : null;
            })
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        // Get quiz history - group by level and date
        // Get all quiz-related XP transactions
        $quizTransactions = XpTransaction::where('donor_id', $donor->id)
            ->where(function ($query) {
                $query->where('donation_type', 'quiz_correct_answer')
                      ->orWhere('donation_type', 'quiz-level');
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Group transactions by level and date to create session logs
        $sessionLogs = [];
        $levelGroups = [];

        foreach ($quizTransactions as $transaction) {
            $date = $transaction->created_at->format('Y-m-d');
            $level = null;
            $xpEarned = 0;
            $isLevelCompletion = false;

            if ($transaction->donation_type === 'quiz-level') {
                // Level completion
                $level = QuizLevel::find($transaction->reference_id);
                $level = $level ? $level->number : null;
                $xpEarned = $transaction->xp_amount;
                $isLevelCompletion = true;
            } else if ($transaction->donation_type === 'quiz_correct_answer') {
                // Answer XP - need to get level from question
                $question = QuizQuestion::find($transaction->reference_id);
                if ($question) {
                    $level = $question->level;
                    $xpEarned = $transaction->xp_amount;
                }
            }

            if ($level) {
                $key = $date . '_' . $level;
                if (!isset($levelGroups[$key])) {
                    $levelGroups[$key] = [
                        'date' => $date,
                        'level' => $level,
                        'correct_answers' => 0,
                        'wrong_answers' => 0,
                        'answer_xp' => 0,
                        'level_completion_xp' => 0,
                        'total_xp' => 0,
                        'has_level_completion' => false,
                        'created_at' => $transaction->created_at
                    ];
                }

                if ($isLevelCompletion) {
                    $levelGroups[$key]['level_completion_xp'] += $xpEarned;
                    $levelGroups[$key]['has_level_completion'] = true;
                } else {
                    $levelGroups[$key]['correct_answers']++;
                    $levelGroups[$key]['answer_xp'] += $xpEarned;
                }
                $levelGroups[$key]['total_xp'] += $xpEarned;
            }
        }

        // Calculate wrong answers for each session
        // Each quiz level has 10 questions
        // If level was completed, wrong_answers = 10 - correct_answers
        // Otherwise, we can't be sure, so set to 0
        foreach ($levelGroups as $key => $log) {
            if ($log['has_level_completion']) {
                $levelGroups[$key]['wrong_answers'] = max(0, 10 - $log['correct_answers']);
            }
        }

        // Convert to array and sort by date (most recent first)
        $sessionLogs = array_values($levelGroups);
        usort($sessionLogs, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        // Calculate progress for current level
        $currentLevelMinXp = $currentLevel > 1 
            ? (50 * pow($currentLevel - 1, 2) + 50 * ($currentLevel - 1))
            : 0;
        $nextLevelMinXp = 50 * pow($currentLevel, 2) + 50 * $currentLevel;
        $currentLevelProgress = $totalXp - $currentLevelMinXp;
        $currentLevelMaxXp = $nextLevelMinXp - $currentLevelMinXp;
        $progressPercentage = $currentLevelMaxXp > 0 
            ? max(0, min(100, round(($currentLevelProgress / $currentLevelMaxXp) * 100, 2))) 
            : 0;

        // Get minigame information
        // Minigame transactions are stored with reference_type = 'App\Models\MiniGame' and reference_id = gameType
        $minigameTransactions = XpTransaction::where('donor_id', $donor->id)
            ->where('reference_type', 'App\Models\MiniGame')
            ->orderBy('created_at', 'desc')
            ->get();

        // Get minigame unlock rules
        $unlockRules = MiniGameUnlock::all()
            ->groupBy('game_type')
            ->map(fn($group) => $group->pluck('unlock_level')->toArray())
            ->toArray();

        // Define all possible minigame types (even if no unlock rules exist)
        $knownGameTypes = ['tictactoe', 'hangman', 'memory'];
        
        // Check which minigames are unlocked
        $unlockedMinigames = [];
        foreach ($knownGameTypes as $gameType) {
            if (isset($unlockRules[$gameType])) {
                $unlockedMinigames[$gameType] = count(array_intersect($unlockRules[$gameType], $completedLevels)) > 0;
            } else {
                // If no unlock rules, consider it unlocked
                $unlockedMinigames[$gameType] = true;
            }
        }

        // Group minigame transactions by game type and date
        $minigameLogs = [];
        $minigameGroups = [];

        foreach ($minigameTransactions as $transaction) {
            // Game type is stored in reference_id
            $gameType = $transaction->reference_id;
            // Outcome can be determined from donation_type (contains 'win' or not)
            $outcome = str_contains($transaction->donation_type, 'win') ? 'win' : 'played';
            $date = $transaction->created_at->format('Y-m-d');
            $key = $date . '_' . $gameType;

            if (!isset($minigameGroups[$key])) {
                $minigameGroups[$key] = [
                    'date' => $date,
                    'game_type' => $gameType,
                    'plays' => 0,
                    'wins' => 0,
                    'xp_earned' => 0,
                    'created_at' => $transaction->created_at
                ];
            }

            $minigameGroups[$key]['plays']++;
            if ($outcome === 'win') {
                $minigameGroups[$key]['wins']++;
            }
            $minigameGroups[$key]['xp_earned'] += $transaction->xp_amount;
        }

        // Convert to array and sort by date (most recent first)
        $minigameLogs = array_values($minigameGroups);
        usort($minigameLogs, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        // Calculate minigame statistics
        // Always include all known minigame types
        $knownGameTypes = ['tictactoe', 'hangman', 'memory'];
        $allGameTypes = array_unique(array_merge($knownGameTypes, array_keys($unlockRules), array_column($minigameGroups, 'game_type')));
        
        $minigameStats = [];
        foreach ($allGameTypes as $gameType) {
            $gameTransactions = $minigameTransactions->filter(function ($transaction) use ($gameType) {
                return $transaction->reference_id === $gameType;
            });

            $totalPlays = $gameTransactions->count();
            $wins = $gameTransactions->filter(function ($transaction) {
                return str_contains($transaction->donation_type, 'win');
            })->count();
            $totalXp = $gameTransactions->sum('xp_amount');

            $minigameStats[$gameType] = [
                'unlocked' => $unlockedMinigames[$gameType] ?? false,
                'total_plays' => $totalPlays,
                'wins' => $wins,
                'losses' => $totalPlays - $wins,
                'total_xp' => $totalXp,
                'win_rate' => $totalPlays > 0 ? round(($wins / $totalPlays) * 100, 1) : 0
            ];
        }

        return response()->json([
            'current_level' => $currentLevel,
            'completed_levels' => $completedLevels,
            'progress_percentage' => $progressPercentage,
            'total_xp' => $totalXp,
            'xp_until_next_level' => max(0, $nextLevelMinXp - $totalXp),
            'session_logs' => $sessionLogs,
            'minigame_stats' => $minigameStats,
            'minigame_logs' => $minigameLogs
        ]);
    }
}
