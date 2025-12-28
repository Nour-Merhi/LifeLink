<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Donor;
use App\Models\BloodType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'username' => 'required|string|max:100',
                'email' => 'required|email|unique:users,email',
                'password' => [
                    'required',
                    'string',
                    'min:8',
                    'regex:/[A-Z]/',       // uppercase
                    'regex:/[a-z]/',       // lowercase
                    'regex:/[0-9]/',       // number
                    'regex:/[^A-Za-z0-9]/' // special
                ],
                'confirmPassword' => 'required|string|same:password',
                'dob' => 'required|date|before:today',
                'bloodType' => 'required|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
                'lastDonation' => 'nullable|date|before_or_equal:today',
                'city' => 'nullable|string|max:100',
            ]);
        } catch (ValidationException $e) {
            $errors = $e->errors();
            
            // Check if email is already taken and return generic error message
            // Laravel returns "The email has already been taken." for unique validation
            if (isset($errors['email'])) {
                $emailErrors = $errors['email'];
                // Check if any email error contains "already been taken" or "has already been taken"
                $isEmailTaken = false;
                foreach ($emailErrors as $error) {
                    if (stripos($error, 'already been taken') !== false || 
                        stripos($error, 'has already been taken') !== false) {
                        $isEmailTaken = true;
                        break;
                    }
                }
                
                if ($isEmailTaken) {
                    return response()->json([
                        'message' => 'Email or password is incorrect',
                        'errors' => ['email' => ['Email or password is incorrect']]
                    ], 422);
                }
            }
            
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $errors
            ], 422);
        }

        // Parse blood type string (e.g., "A+" -> type: "A", rh_factor: "+")
        $bloodTypeString = $validated['bloodType'];
        if (!preg_match('/^(A|B|AB|O)([+-])$/', $bloodTypeString, $matches)) {
            return response()->json([
                'message' => 'Invalid blood type format. Expected format: A+, B-, AB+, O+, etc.',
                'errors' => ['bloodType' => ['Invalid blood type format']]
            ], 422);
        }
        
        $type = $matches[1]; // A, B, AB, or O
        $rhFactor = $matches[2]; // + or -
        
        // Find blood type ID
        $bloodType = BloodType::where('type', $type)
            ->where('rh_factor', $rhFactor)
            ->first();
            
        if (!$bloodType) {
            return response()->json([
                'message' => 'Blood type not found in database',
                'errors' => ['bloodType' => ['Blood type not found']]
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Split username into first_name and last_name
            // If username has spaces, split it; otherwise use whole as first_name
            $nameParts = explode(' ', trim($validated['username']), 2);
            $firstName = $nameParts[0];
            $lastName = isset($nameParts[1]) ? $nameParts[1] : '';

            // Create user - phone_nb is unique, so we'll generate a temporary unique value
            // User can update it later
            $user = User::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $validated['email'],
                'phone_nb' => 'temp_' . uniqid() . '_' . mt_rand(10000, 99999), // Temporary unique value
                'city' => $validated['city'] ?? null,
                'role' => 'Donor',
                'password' => Hash::make($validated['password']),
            ]);

            // Create donor
            $donor = Donor::create([
                'user_id' => $user->id,
                'gender' => 'male', // Default, can be updated later
                'date_of_birth' => $validated['dob'],
                'blood_type_id' => $bloodType->id,
                'last_donation' => $validated['lastDonation'] ?? null,
            ]);

            DB::commit();

            // Auto-login the user after registration
            auth()->login($user);

            return response()->json([
                'message' => 'Registration successful',
                'user' => $user->load('donor')
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            \Log::error('Registration database error:', [
                'error' => $e->getMessage(),
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Registration failed',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred during registration'
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Registration error:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Registration failed',
                'error' => config('app.debug') ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : 'An error occurred during registration'
            ], 500);
        }
    }
}
