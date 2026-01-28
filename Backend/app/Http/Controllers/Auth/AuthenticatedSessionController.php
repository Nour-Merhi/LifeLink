<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    public function login(Request $request)
    {
        try {
            $creds = $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ]);

            $attemptResult = Auth::guard('web')->attempt($creds);
            
            if (!$attemptResult) {
                \Log::warning('Login attempt failed:', [
                    'email' => $creds['email'],
                    'has_session' => $request->hasSession()
                ]);
                return response()->json([
                    'message' => 'Invalid credentials',
                    'errors' => ['email' => ['The provided credentials are incorrect.']]
                ], 401);
            }
            
            $user = Auth::guard('web')->user();
            
            if (!$user) {
                \Log::error('Login succeeded but user is null');
                return response()->json([
                    'message' => 'Authentication failed',
                    'error' => 'User not found after authentication'
                ], 500);
            }
            
            try {
                if ($request->hasSession()) {
                    $request->session()->regenerate();
                }
            } catch (\Exception $e) {
                // Log but don't fail login if session regeneration fails
                \Log::warning('Session regeneration failed during login:', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            \Log::info('Login successful:', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role
            ]);
            
            // Load relationships based on role
            $role = strtolower($user->role ?? '');
            if ($role === 'donor') {
                $user->load(['donor.bloodType']);
            } elseif ($role === 'manager') {
                $user->load(['healthCenterManager.hospital']);
            }
            
            return response()->json([
                'message' => 'Login successful',
                'user' => $user
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Login error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Login failed',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred during login'
            ], 500);
        }
    }

    public function user(Request $request)
    {
        $user = $request->user();
        if ($user) {
            // Load relationships based on user role
            $role = strtolower($user->role ?? '');
            
            if ($role === 'donor') {
            $user->load(['donor.bloodType']);
            }
            
            if ($role === 'manager') {
                $user->load(['healthCenterManager.hospital']);
            }
            
            // Also load for other roles if needed (nurse, admin, etc.)
        }
        return response()->json($user);
    }

    public function logout(Request $request)
    {
        // Support BOTH auth styles:
        // - Cookie/session auth (SPA on same-site domains)
        // - Sanctum personal access tokens (Bearer <token>) for cross-site clients (e.g. Vercel -> Railway)

        // If this request is authenticated via a Sanctum token, revoke ONLY that token.
        $user = $request->user();
        if ($user && method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        // Also logout session guard when session exists (cookie-based auth).
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out']);
    }
    

}
