<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Models\RewardProduct;
use App\Models\RewardOrder;
use App\Models\RewardOrderItem;
use App\Models\XpTransaction;
use App\Services\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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
                'certificates' => $certificates,
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
     * Public rewards shop catalog (no auth).
     * Returns products only; used for guests on ProductRewards page.
     */
    public function shopPublic(Request $request)
    {
        try {
            $products = RewardProduct::query()
                ->where('is_active', true)
                ->orderBy('id', 'asc')
                ->get()
                ->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'code' => $p->code,
                        'title' => $p->title,
                        'description' => $p->description,
                        'cost_xp' => (int) $p->cost_xp,
                        'image_path' => $p->image_path,
                    ];
                })
                ->values()
                ->all();

            return response()->json(['products' => $products], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching public rewards shop:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to load products', 'products' => []], 500);
        }
    }

    /**
     * Rewards shop data (XP store).
     * Returns current XP + product catalog used by ProductRewards page.
     */
    public function shop(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated. Please log in to access this endpoint.'], 401);
            }

            $donor = Donor::where('user_id', $user->id)->first();
            if (!$donor) {
                return response()->json(['message' => 'Donor record not found', 'error' => 'donor_not_found'], 404);
            }

            $totalXp = (int) XpService::getTotalXp($donor->id);
            $products = RewardProduct::query()
                ->where('is_active', true)
                ->orderBy('id', 'asc')
                ->get()
                ->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'code' => $p->code,
                        'title' => $p->title,
                        'description' => $p->description,
                        'cost_xp' => (int) $p->cost_xp,
                        'image_path' => $p->image_path,
                    ];
                })
                ->values()
                ->all();

            return response()->json([
                'current_xp' => $totalXp,
                'products' => $products,
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching rewards shop data:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to fetch rewards shop data'], 500);
        }
    }

    /**
     * Purchase one or more products using donor XP.
     *
     * Body:
     * - { product_id: number, qty?: number }
     * - or { items: [{ product_id: number, qty?: number }, ...] }
     */
    public function purchase(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated. Please log in to access this endpoint.'], 401);
        }

        $donor = Donor::where('user_id', $user->id)->first();
        if (!$donor) {
            return response()->json(['message' => 'Donor record not found', 'error' => 'donor_not_found'], 404);
        }

        $payload = $request->all();
        $items = [];
        if (isset($payload['items']) && is_array($payload['items'])) {
            $items = $payload['items'];
        } elseif (isset($payload['product_id'])) {
            $items = [[
                'product_id' => $payload['product_id'],
                'qty' => $payload['qty'] ?? 1,
            ]];
        }

        if (!is_array($items) || count($items) === 0) {
            return response()->json(['message' => 'No items provided'], 422);
        }

        $catalog = RewardProduct::query()
            ->where('is_active', true)
            ->get()
            ->keyBy('id');
        $normalized = [];
        $totalCost = 0;

        foreach ($items as $it) {
            $productId = (int) data_get($it, 'product_id', 0);
            $qty = (int) data_get($it, 'qty', 1);
            if ($productId <= 0 || $qty <= 0) {
                return response()->json(['message' => 'Invalid product_id or qty'], 422);
            }
            if (!$catalog->has($productId)) {
                return response()->json(['message' => "Unknown product_id: {$productId}"], 422);
            }

            $product = $catalog->get($productId);
            $costXp = (int) ($product->cost_xp ?? 0);
            $lineCost = $costXp * $qty;
            $totalCost += $lineCost;

            $normalized[] = [
                'product_id' => $productId,
                'title' => $product->title ?? 'Reward',
                'qty' => $qty,
                'cost_xp_each' => $costXp,
                'cost_xp_total' => $lineCost,
            ];
        }

        if ($totalCost <= 0) {
            return response()->json(['message' => 'Total cost must be greater than zero'], 422);
        }

        try {
            $result = DB::transaction(function () use ($donor, $normalized, $totalCost) {
                // Lock the donor's XP transactions to prevent concurrent overspending.
                $row = XpTransaction::where('donor_id', $donor->id)
                    ->selectRaw('COALESCE(SUM(xp_amount), 0) as total')
                    ->lockForUpdate()
                    ->first();

                $currentXp = (int) ($row->total ?? 0);
                if ($currentXp < $totalCost) {
                    return [
                        'ok' => false,
                        'current_xp' => $currentXp,
                    ];
                }

                $order = RewardOrder::create([
                    'donor_id' => $donor->id,
                    'total_xp_spent' => (int) $totalCost,
                    'status' => 'pending_pickup',
                ]);

                foreach ($normalized as $line) {
                    RewardOrderItem::create([
                        'reward_order_id' => $order->id,
                        'reward_product_id' => (int) $line['product_id'],
                        'product_title' => (string) ($line['title'] ?? 'Reward'),
                        'xp_each' => (int) $line['cost_xp_each'],
                        'qty' => (int) $line['qty'],
                        'xp_total' => (int) $line['cost_xp_total'],
                    ]);
                }

                // Deduct XP in one transaction linked to the order.
                XpTransaction::create([
                    'donor_id' => $donor->id,
                    'xp_amount' => -1 * (int) $totalCost,
                    'donation_type' => 'reward_purchase',
                    'reference_type' => RewardOrder::class,
                    'reference_id' => (int) $order->id,
                    'description' => 'Reward purchase order ' . $order->code,
                ]);

                return [
                    'ok' => true,
                    'current_xp' => $currentXp,
                    'new_xp' => $currentXp - $totalCost,
                    'order' => $order->fresh('items'),
                ];
            });

            if (!($result['ok'] ?? false)) {
                return response()->json([
                    'message' => 'Insufficient XP to complete this purchase.',
                    'current_xp' => (int) ($result['current_xp'] ?? 0),
                    'required_xp' => (int) $totalCost,
                ], 422);
            }

            return response()->json([
                'message' => 'Purchase successful. Please pick up your items from the LifeLink Center.',
                'spent_xp' => (int) $totalCost,
                'current_xp' => (int) ($result['new_xp'] ?? 0),
                'items' => $normalized,
                'order' => [
                    'id' => data_get($result, 'order.id'),
                    'code' => data_get($result, 'order.code'),
                    'status' => data_get($result, 'order.status'),
                    'created_at' => data_get($result, 'order.created_at'),
                ],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error processing rewards purchase:', [
                'donor_id' => $donor->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Failed to process purchase'], 500);
        }
    }

    /**
     * Get rewards data for a donor (admin dashboard).
     */
    public function getDonorRewardsForAdmin(Request $request, string $code)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            if (strtolower($user->role ?? '') !== 'admin') {
                return response()->json(['message' => 'Unauthorized. Only admins can access this endpoint.'], 403);
            }

            $donor = Donor::where('code', $code)->firstOrFail();

            $totalXp = XpService::getTotalXp($donor->id);
            $currentLevel = XpService::calculateLevel($totalXp);

            $currentLevelMinXp = $currentLevel > 1
                ? (50 * pow($currentLevel - 1, 2) + 50 * ($currentLevel - 1))
                : 0;
            $nextLevelMinXp = 50 * pow($currentLevel, 2) + 50 * $currentLevel;
            $xpUntilNextLevel = max(0, $nextLevelMinXp - $totalXp);

            $xpRules = [
                ['name' => 'Blood Donation', 'xp_amount' => 500, 'description' => 'Complete a blood donation (home or hospital)'],
                ['name' => 'Organ Registration', 'xp_amount' => 900, 'description' => 'Register for live organ donation'],
                ['name' => 'After Death Organ Donation', 'xp_amount' => 1500, 'description' => 'Register for after-death organ donation'],
                ['name' => 'Financial Donation', 'xp_amount' => 'Variable', 'description' => 'XP equals donation amount (e.g., $50 = 50 XP, $100 = 100 XP)'],
            ];

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
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Donor not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Error fetching admin donor rewards data:', [
                'donor_code' => $code,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch rewards data'
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

    private function getShopProducts(): array
    {
        // Legacy helper kept for backward compatibility (no longer used).
        return [];
    }
}
