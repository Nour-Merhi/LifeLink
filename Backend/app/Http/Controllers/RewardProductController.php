<?php

namespace App\Http\Controllers;

use App\Models\RewardProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RewardProductController extends Controller
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

        $products = RewardProduct::orderBy('id', 'asc')->get()->map(function ($p) {
            return $this->serialize($p);
        });

        return response()->json(['products' => $products], 200);
    }

    public function store(Request $request)
    {
        if ($resp = $this->requireAdmin()) return $resp;

        $data = $request->validate([
            'code' => 'nullable|string|max:50|unique:reward_products,code',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'cost_xp' => 'required|integer|min:0|max:1000000',
            'is_active' => 'sometimes|boolean',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $stored = $request->file('image')->store('reward-products', 'public');
            $imagePath = '/storage/' . ltrim($stored, '/');
        }

        $p = RewardProduct::create([
            'code' => !empty($data['code']) ? $data['code'] : ('RP-' . strtoupper(Str::random(8))),
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'cost_xp' => (int) $data['cost_xp'],
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
            'image_path' => $imagePath,
        ]);

        return response()->json(['message' => 'Reward product created', 'product' => $this->serialize($p)], 201);
    }

    public function update(Request $request, RewardProduct $rewardProduct)
    {
        if ($resp = $this->requireAdmin()) return $resp;

        $data = $request->validate([
            'code' => 'sometimes|string|max:50|unique:reward_products,code,' . $rewardProduct->id,
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'cost_xp' => 'sometimes|integer|min:0|max:1000000',
            'is_active' => 'sometimes|boolean',
        ]);

        $rewardProduct->fill($data);
        $rewardProduct->save();

        return response()->json(['message' => 'Reward product updated', 'product' => $this->serialize($rewardProduct)], 200);
    }

    public function uploadImage(Request $request, RewardProduct $rewardProduct)
    {
        if ($resp = $this->requireAdmin()) return $resp;

        $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        // Delete old image if stored on public disk
        if ($rewardProduct->image_path && str_starts_with($rewardProduct->image_path, '/storage/')) {
            $old = ltrim(str_replace('/storage/', '', $rewardProduct->image_path), '/');
            if ($old) {
                Storage::disk('public')->delete($old);
            }
        }

        $stored = $request->file('image')->store('reward-products', 'public');
        $rewardProduct->image_path = '/storage/' . ltrim($stored, '/');
        $rewardProduct->save();

        return response()->json(['message' => 'Image uploaded', 'product' => $this->serialize($rewardProduct)], 200);
    }

    public function destroy(Request $request, RewardProduct $rewardProduct)
    {
        if ($resp = $this->requireAdmin()) return $resp;

        if ($rewardProduct->image_path && str_starts_with($rewardProduct->image_path, '/storage/')) {
            $old = ltrim(str_replace('/storage/', '', $rewardProduct->image_path), '/');
            if ($old) {
                Storage::disk('public')->delete($old);
            }
        }

        $rewardProduct->delete();
        return response()->json(['message' => 'Reward product deleted'], 200);
    }

    private function serialize(RewardProduct $p): array
    {
        return [
            'id' => $p->id,
            'code' => $p->code,
            'title' => $p->title,
            'description' => $p->description,
            'cost_xp' => (int) $p->cost_xp,
            'image_path' => $p->image_path,
            'is_active' => (bool) $p->is_active,
            'created_at' => $p->created_at,
            'updated_at' => $p->updated_at,
        ];
    }
}

