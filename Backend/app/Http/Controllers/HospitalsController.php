<?php

namespace App\Http\Controllers;

use App\Models\Hospital;
use Illuminate\Http\Request;

class HospitalsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Hospital::all(), 200);
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
        //
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
