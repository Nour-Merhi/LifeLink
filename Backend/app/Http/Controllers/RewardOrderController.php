<?php

namespace App\Http\Controllers;

use App\Models\RewardOrder;
use App\Models\RewardOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RewardOrderController extends Controller
{
    private function requireAdmin()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (strtolower($user->role ?? '') !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Only admins can access this endpoint.'], 403);
        }
        return null;
    }

    public function index(Request $request)
    {
        if ($resp = $this->requireAdmin()) return $resp;

        $orders = RewardOrder::with(['donor.user', 'items'])
            ->orderBy('created_at', 'desc')
            ->limit(250)
            ->get()
            ->map(function ($o) {
                $donorUser = $o->donor ? $o->donor->user : null;
                $donorName = $donorUser
                    ? trim(implode(' ', array_filter([$donorUser->first_name ?? null, $donorUser->middle_name ?? null, $donorUser->last_name ?? null])))
                    : 'N/A';

                return [
                    'id' => $o->id,
                    'code' => $o->code,
                    'status' => $o->status,
                    'total_xp_spent' => (int) $o->total_xp_spent,
                    'created_at' => $o->created_at,
                    'donor' => [
                        'id' => $o->donor_id,
                        'name' => $donorName ?: 'N/A',
                        'email' => $donorUser ? ($donorUser->email ?? null) : null,
                        'phone_nb' => $donorUser ? ($donorUser->phone_nb ?? null) : null,
                    ],
                    'items' => $o->items->map(function ($it) {
                        return [
                            'id' => $it->id,
                            'reward_product_id' => $it->reward_product_id,
                            'product_title' => $it->product_title,
                            'xp_each' => (int) $it->xp_each,
                            'qty' => (int) $it->qty,
                            'xp_total' => (int) $it->xp_total,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return response()->json(['orders' => $orders], 200);
    }

    public function metrics(Request $request)
    {
        if ($resp = $this->requireAdmin()) return $resp;

        $byProduct = RewardOrderItem::query()
            ->select([
                'reward_product_id',
                'product_title',
                DB::raw('SUM(qty) as qty_total'),
                DB::raw('COUNT(DISTINCT reward_order_id) as orders_count'),
                DB::raw('SUM(xp_total) as xp_total'),
            ])
            ->groupBy('reward_product_id', 'product_title')
            ->orderByDesc('qty_total')
            ->get()
            ->map(function ($r) {
                return [
                    'reward_product_id' => $r->reward_product_id,
                    'product_title' => $r->product_title,
                    'qty_total' => (int) $r->qty_total,
                    'orders_count' => (int) $r->orders_count,
                    'xp_total' => (int) $r->xp_total,
                ];
            })
            ->values();

        $totals = RewardOrder::query()
            ->selectRaw('COUNT(*) as orders, COALESCE(SUM(total_xp_spent), 0) as xp_total')
            ->first();

        return response()->json([
            'totals' => [
                'orders' => (int) ($totals->orders ?? 0),
                'xp_total' => (int) ($totals->xp_total ?? 0),
            ],
            'by_product' => $byProduct,
        ], 200);
    }
}

