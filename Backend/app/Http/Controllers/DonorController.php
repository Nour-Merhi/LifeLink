<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Models\User;
use App\Models\BloodType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DonorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $donors = Donor::with('user')->get();
        
        return response()->json([
            'donors' => $donors,
            'total' => $donors->count()
        ], 200);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name'=> 'required|string|max:100',
            'middle_name'=> 'nullable|string|max:100',
            'last_name'=> 'required|string|max:100',
            'email'=> 'required|email|unique:users,email',
            'phone_nb'=> 'required|string|max:30|unique:users,phone_nb',
            'password'=> [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',       // uppercase
                'regex:/[a-z]/',       // lowercase
                'regex:/[0-9]/',       // number
                'regex:/[^A-Za-z0-9]/' // special
            ],
            'gender'=> 'required|in:male,female',
            'date_of_birth'=> 'required|date|before:today',
            'blood_type_id' => 'required|exists:blood_types,id',
        ]);

        $result = DB::transaction(function () use ($validated) {
            $user = User::create([
                'first_name'=> $validated['first_name'],
                'middle_name'=> $validated['middle_name'] ?? null,
                'last_name'=> $validated['last_name'] ?? '',
                'email'=> $validated['email'],
                'phone_nb'=> $validated['phone_nb'],
                'role'=> 'donor',
                'password'=> Hash::make($validated['password']),
            ]);

            $donor = Donor::create([
                'user_id'=> $user->id,
                'gender'=> $validated['gender'],
                'date_of_birth'=> $validated['date_of_birth'],
                'blood_type_id'=> $validated['blood_type_id'],
            ]);

            return [$user, $donor];
        });

        [$user, $donor] = $result;

        return response()->json([
            'message' => 'Donor created successfully',
            'user' => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone_nb' => $user->phone_nb,
            ],
            'donor' => [
                'userID' => $donor->userID,
                'gender' => $donor->gender,
                'date_of_birth' => $donor->date_of_birth,
                'blood_type_id' => $donor->blood_type_id,
            ]
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Donor $donor)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Donor $donor)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Donors $donor)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Donors $donor)
    {
        //
    }

    /**
     * Get all blood types
     */
    public function getBloodTypes()
    {
        $bloodTypes = BloodType::orderBy('id', 'asc')->get();
        
        return response()->json([
            'blood_types' => $bloodTypes,
            'total' => $bloodTypes->count()
        ], 200);
    }
}
