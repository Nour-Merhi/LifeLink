<?php

namespace App\Http\Controllers;

use App\Models\MobilePhlebotomist;
use App\Models\HomeAppointment;
use App\Models\HomeAppointmentRating;
use App\Models\User;
use App\Models\HealthCenterManager;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Carbon\Carbon;

class MobilePhlebotomistsController extends Controller
{
    private function shouldForceUnavailable($phlebotomist): bool
    {
        // Some environments may include a "status" attribute for phlebotomists.
        // If it exists and is inactive, we force availability to unavailable.
        $status = strtolower((string)($phlebotomist->status ?? ''));
        return $status === 'inactive';
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MobilePhlebotomist::with(['user', 'hospital']);
        
        // Filter by hospital_id if provided
        if ($request->has('hospital_id') && $request->hospital_id) {
            $query->where('hospital_id', $request->hospital_id);
        }
        
        $phlebotomists = $query->orderBy('created_at', 'desc')->get();

        // Aggregate donor ratings per phlebotomist (based on rated, completed home appointments)
        // IMPORTANT: use the snapshot phlebotomist_id on ratings so ratings never "move"
        // if the appointment gets reassigned later.
        $ratingsByPhlebotomist = HomeAppointmentRating::join('home_appointments', 'home_appointment_ratings.home_appointment_id', '=', 'home_appointments.id')
            ->whereNotNull('home_appointment_ratings.phlebotomist_id')
            ->where('home_appointments.state', 'completed')
            ->select(
                'home_appointment_ratings.phlebotomist_id as phlebotomist_id',
                DB::raw('AVG(home_appointment_ratings.rating) as avg_rating'),
                DB::raw('COUNT(home_appointment_ratings.id) as ratings_count')
            )
            ->groupBy('home_appointment_ratings.phlebotomist_id')
            ->get()
            ->keyBy('phlebotomist_id');

        // Single query: appointment counts per phlebotomist (avoids N+1)
        $appointmentStats = HomeAppointment::query()
            ->whereNotNull('phlebotomist_id')
            ->selectRaw("phlebotomist_id, count(*) as total,
                count(case when state = 'completed' then 1 end) as completed,
                count(case when state = 'pending' then 1 end) as pending,
                count(case when state = 'canceled' then 1 end) as canceled")
            ->groupBy('phlebotomist_id')
            ->get()
            ->keyBy('phlebotomist_id');

        // Attach performance stats from pre-aggregated data (no per-row DB writes or queries)
        $phlebotomists = $phlebotomists->map(function ($phlebotomist) use ($appointmentStats) {
            // Display as unavailable if inactive (do not save in list endpoint to avoid N writes)
            if ($this->shouldForceUnavailable($phlebotomist) && $phlebotomist->availability !== 'unavailable') {
                $phlebotomist->availability = 'unavailable';
            }

            $row = $appointmentStats->get($phlebotomist->id);
            $totalAppointments = $row ? (int) $row->total : 0;
            $completedAppointments = $row ? (int) $row->completed : 0;
            $pendingAppointments = $row ? (int) $row->pending : 0;
            $canceledAppointments = $row ? (int) $row->canceled : 0;

            $nonCanceledAppointments = $totalAppointments - $canceledAppointments;
            $successRate = $nonCanceledAppointments > 0
                ? round(($completedAppointments / $nonCanceledAppointments) * 100, 1)
                : 0;

            $phlebotomist->total_appointments = $totalAppointments;
            $phlebotomist->completed_appointments = $completedAppointments;
            $phlebotomist->pending_appointments = $pendingAppointments;
            $phlebotomist->canceled_appointments = $canceledAppointments;
            $phlebotomist->success_rate = $successRate;
            $phlebotomist->makeVisible(['total_appointments', 'completed_appointments', 'pending_appointments', 'canceled_appointments', 'success_rate']);

            return $phlebotomist;
        })->values();

        // Attach rating stats (avg donor rating + rating count) to each phlebotomist
        $phlebotomists = $phlebotomists->map(function ($phlebotomist) use ($ratingsByPhlebotomist) {
            $ratingRow = $ratingsByPhlebotomist->get($phlebotomist->id);
            $avgRating = $ratingRow ? (float) $ratingRow->avg_rating : null;
            $ratingsCount = $ratingRow ? (int) $ratingRow->ratings_count : 0;

            $phlebotomist->avg_rating = $avgRating !== null ? round($avgRating, 2) : null;
            $phlebotomist->ratings_count = $ratingsCount;
            $phlebotomist->makeVisible(['avg_rating', 'ratings_count']);

            return $phlebotomist;
        });
        
        // Calculate overall metrics for dashboard
        $totalStaff = $phlebotomists->count();
        $activeStaff = $phlebotomists->where('availability', 'available')->count();
        
        // Calculate overall success rate from all home appointments
        $totalAppointments = HomeAppointment::whereNotNull('phlebotomist_id')->count();
        $completedAppointments = HomeAppointment::whereNotNull('phlebotomist_id')
            ->where('state', 'completed')
            ->count();
        $pendingAppointments = HomeAppointment::whereNotNull('phlebotomist_id')
            ->where('state', 'pending')
            ->count();
        
        $activeAppointments = $completedAppointments + $pendingAppointments;
        $successRate = $activeAppointments > 0 
            ? round(($completedAppointments / $activeAppointments) * 100, 1)
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
     * Hospital manager: list phlebotomists for their hospital only.
     */
    public function indexForHospital(Request $request, $hospitalId = null)
    {
        $hospitalId = $hospitalId ?? $request->input('hospital_id');
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $user->loadMissing('healthCenterManager');
        $role = strtolower((string)($user->role ?? ''));
        if (!in_array($role, ['manager', 'health_center_manager', 'hospital_manager'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $managerHospitalId = $user->healthCenterManager->hospital_id ?? null;
        if (!$managerHospitalId) {
            return response()->json(['message' => 'Hospital not found for this manager'], 404);
        }
        if ($hospitalId && (int)$hospitalId !== (int)$managerHospitalId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $request->merge(['hospital_id' => $managerHospitalId]);
        return $this->index($request);
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
        try {
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
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $user = User::create([
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone_nb' => $validated['phone_nb'],
                'password' => Hash::make($validated['password']),
                'role' => 'Phlebotomist',
            ]);

            $manager = HealthCenterManager::where('hospital_id', $validated['hospital_id'])->first();

            $mobilePhlebotomist = MobilePhlebotomist::create([
                'license_number' => $validated['licence_number'], 
                'availability' => 'available', 
                'max_appointments' => $validated['max_appointments'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'working_dates' => $validated['working_dates'],
                'user_id' => $user->id,
                'hospital_id' => $validated['hospital_id'],
                'manager_id' => $manager?->id,
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

            $homeAppointment = HomeAppointment::where('code', $orderCode)
                ->when(is_numeric($orderCode), fn ($q) => $q->orWhere('id', (int) $orderCode))
                ->first();

            if (!$homeAppointment) {
                return response()->json([
                    'message' => 'Home visit order not found',
                    'error' => 'Invalid order code or ID'
                ], 404);
            }

            // Do not allow reassignment after completion (protect stats + rating attribution)
            if (($homeAppointment->state ?? '') === 'completed') {
                return response()->json([
                    'message' => 'Cannot assign phlebotomist to a completed appointment',
                    'error' => 'This appointment is already completed and cannot be reassigned'
                ], 422);
            }

            // Verify phlebotomist exists
            $phlebotomist = MobilePhlebotomist::find($validated['phlebotomist_id']);
            if (!$phlebotomist) {
                return response()->json([
                    'message' => 'Phlebotomist not found',
                    'error' => 'Invalid phlebotomist ID'
                ], 404);
            }

            // Check if phlebotomist is unavailable (case-insensitive for robustness)
            if (strtolower((string) ($phlebotomist->availability ?? '')) === 'unavailable') {
                return response()->json([
                    'message' => 'Cannot assign unavailable phlebotomist',
                    'error' => 'The selected phlebotomist is unavailable and cannot be assigned to appointments'
                ], 422);
            }

            // Check if phlebotomist belongs to the same hospital as the home appointment (type-safe comparison)
            if ((int) $phlebotomist->hospital_id !== (int) $homeAppointment->hospital_id) {
                return response()->json([
                    'message' => 'Cannot assign phlebotomist from different hospital',
                    'error' => 'The selected phlebotomist must belong to the same hospital as the appointment'
                ], 422);
            }

            // Update only phlebotomist_id via query to avoid model serialization / attribute issues (e.g. weight(kg) column)
            $phlebotomistId = (int) $validated['phlebotomist_id'];
            HomeAppointment::where('id', $homeAppointment->id)->update(['phlebotomist_id' => $phlebotomistId]);

            return response()->json([
                'message' => 'Phlebotomist assigned successfully',
                'home_appointment' => [
                    'id' => $homeAppointment->id,
                    'code' => $homeAppointment->code,
                    'phlebotomist_id' => $phlebotomistId,
                    'state' => $homeAppointment->state,
                ],
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
    public function show($code)
    {
        try {
            $phlebotomist = MobilePhlebotomist::where('code', $code)
                ->with([
                    'user',
                    'hospital',
                    'homeAppointment.donor.user',
                    'homeAppointment.donor.bloodType',
                    'homeAppointment.appointment',
                    'homeAppointment.hospital'
                ])
                ->firstOrFail();

            // Enforce: inactive => unavailable
            if ($this->shouldForceUnavailable($phlebotomist) && $phlebotomist->availability !== 'unavailable') {
                $phlebotomist->availability = 'unavailable';
                $phlebotomist->save();
            }

            // Calculate statistics - fetch all appointments for this phlebotomist
            $allAppointments = HomeAppointment::where('phlebotomist_id', $phlebotomist->id)->get();
            $totalAppointments = $allAppointments->count();
            $completedAppointments = $allAppointments->where('state', 'completed')->count();
            $pendingAppointments = $allAppointments->where('state', 'pending')->count();
            $canceledAppointments = $allAppointments->where('state', 'canceled')->count();
            
            // Calculate success rate: completed / (completed + pending), excluding canceled
            $activeAppointments = $completedAppointments + $pendingAppointments;
            $successRate = $activeAppointments > 0 
                ? round(($completedAppointments / $activeAppointments) * 100, 1)
                : 0;

            // Get work history - all appointments (pending, completed, canceled) ordered by date
            $workHistory = HomeAppointment::where('phlebotomist_id', $phlebotomist->id)
                ->with(['donor.user', 'donor.bloodType', 'appointment', 'hospital'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($appointment) {
                    $donor = $appointment->donor;
                    $user = $donor ? $donor->user : null;
                    $bloodType = $donor && $donor->bloodType 
                        ? $donor->bloodType->type . $donor->bloodType->rh_factor 
                        : 'N/A';
                    
                    $donorName = 'N/A';
                    if ($user) {
                        $nameParts = array_filter([
                            $user->first_name,
                            $user->middle_name,
                            $user->last_name
                        ]);
                        $donorName = implode(' ', $nameParts);
                    }

                    $appointmentDate = $appointment->appointment 
                        ? $appointment->appointment->appointment_date 
                        : 'N/A';
                    
                    $appointmentTime = $appointment->appointment_time ?? 'N/A';
                    if ($appointmentTime !== 'N/A' && preg_match('/^(\d{2}):(\d{2})$/', $appointmentTime, $matches)) {
                        $hour = (int)$matches[1];
                        $minute = $matches[2];
                        $ampm = $hour >= 12 ? 'PM' : 'AM';
                        $hour12 = $hour % 12;
                        if ($hour12 === 0) $hour12 = 12;
                        $appointmentTime = sprintf('%d:%s %s', $hour12, $minute, $ampm);
                    }

                    return [
                        'id' => $appointment->code,
                        'donor_name' => $donorName,
                        'blood_type' => $bloodType,
                        'hospital_name' => $appointment->hospital ? $appointment->hospital->name : 'N/A',
                        'date' => $appointmentDate,
                        'time' => $appointmentTime,
                        'state' => $appointment->state,
                        'address' => $appointment->address ?? 'N/A',
                        'created_at' => $appointment->created_at ? Carbon::parse($appointment->created_at)->format('Y-m-d H:i:s') : 'N/A',
                    ];
                });

            // Get user info
            $user = $phlebotomist->user;
            $fullName = 'N/A';
            if ($user) {
                $nameParts = array_filter([
                    $user->first_name,
                    $user->middle_name,
                    $user->last_name
                ]);
                $fullName = implode(' ', $nameParts);
            }

            return response()->json([
                'phlebotomist' => [
                    'id' => $phlebotomist->id,
                    'code' => $phlebotomist->code,
                    'name' => $fullName,
                    'first_name' => $user ? $user->first_name : 'N/A',
                    'middle_name' => $user ? $user->middle_name : null,
                    'last_name' => $user ? $user->last_name : 'N/A',
                    'email' => $user ? $user->email : 'N/A',
                    'phone_nb' => $user ? $user->phone_nb : 'N/A',
                    'license_number' => $phlebotomist->license_number ?? 'N/A',
                    'availability' => $phlebotomist->availability ?? 'available',
                    'max_appointments' => $phlebotomist->max_appointments ?? 0,
                    'start_time' => $phlebotomist->start_time ?? 'N/A',
                    'end_time' => $phlebotomist->end_time ?? 'N/A',
                    'working_dates' => $phlebotomist->working_dates ?? [],
                    'hospital_id' => $phlebotomist->hospital_id,
                    'hospital_name' => $phlebotomist->hospital ? $phlebotomist->hospital->name : 'N/A',
                    'hospital_address' => $phlebotomist->hospital ? $phlebotomist->hospital->address : 'N/A',
                    'hospital_phone' => $phlebotomist->hospital ? $phlebotomist->hospital->phone_nb : 'N/A',
                    'created_at' => $phlebotomist->created_at ? Carbon::parse($phlebotomist->created_at)->format('Y-m-d H:i:s') : 'N/A',
                    'statistics' => [
                        'total_appointments' => $totalAppointments,
                        'completed_appointments' => $completedAppointments,
                        'pending_appointments' => $pendingAppointments,
                        'canceled_appointments' => $canceledAppointments,
                        'success_rate' => $successRate,
                    ],
                    'work_history' => $workHistory,
                ]
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Phlebotomist not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error fetching phlebotomist:', [
                'code' => $code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch phlebotomist: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $code)
    {
        try {
            $phlebotomist = MobilePhlebotomist::where('code', $code)->firstOrFail();

            $validated = $request->validate([
                'availability' => 'sometimes|in:available,onDuty,unavailable',
                // Optional: some clients may send status; we only use it to enforce availability.
                'status' => 'sometimes|in:active,inactive',
                'max_appointments' => 'sometimes|integer|min:1',
                'start_time' => 'sometimes|date_format:H:i',
                'end_time' => 'sometimes|date_format:H:i',
                'working_dates' => 'sometimes|array',
                'first_name' => 'sometimes|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'sometimes|string|max:100',
                'email' => 'sometimes|email|unique:users,email,' . $phlebotomist->user_id,
                'phone_nb' => 'sometimes|string|max:30|unique:users,phone_nb,' . $phlebotomist->user_id,
            ]);

            DB::beginTransaction();

            // Update user info if provided
            if (isset($validated['first_name']) || isset($validated['last_name']) || isset($validated['email']) || isset($validated['phone_nb'])) {
                $user = $phlebotomist->user;
                if ($user) {
                    if (isset($validated['first_name'])) $user->first_name = $validated['first_name'];
                    if (isset($validated['middle_name'])) $user->middle_name = $validated['middle_name'];
                    if (isset($validated['last_name'])) $user->last_name = $validated['last_name'];
                    if (isset($validated['email'])) $user->email = $validated['email'];
                    if (isset($validated['phone_nb'])) $user->phone_nb = $validated['phone_nb'];
                    $user->save();
                }
            }

            // Update phlebotomist info
            if (isset($validated['availability'])) $phlebotomist->availability = $validated['availability'];
            if (isset($validated['max_appointments'])) $phlebotomist->max_appointments = $validated['max_appointments'];
            if (isset($validated['start_time'])) $phlebotomist->start_time = $validated['start_time'];
            if (isset($validated['end_time'])) $phlebotomist->end_time = $validated['end_time'];
            if (isset($validated['working_dates'])) $phlebotomist->working_dates = $validated['working_dates'];

            // Enforce: if status is inactive (from client or existing attribute), availability must be unavailable
            $incomingStatus = isset($validated['status']) ? strtolower((string)$validated['status']) : null;
            if (($incomingStatus === 'inactive') || $this->shouldForceUnavailable($phlebotomist)) {
                $phlebotomist->availability = 'unavailable';
            }
            
            $phlebotomist->save();

            DB::commit();

            return response()->json([
                'message' => 'Phlebotomist updated successfully',
                'phlebotomist' => $phlebotomist->load('user', 'hospital')
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Phlebotomist not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating phlebotomist:', [
                'code' => $code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update phlebotomist: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($code)
    {
        try {
            $phlebotomist = MobilePhlebotomist::where('code', $code)->firstOrFail();

            // Check if phlebotomist has active appointments
            $activeAppointments = $phlebotomist->homeAppointment()
                ->where('state', '!=', 'canceled')
                ->where('state', '!=', 'completed')
                ->count();

            if ($activeAppointments > 0) {
                return response()->json([
                    'message' => 'Cannot delete phlebotomist with active appointments. Please reassign or complete/cancel appointments first.',
                    'active_appointments' => $activeAppointments
                ], 422);
            }

            DB::beginTransaction();

            // Delete user (cascade should handle this, but being explicit)
            $user = $phlebotomist->user;
            if ($user) {
                $user->delete();
            }

            // Delete phlebotomist
            $phlebotomist->delete();

            DB::commit();

            return response()->json([
                'message' => 'Phlebotomist deleted successfully'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Phlebotomist not found'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting phlebotomist:', [
                'code' => $code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to delete phlebotomist: ' . $e->getMessage()
            ], 500);
        }
    }
}
