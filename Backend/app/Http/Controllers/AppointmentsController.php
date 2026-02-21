<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Hospital;
use App\Models\HomeAppointment;
use App\Models\HospitalAppointment;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AppointmentsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }
    public function createAppointment(){

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    private function generateRegularTimeSlots($startTime, $endTime, $gapHours)
    {
        $slots = [];
        // Cast gapHours to float to ensure it's numeric
        $gapHours = (float) $gapHours;
        
        // Parse time strings in H:i format
        $start = Carbon::createFromFormat('H:i', $startTime);
        $end   = Carbon::createFromFormat('H:i', $endTime);

        while ($start->lessThan($end)) {
            $slotEnd = $start->copy()->addHours($gapHours);

            if ($slotEnd->greaterThan($end)) {
                break;
            }

            $slots[] = [
                'start' => $start->format('H:i'),
                'end'   => $slotEnd->format('H:i'),
                'is_available' => true
            ];

            $start->addHours($gapHours);
        }

        return $slots;
    }

    private function generateUrgentTimeSlots(Carbon $start, Carbon $end, $gapHours)
    {
        $slots = [];
        $gapHours = (float) $gapHours;

        $current = $start->copy();

        while ($current->lessThan($end)) {
            $slotEnd = $current->copy()->addHours($gapHours);

            if ($slotEnd->greaterThan($end)) {
                break;
            }

            $slots[] = [
                'start' => $current->format('H:i'),
                'end'   => $slotEnd->format('H:i'),
                'is_available' => true
            ];

            $current->addHours($gapHours);
        }

        return $slots;
    }

    public function createHomeAppointments(Request $request, $hospitalId = null)
    {
        try {
            // Clean the request data - convert empty strings to null and ensure arrays are handled
            $input = $request->all();
            foreach ($input as $key => $value) {
                if (is_array($value)) {
                    // If it's an array, convert to string or null
                    if (empty($value)) {
                        $input[$key] = null;
                    } else {
                        // For time/date/string fields, take first element and convert to string
                        if (in_array($key, ['start_time', 'end_time', 'due_time', 'blood_type', 'appointment_type'])) {
                            $input[$key] = isset($value[0]) ? (string)$value[0] : null;
                        } else {
                            // For other fields, keep as is
                            $input[$key] = $value;
                        }
                    }
                } elseif ($value === '') {
                    $input[$key] = null;
                }
            }
            $request->merge($input);
            
            // ----------------------------
            // 1. VALIDATION
            // ----------------------------
            $rules = [
                'appointment_type' => 'required|in:urgent,regular',
                'appointment_date' => 'required|date',
                'gap_hours'        => 'required|numeric|min:0|max:4',
            ];

            if ($hospitalId) {
                $rules['hospital_id'] = 'required|exists:hospitals,id|in:' . $hospitalId;
            }
            else {
                $rules['hospital_id'] = 'required|exists:hospitals,id';
            }

            // Conditional validation based on appointment type
            if ($request->appointment_type === 'regular') {
                $rules['appointment_date'] = 'required|date|after_or_equal:today';
                $rules['start_time'] = 'required|string|date_format:H:i';
                $rules['end_time'] = 'required|string|date_format:H:i';
                $rules['gap_hours'] = 'required|numeric|min:0.5|max:4';
                // Make urgent fields nullable for regular appointments
                $rules['due_date'] = 'nullable|date';
                $rules['due_time'] = 'nullable|date_format:H:i';
                $rules['blood_type'] = 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-';
            } else {
                // Urgent fields - appointment_date validation handled in code logic below
                $rules['due_date'] = 'required_if:appointment_type,urgent|date';
                $rules['due_time'] = 'required_if:appointment_type,urgent|date_format:H:i';
                $rules['blood_type'] = 'required_if:appointment_type,urgent|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-';
               
                if ($request->has('start_time')) {
                    $request->request->remove('start_time');
                }
                if ($request->has('end_time')) {
                    $request->request->remove('end_time');
                }
            }
            
            // Validate first to get clean data
            $validated = $request->validate($rules);
            
            // Custom validation for end_time after start_time (only for regular)
            if ($validated['appointment_type'] === 'regular' && 
                !empty($validated['start_time']) && 
                !empty($validated['end_time'])) {
                $startTime = Carbon::createFromFormat('H:i', $validated['start_time']);
                $endTime = Carbon::createFromFormat('H:i', $validated['end_time']);
                
                if ($endTime->lte($startTime)) {
                    throw ValidationException::withMessages([
                        'end_time' => ['The end time must be after start time.']
                    ]);
                }
            }

        $timezone = config('app.timezone', 'UTC');

        // ----------------------------
        // 2. STATIC VALUES
        // ----------------------------
        $hospital = Hospital::find($validated['hospital_id']);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $today = Carbon::now($timezone);
        $appointmentDate = Carbon::parse($validated['appointment_date'], $timezone)->startOfDay();

        // ----------------------------
        // 3. URGENT LOGIC (24-hour window, today only)
        // ----------------------------
        if ($validated['appointment_type'] === 'urgent') {
            // Always treat incoming due date/time as LOCAL USER TIME
            $now = Carbon::now();
            $today = Carbon::today();

            // Parse due datetime WITHOUT forcing timezone
            $dueDateTime = Carbon::createFromFormat(
                'Y-m-d H:i',
                $validated['due_date'] . ' ' . $validated['due_time']
            );

            // Rule 1: due date must be today
            if (!$dueDateTime->isSameDay($today)) {
                return response()->json([
                    'message' => 'Urgent appointments can only be scheduled for today.'
                ], 422);
            }

            // Rule 2: must be in the future
            if ($dueDateTime->lessThanOrEqualTo($now)) {
                return response()->json([
                    'message' => 'Urgent due time must be after the current time.'
                ], 422);
            }

            // Rule 3: must be within 24 hours
            if ($dueDateTime->greaterThan($now->copy()->addHours(24))) {
                return response()->json([
                    'message' => 'Urgent appointment must be within 24 hours from now.'
                ], 422);
            }
        
            // Start time = now
            $startTime = $now;
        
            // Generate slots
            $timeSlots = $this->generateUrgentTimeSlots(
                $startTime,
                $dueDateTime,
                $validated['gap_hours']
            );
        
            // Appointment date = today (always)
            $appointmentDate = $today;
        }
        
        
        // ----------------------------
        // 4. REGULAR LOGIC
        // ----------------------------
        else {
            // For regular appointments, validate that appointment_date is in the future
            if ($appointmentDate->lessThan($today->copy()->startOfDay())) {
                return response()->json([
                    'message' => 'Regular appointment date must be today or in the future.'
                ], 422);
            }
            
            $startTime = $validated['start_time'];
            $endTime   = $validated['end_time'];

            $timeSlots = $this->generateRegularTimeSlots(
                $validated['start_time'],
                $validated['end_time'],
                $validated['gap_hours']
            );
        }

        // ----------------------------
        // 5. BUILD APPOINTMENT DATA
        // ----------------------------
        $appointmentData = [
            'appointment_date' => $appointmentDate->toDateString(),
            'appointment_type' => $validated['appointment_type'],
            'time_slots'       => $timeSlots,
            'hospital_id'      => $validated['hospital_id'],
            'donation_type'    => 'Home Blood Donation',
            'state'            => 'pending',
        ];

        if ($validated['appointment_type'] === 'urgent') {
            $appointmentData['due_date'] = $validated['due_date'];
            $appointmentData['due_time'] = $validated['due_time'];
            $appointmentData['blood_type'] = $validated['blood_type'];
        }

            // ----------------------------
            // 6. SAVE
            // ----------------------------
            $appointment = Appointment::create($appointmentData);

            return response()->json([
                'message' => 'Appointment created successfully.',
                'appointment' => $appointment->load('hospital')
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Re-throw validation exceptions to return proper 422 response
            throw $e;
        } catch (\Exception $e) {
            // Log the error and return a generic error message
            \Log::error('Error creating home appointment: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'An error occurred while creating the appointment.',
                'error' => config('app.debug') ? $e->getMessage() : 'Please check the server logs for details.'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        
    }

    /**
     * Display the specified resource.
     */
    public function show(Appointment $appointment)
    {
        try {
            $appointment->load('hospital');
            
            return response()->json([
                'appointment' => $appointment
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching appointment:', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch appointment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Appointment $appointments)
    {
        //
    }

    public function createHospitalAppointments(Request $request, $hospitalId = null)
    {
        try {
            // Get hospital ID from route parameter or request
            if (!$hospitalId) {
                $hospitalId = $request->input('hospital_id');
            }
            
            // If still no hospital ID, try to get from authenticated user (for hospital managers)
            if (!$hospitalId) {
                $user = $request->user();
                if ($user && strtolower($user->role) === 'manager') {
                    if (!$user->relationLoaded('healthCenterManager')) {
                        $user->load('healthCenterManager');
                    }
                    if ($user->healthCenterManager && $user->healthCenterManager->hospital_id) {
                        $hospitalId = $user->healthCenterManager->hospital_id;
                    }
                }
            }
            
            // Clean the request data - convert empty strings to null and ensure arrays are handled
            $input = $request->all();
            foreach ($input as $key => $value) {
                if (is_array($value)) {
                    // If it's an array, convert to string or null
                    if (empty($value)) {
                        $input[$key] = null;
                    } else {
                        // For time/date/string fields, take first element and convert to string
                        if (in_array($key, ['start_time', 'end_time', 'due_time', 'blood_type', 'appointment_type'])) {
                            $input[$key] = isset($value[0]) ? (string)$value[0] : null;
                        } else {
                            // For other fields, keep as is
                            $input[$key] = $value;
                        }
                    }
                } elseif ($value === '') {
                    $input[$key] = null;
                }
            }
            
            // Set hospital_id if provided via route
            if ($hospitalId) {
                $input['hospital_id'] = $hospitalId;
            }
            
            $request->merge($input);
            
            // ----------------------------
            // 1. VALIDATION
            // ----------------------------
            $rules = [
                'appointment_type' => 'required|in:urgent,regular',
                'appointment_date' => 'required|date',
                'hospital_id'      => 'required|exists:hospitals,id',
                'gap_hours'        => 'required|numeric|min:0|max:4',
            ];

            // Conditional validation based on appointment type
            if ($request->appointment_type === 'regular') {
                $rules['appointment_date'] = 'required|date|after_or_equal:today';
                $rules['start_time'] = 'required|string|date_format:H:i';
                $rules['end_time'] = 'required|string|date_format:H:i';
                $rules['gap_hours'] = 'required|numeric|min:0.5|max:4';
                // Make urgent fields nullable for regular appointments
                $rules['due_date'] = 'nullable|date';
                $rules['due_time'] = 'nullable|date_format:H:i';
                $rules['blood_type'] = 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-';
            } else {
                // Urgent fields - appointment_date validation handled in code logic below
                $rules['due_date'] = 'required_if:appointment_type,urgent|date';
                $rules['due_time'] = 'required_if:appointment_type,urgent|date_format:H:i';
                $rules['blood_type'] = 'required_if:appointment_type,urgent|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-';
               
                if ($request->has('start_time')) {
                    $request->request->remove('start_time');
                }
                if ($request->has('end_time')) {
                    $request->request->remove('end_time');
                }
            }
            
            // Validate first to get clean data
            $validated = $request->validate($rules);
            
            // Custom validation for end_time after start_time (only for regular)
            if ($validated['appointment_type'] === 'regular' && 
                !empty($validated['start_time']) && 
                !empty($validated['end_time'])) {
                $startTime = Carbon::createFromFormat('H:i', $validated['start_time']);
                $endTime = Carbon::createFromFormat('H:i', $validated['end_time']);
                
                if ($endTime->lte($startTime)) {
                    throw ValidationException::withMessages([
                        'end_time' => ['The end time must be after start time.']
                    ]);
                }
            }

        $timezone = config('app.timezone', 'UTC');

        // ----------------------------
        // 2. STATIC VALUES
        // ----------------------------
        $hospital = Hospital::find($validated['hospital_id']);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $today = Carbon::now($timezone);
        $appointmentDate = Carbon::parse($validated['appointment_date'], $timezone)->startOfDay();

        // ----------------------------
        // 3. URGENT LOGIC (24-hour window, today only)
        // ----------------------------
        if ($validated['appointment_type'] === 'urgent') {
            // Always treat incoming due date/time as LOCAL USER TIME
            $now = Carbon::now();
            $today = Carbon::today();

            // Parse due datetime WITHOUT forcing timezone
            $dueDateTime = Carbon::createFromFormat(
                'Y-m-d H:i',
                $validated['due_date'] . ' ' . $validated['due_time']
            );

            // Rule 1: due date must be today
            if (!$dueDateTime->isSameDay($today)) {
                return response()->json([
                    'message' => 'Urgent appointments can only be scheduled for today.'
                ], 422);
            }

            // Rule 2: must be in the future
            if ($dueDateTime->lessThanOrEqualTo($now)) {
                return response()->json([
                    'message' => 'Urgent due time must be after the current time.'
                ], 422);
            }

            // Rule 3: must be within 24 hours
            if ($dueDateTime->greaterThan($now->copy()->addHours(24))) {
                return response()->json([
                    'message' => 'Urgent appointment must be within 24 hours from now.'
                ], 422);
            }

            // Start time = now
            $startTime = $now;

            // Generate slots
            $timeSlots = $this->generateUrgentTimeSlots(
                $startTime,
                $dueDateTime,
                $validated['gap_hours']
            );

            // Appointment date = today (always)
            $appointmentDate = $today;
        }
        
        
        // ----------------------------
        // 4. REGULAR LOGIC
        // ----------------------------
        else {
            // For regular appointments, validate that appointment_date is in the future
            if ($appointmentDate->lessThan($today->copy()->startOfDay())) {
                return response()->json([
                    'message' => 'Regular appointment date must be today or in the future.'
                ], 422);
            }
            
            $startTime = $validated['start_time'];
            $endTime   = $validated['end_time'];

            $timeSlots = $this->generateRegularTimeSlots(
                $validated['start_time'],
                $validated['end_time'],
                $validated['gap_hours']
            );
        }

        // ----------------------------
        // 5. BUILD APPOINTMENT DATA
        // ----------------------------
        $appointmentData = [
            'appointment_date' => $appointmentDate->toDateString(),
            'appointment_type' => $validated['appointment_type'],
            'time_slots'       => $timeSlots,
            'hospital_id'      => $validated['hospital_id'],
            'donation_type'    => 'Hospital Blood Donation',
            'state'            => 'pending',
        ];

        if ($validated['appointment_type'] === 'urgent') {
            $appointmentData['due_date'] = $validated['due_date'];
            $appointmentData['due_time'] = $validated['due_time'];
            $appointmentData['blood_type'] = $validated['blood_type'];
        }

            // ----------------------------
            // 6. SAVE
            // ----------------------------
            $appointment = Appointment::create($appointmentData);

            return response()->json([
                'message' => 'Hospital appointment created successfully.',
                'appointment' => $appointment->load('hospital')
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Re-throw validation exceptions to return proper 422 response
            throw $e;
        } catch (\Exception $e) {
            // Log the error and return a generic error message
            \Log::error('Error creating hospital appointment: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'An error occurred while creating the appointment.',
                'error' => config('app.debug') ? $e->getMessage() : 'Please check the server logs for details.'
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Appointment $appointment)
    {
        try {
            $validated = $request->validate([
                'appointment_date' => 'sometimes|date|after_or_equal:today',
                'appointment_time' => 'sometimes|string|date_format:H:i',
                'time_slots' => 'sometimes|array',
                'max_capacity' => 'sometimes|integer|min:1',
                'state' => 'sometimes|in:pending,completed,canceled',
            ]);

            // Update appointment fields
            if (isset($validated['appointment_date'])) {
                $appointment->appointment_date = $validated['appointment_date'];
            }
            if (isset($validated['appointment_time'])) {
                $appointment->appointment_time = $validated['appointment_time'];
            }
            if (isset($validated['time_slots'])) {
                $appointment->time_slots = $validated['time_slots'];
            }
            if (isset($validated['max_capacity'])) {
                $appointment->max_capacity = $validated['max_capacity'];
            }
            if (isset($validated['state'])) {
                $appointment->state = $validated['state'];
            }

            $appointment->save();
            $appointment->load('hospital');

            return response()->json([
                'message' => 'Appointment updated successfully',
                'appointment' => $appointment
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating appointment:', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to update appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update/remove a single time slot on an Appointment.
     * Expects:
     * - op: "update" | "remove"
     * - old_time: "HH:MM"
     * - new_time: "HH:MM" (required for update)
     */
    public function updateTimeSlot(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'op' => 'required|in:update,remove',
            'old_time' => 'required|string|date_format:H:i',
            'new_time' => 'required_if:op,update|nullable|string|date_format:H:i',
        ]);

        // Authorization: allow admin, or manager who owns the appointment hospital
        $user = $request->user();
        $role = strtolower((string)($user->role ?? ''));
        if ($role === 'manager') {
            if (!$user->relationLoaded('healthCenterManager')) {
                $user->load('healthCenterManager');
            }
            $managerHospitalId = $user->healthCenterManager->hospital_id ?? null;
            if (!$managerHospitalId || (int)$managerHospitalId !== (int)$appointment->hospital_id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } elseif (!in_array($role, ['admin', 'superadmin'], true) && $role !== 'administrator') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $oldTime = $validated['old_time'];
        $newTime = $validated['new_time'] ?? null;

        $timeSlots = $appointment->time_slots ?? [];
        if (!is_array($timeSlots)) {
            $timeSlots = [];
        }

        // Check bookings for this specific appointment/time (home + hospital bookings)
        $activeHomeBookings = HomeAppointment::where('appointment_id', $appointment->id)
            ->where('appointment_time', $oldTime)
            ->where('state', '!=', 'canceled')
            ->count();
        $activeHospitalBookings = HospitalAppointment::where('appointment_id', $appointment->id)
            ->where('appointment_time', $oldTime)
            ->where('state', '!=', 'canceled')
            ->count();
        $activeBookings = $activeHomeBookings + $activeHospitalBookings;

        if ($activeBookings > 0) {
            return response()->json([
                'message' => 'Cannot modify this time slot because it has active bookings.',
                'bookings_count' => $activeBookings,
            ], 422);
        }

        $op = $validated['op'];

        // Helper: slot start
        $slotStart = function ($slot) {
            if (is_string($slot)) return $slot;
            if (is_array($slot) && isset($slot['start'])) return $slot['start'];
            return null;
        };

        // Prevent duplicates on update
        if ($op === 'update' && $newTime) {
            foreach ($timeSlots as $slot) {
                $start = $slotStart($slot);
                if ($start === $newTime) {
                    return response()->json([
                        'message' => 'This time slot already exists.',
                    ], 422);
                }
            }
        }

        $found = false;
        $updated = [];

        foreach ($timeSlots as $slot) {
            if (is_string($slot)) {
                if ($slot === $oldTime) {
                    $found = true;
                    if ($op === 'remove') {
                        continue;
                    }
                    $updated[] = $newTime;
                    continue;
                }
                $updated[] = $slot;
                continue;
            }

            if (is_array($slot) && isset($slot['start'])) {
                if (($slot['start'] ?? null) === $oldTime) {
                    $found = true;
                    if ($op === 'remove') {
                        continue;
                    }

                    $newSlot = $slot;
                    $newSlot['start'] = $newTime;

                    // If slot has end, keep duration constant
                    if (!empty($slot['end'])) {
                        try {
                            $oldStart = Carbon::createFromFormat('H:i', $slot['start']);
                            $oldEnd = Carbon::createFromFormat('H:i', $slot['end']);
                            $diffMinutes = $oldStart->diffInMinutes($oldEnd, false);
                            if ($diffMinutes > 0) {
                                $newStart = Carbon::createFromFormat('H:i', $newTime);
                                $newEnd = $newStart->copy()->addMinutes($diffMinutes);
                                $newSlot['end'] = $newEnd->format('H:i');
                            }
                        } catch (\Exception $e) {
                            // If parsing fails, leave end as-is.
                        }
                    }

                    $updated[] = $newSlot;
                    continue;
                }
            }

            $updated[] = $slot;
        }

        if (!$found) {
            return response()->json([
                'message' => 'Time slot not found on this appointment.',
            ], 404);
        }

        $appointment->time_slots = array_values($updated);
        $appointment->save();

        return response()->json([
            'message' => $op === 'remove' ? 'Time slot removed.' : 'Time slot updated.',
            'appointment' => $appointment,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Appointment $appointment)
    {
        try {
            $user = $request->user();
            $role = strtolower((string)($user->role ?? ''));
            if ($role === 'manager') {
                if (!$user->relationLoaded('healthCenterManager')) {
                    $user->load('healthCenterManager');
                }
                $managerHospitalId = $user->healthCenterManager->hospital_id ?? null;
                if (!$managerHospitalId || (int)$managerHospitalId !== (int)$appointment->hospital_id) {
                    return response()->json(['message' => 'Forbidden'], 403);
                }
            } elseif (!in_array($role, ['admin', 'superadmin', 'administrator'], true)) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            // Check if there are any home appointments linked to this appointment
            $homeAppointmentsCount = \App\Models\HomeAppointment::where('appointment_id', $appointment->id)
                ->where('state', '!=', 'canceled')
                ->count();
            
            if ($homeAppointmentsCount > 0) {
                return response()->json([
                    'message' => 'Cannot delete appointment. There are active bookings associated with this appointment.',
                    'bookings_count' => $homeAppointmentsCount
                ], 422);
            }
            
            // Delete the appointment
            $appointment->delete();
            
            return response()->json([
                'message' => 'Appointment deleted successfully',
                'appointment_id' => $appointment->id
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error deleting appointment:', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to delete appointment: ' . $e->getMessage()
            ], 500);
        }
    }
}
