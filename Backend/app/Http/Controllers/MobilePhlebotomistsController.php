<?php

namespace App\Http\Controllers;

use App\Models\MobilePhlebotomist;
use App\Models\HomeAppointment;
use App\Models\User;
use App\Models\HealthCenterManager;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Carbon\Carbon;

class MobilePhlebotomistsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $phlebotomists = MobilePhlebotomist::with(['user', 'hospital'])->get();
        
        // Calculate metrics
        $totalStaff = $phlebotomists->count();
        $activeStaff = $phlebotomists->where('availability', 'available')->count();
        
        // Calculate success rate from home appointments
        $totalAppointments = HomeAppointment::whereNotNull('phlebotomist_id')->count();
        $completedAppointments = HomeAppointment::whereNotNull('phlebotomist_id')
            ->where('state', 'completed')
            ->count();
        
        $successRate = $totalAppointments > 0 
            ? round(($completedAppointments / $totalAppointments) * 100, 1)
            : 0;
        
        // Calculate this month's new staff
        $thisMonth = Carbon::now()->startOfMonth();
        $newThisMonth = MobilePhlebotomist::where('created_at', '>=', $thisMonth)->count();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();
        $newLastMonth = MobilePhlebotomist::whereBetween('created_at', [$lastMonth, $lastMonthEnd])->count();
        
        $monthlyChange = $newLastMonth > 0 
            ? round((($newThisMonth - $newLastMonth) / $newLastMonth) * 100, 1)
            : ($newThisMonth > 0 ? 100 : 0);
        
        // Calculate availability change
        $availableLastMonth = MobilePhlebotomist::where('availability', 'available')
            ->where('updated_at', '<=', $lastMonthEnd)
            ->count();
        $availabilityChange = $availableLastMonth > 0
            ? round((($activeStaff - $availableLastMonth) / $availableLastMonth) * 100, 1)
            : ($activeStaff > 0 ? 100 : 0);
        
        // Calculate success rate change
        $completedLastMonth = HomeAppointment::whereNotNull('phlebotomist_id')
            ->where('state', 'completed')
            ->where('updated_at', '<=', $lastMonthEnd)
            ->count();
        $totalLastMonth = HomeAppointment::whereNotNull('phlebotomist_id')
            ->where('updated_at', '<=', $lastMonthEnd)
            ->count();
        $successRateLastMonth = $totalLastMonth > 0 
            ? round(($completedLastMonth / $totalLastMonth) * 100, 1)
            : 0;
        $successRateChange = $successRateLastMonth > 0
            ? round(($successRate - $successRateLastMonth), 1)
            : ($successRate > 0 ? $successRate : 0);
        
        return response()->json([
            'phlebotomists' => $phlebotomists,
            'total' => $totalStaff,
            'metrics' => [
                'total_staff' => $totalStaff,
                'active_staff' => $activeStaff,
                'success_rate' => $successRate,
                'monthly_change' => $monthlyChange,
                'availability_change' => $availabilityChange,
                'success_rate_change' => $successRateChange,
            ]
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
            'licence_number' => 'required|string|max:100',
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone_nb' => 'required|string|max:30|unique:users,phone_nb',
            'password' => 'required|string|min:8',
            'hospital_id' => 'required|exists:hospitals,id',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'working_dates' => 'required|array',
            'max_appointments' => 'required|integer|min:1',
            'years_of_experience' => 'nullable|integer|min:0',
        ]);

        try {
            DB::beginTransaction();

            $user = User::create([
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone_nb' => $validated['phone_nb'],
                'password' => Hash::make($validated['password']),
                'role' => 'phlebotomist',
            ]);

            // Get manager for the hospital (may be null)
            $manager = HealthCenterManager::where('hospital_id', $validated['hospital_id'])->first();
            
            if (!$manager) {
                DB::rollBack();
                return response()->json([
                    'message' => 'No health center manager found for this hospital'
                ], 404);
            }

            $mobilePhlebotomist = MobilePhlebotomist::create([
                'license_number' => $validated['licence_number'], // Frontend uses British spelling
                'availability' => 'available', // Default availability
                'max_appointments' => $validated['max_appointments'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'working_dates' => $validated['working_dates'],
                'user_id' => $user->id,
                'hospital_id' => $validated['hospital_id'],
                'manager_id' => $manager->id,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Mobile Phlebotomist created successfully',
                'mobilePhlebotomist' => $mobilePhlebotomist
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating mobile phlebotomist:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'message' => 'Failed to create mobile phlebotomist',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign a phlebotomist to a home visit order
     */
    public function assignPhlebotomist(Request $request, $orderCode)
    {
        try {
            $validated = $request->validate([
                'phlebotomist_id' => 'required|exists:mobile_phlebotomists,id'
            ]);

            // Find the home appointment by code
            $homeAppointment = HomeAppointment::where('code', $orderCode)
                ->orWhere('id', $orderCode)
                ->first();

            if (!$homeAppointment) {
                return response()->json([
                    'message' => 'Home visit order not found',
                    'error' => 'Invalid order code or ID'
                ], 404);
            }

            // Verify phlebotomist exists
            $phlebotomist = MobilePhlebotomist::find($validated['phlebotomist_id']);
            if (!$phlebotomist) {
                return response()->json([
                    'message' => 'Phlebotomist not found',
                    'error' => 'Invalid phlebotomist ID'
                ], 404);
            }

            // Update the home appointment with phlebotomist ID
            $homeAppointment->phlebotomist_id = $validated['phlebotomist_id'];
            $homeAppointment->save();

            // Load relationships for response
            $homeAppointment->load(['mobilePhlebotomist.user', 'donor.user']);

            return response()->json([
                'message' => 'Phlebotomist assigned successfully',
                'home_appointment' => $homeAppointment
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error assigning phlebotomist:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'order_code' => $orderCode,
                'request_data' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to assign phlebotomist',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while assigning phlebotomist'
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Mobile_Phlebotomists $mobile_Phlebotomists)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Mobile_Phlebotomists $mobile_Phlebotomists)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Mobile_Phlebotomists $mobile_Phlebotomists)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Mobile_Phlebotomists $mobile_Phlebotomists)
    {
        //
    }
}
