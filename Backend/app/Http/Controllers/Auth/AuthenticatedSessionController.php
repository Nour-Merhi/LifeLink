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

            if (!Auth::attempt($creds)) {
                return response()->json([
                    'message' => 'Invalid credentials',
                    'errors' => ['email' => ['The provided credentials are incorrect.']]
                ], 401);
            }

            // Regenerate session to prevent session fixation attacks (only if session exists)
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }
            
            $user = Auth::user();
            
            return response()->json([
                'message' => 'Login successful',
                'user' => $user->load('donor')
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
            // Load donor relationship with blood type
            $user->load(['donor.bloodType']);
        }
        return response()->json($user);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        
        // Only invalidate session if it exists
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
        
        return response()->json(['message'=>'Logged out']);
    }
    

}
