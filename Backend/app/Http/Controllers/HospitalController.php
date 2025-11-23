<?php

namespace App\Http\Controllers;

use App\Models\Hospital;
use App\Models\User;
use App\Models\HealthCenterManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;



class HospitalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $hospitals = Hospital::with(['healthCenterManager.user'])->get();
        
        return response()->json([
            'hospitals' => $hospitals,
            'total' => $hospitals->count()
        ], 200);
    }

    public function getHospital($id){
        $hospital = Hospital::find($id);
        if(!$hospital){
            return response()->json(['message'=> 'Hospital not found'], 404);
        }
        return response()->json($hospital, 200);
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
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'phone_nb' => 'required|string',
            'email' => 'required|email',
        
            'manager' => 'required|array',
            'manager.first_name' => 'required|string|max:255',
            'manager.middle_name' => 'nullable|string|max:255',
            'manager.last_name' => 'nullable|string|max:255',
            'manager.phone_nb' => 'required|string',
            'manager.email' => 'required|email|unique:users,email',
            'manager.password' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',       // uppercase
                'regex:/[a-z]/',       // lowercase
                'regex:/[0-9]/',       // number
                'regex:/[^A-Za-z0-9]/' // special
            ],
            'manager.start_time' => 'required',
            'manager.end_time' => 'required',
            'manager.working_dates' => 'array',
        ]);
        

        DB::transaction(function () use ($validated) {
            // Create hospital
            $hospital = Hospital::create([
                'name' => $validated['name'],
                'address' => $validated['address'],
                'phone_nb' => $validated['phone_nb'],
                'email' => $validated['email'],
            ]);
    
            //Create User 
            $user = User::create([
                'first_name'=>$validated['manager']['first_name'],
                'middle_name'=>$validated['manager']['middle_name'] ?? null,
                'last_name'=>$validated['manager']['last_name'] ?? '',
                'email'=>$validated['manager']['email'],
                'phone_nb'=>$validated['manager']['phone_nb'],
                'role'=>'Manager',
                'password'=>Hash::make($validated['manager']['password'])
            ]);

            // Create manager
            HealthCenterManager::create([
                'user_id'=> $user->id,
                'hospital_id' => $hospital->id,
                'position'=>'organ transfer manager',
                'start_time' => $validated['manager']['start_time'],
                'end_time' => $validated['manager']['end_time'],
                'working_dates' => json_encode($validated['manager']['working_dates'] ?? []),
            ]);            
        });
    
        return response()->json(['message' => 'Hospital added successfully'], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Hospitals $hospitals)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Hospitals $hospitals)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Hospitals $hospitals)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Hospitals $hospitals)
    {
        //
    }
}
