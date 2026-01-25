<?php

namespace App\Http\Controllers\MobileControllers;

use App\Http\Controllers\Controller;
use App\Models\Donor;
use App\Models\HealthCenterManager;
use App\Models\MobilePhlebotomist;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MobileAuthController extends Controller
{
    /**
     * Mobile login (token-based).
     * POST /api/mobile/login
     * Body: { email, password }
     * Returns: { token, user }
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        // Revoke old tokens for a clean "one device" behavior (optional but practical)
        $user->tokens()->delete();

        $token = $user->createToken('mobile')->plainTextToken;

        // Useful IDs for mobile to call role-based endpoints
        $donor = null;
        $phleb = null;
        $manager = null;

        $role = strtolower((string) ($user->role ?? ''));
        if ($role === 'donor') {
            $donor = Donor::where('user_id', $user->id)->first();
        } elseif ($role === 'phlebotomist') {
            $phleb = MobilePhlebotomist::where('user_id', $user->id)->first();
        } elseif ($role === 'manager' || $role === 'hospital_manager' || $role === 'health_center_manager') {
            $manager = HealthCenterManager::where('user_id', $user->id)->first();
        }

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'code' => $user->code,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone_nb' => $user->phone_nb,
                'role' => $user->role,
                'donor_id' => $donor ? $donor->id : null,
                'phlebotomist_id' => $phleb ? $phleb->id : null,
                'manager_id' => $manager ? $manager->id : null,
                'hospital_id' => $manager ? $manager->hospital_id : ($phleb ? $phleb->hospital_id : null),
            ],
        ], 200);
    }
}

