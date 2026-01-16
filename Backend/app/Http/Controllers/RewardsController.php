<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Services\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RewardsController extends Controller
{
    /**
     * Get rewards data for donor
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            if (strtolower($user->role ?? '') !== 'donor') {
                return response()->json([
                    'message' => 'Unauthorized. Only donors can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            $donor = Donor::where('user_id', $user->id)->first();
            
            if (!$donor) {
                return response()->json([
                    'message' => 'Donor record not found. Please complete your profile registration.',
                    'error' => 'donor_not_found'
                ], 404);
            }

            // Get total XP and calculate level
            $totalXp = XpService::getTotalXp($donor->id);
            $currentLevel = XpService::calculateLevel($totalXp);
            
            // Calculate XP progress using the same formula as calculateLevel
            // Formula: XP required to REACH level N = 50 * N^2 + 50 * N
            // The XP needed to REACH the current level (minimum XP for current level)
            $currentLevelMinXp = $currentLevel > 1 
                ? (50 * pow($currentLevel - 1, 2) + 50 * ($currentLevel - 1))
                : 0;
            
            // The XP needed to REACH the next level (maximum XP for current level)
            $nextLevelMinXp = 50 * pow($currentLevel, 2) + 50 * $currentLevel;
            
            // XP needed to reach next level from current total
            $xpUntilNextLevel = max(0, $nextLevelMinXp - $totalXp);

            // XP earning rules (matching the actual XP amounts from XpService)
            $xpRules = [
                [
                    'name' => 'Blood Donation',
                    'xp_amount' => 500,
                    'description' => 'Complete a blood donation (home or hospital)'
                ],
                [
                    'name' => 'Organ Registration',
                    'xp_amount' => 900,
                    'description' => 'Register for live organ donation'
                ],
                [
                    'name' => 'After Death Organ Donation',
                    'xp_amount' => 1500,
                    'description' => 'Register for after-death organ donation'
                ],
                [
                    'name' => 'Financial Donation',
                    'xp_amount' => 'Variable',
                    'description' => 'XP equals donation amount (e.g., $50 = 50 XP, $100 = 100 XP)'
                ]
            ];

            // Generate certificates/achievements based on milestones
            $certificates = $this->generateCertificates($donor->id, $totalXp, $currentLevel);

            return response()->json([
                'level_progress' => [
                    'current_level' => $currentLevel,
                    'current_xp' => $totalXp,
                    'xp_until_next_level' => $xpUntilNextLevel,
                    'next_level' => $currentLevel + 1
                ],
                'xp_rules' => $xpRules,
                'certificates' => $certificates
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching rewards data:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch rewards data',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Generate certificates/achievements based on milestones
     */
    private function generateCertificates($donorId, $totalXp, $currentLevel)
    {
        $certificates = [];
        
        // Level-based certificates (1-20)
        for ($level = 1; $level <= 20; $level++) {
            $certificates[] = [
                'id' => $level,
                'type' => 'level',
                'name' => 'Level ' . $level . ' Achievement',
                'description' => 'Reach Level ' . $level,
                'unlocked' => $currentLevel >= $level,
                'requirement' => 'Level ' . $level,
                'unlock_date' => $currentLevel >= $level ? now()->toDateString() : null
            ];
        }

        // XP milestone certificates
        $xpMilestones = [
            ['id' => 21, 'xp' => 1000, 'name' => 'First 1000 XP'],
            ['id' => 22, 'xp' => 5000, 'name' => '5000 XP Master'],
            ['id' => 23, 'xp' => 10000, 'name' => '10000 XP Legend'],
            ['id' => 24, 'xp' => 25000, 'name' => '25000 XP Hero'],
            ['id' => 25, 'xp' => 50000, 'name' => '50000 XP Champion'],
        ];

        foreach ($xpMilestones as $milestone) {
            $certificates[] = [
                'id' => $milestone['id'],
                'type' => 'xp_milestone',
                'name' => $milestone['name'],
                'description' => 'Earn ' . number_format($milestone['xp']) . ' total XP',
                'unlocked' => $totalXp >= $milestone['xp'],
                'requirement' => number_format($milestone['xp']) . ' XP',
                'unlock_date' => $totalXp >= $milestone['xp'] ? now()->toDateString() : null
            ];
        }

        return $certificates;
    }
}
