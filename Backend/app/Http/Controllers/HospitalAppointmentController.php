<?php

namespace App\Http\Controllers;

use App\Models\HospitalAppointment;
use App\Models\Hospital;
use Illuminate\Http\Request;

class HospitalAppointmentController extends Controller
{
    
    public function index()
    {
        //
    }

    public function create()
    {
        
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->all();

        $hospitalName = $request->input('hospital_name');
        $appointmentTime = $request-> input('appointment_time');
        $appointmentDate = $request->input('appointment_date');

        $hospital = Hospital::where('name', $hospitalName)->first();
         if (!$hospital) {
            return response()->json([
                'message' => 'Hospital not found.'
            ], 404);
        }
        $hospital_id = $hospital->id;

        HospitalAppointment::create([
            
        ]);

    }

    /**
     * Display the specified resource.
     */
    public function show(Hospital_Appointment $hospital_Appointment)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Hospital_Appointment $hospital_Appointment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Hospital_Appointment $hospital_Appointment)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Hospital_Appointment $hospital_Appointment)
    {
        //
    }
}
