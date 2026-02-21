<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Hospital;
use App\Models\Donor;
use App\Models\BloodType;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HospitalAppointmentManagementController extends Controller
{
    /**
     * Display a listing of appointments for a hospital
     */
    public function index(Request $request, $hospitalId = null)
    {
        $hospitalId = $hospitalId ?? $request->input('hospital_id');
        
        $query = Appointment::where('hospital_id', $hospitalId)
            ->with('hospital')
            ->orderBy('appointment_date', 'desc');

        // Filters
        if ($request->has('donation_type')) {
            $query->where('donation_type', $request->donation_type);
        }

        if ($request->has('appointment_type')) {
            $query->where('appointment_type', $request->appointment_type);
        }

        if ($request->has('state')) {
            $query->where('state', $request->state);
        }

        if ($request->has('date_from')) {
            $query->where('appointment_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('appointment_date', '<=', $request->date_to);
        }

        $appointments = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'appointments' => $appointments->items(),
            'total' => $appointments->total(),
            'current_page' => $appointments->currentPage(),
            'per_page' => $appointments->perPage(),
        ], 200);
    }

    /**
     * Store a newly created appointment
     */
    public function store(Request $request)
    {
        // Get hospital ID from authenticated hospital manager
        $user = $request->user();
        $hospitalId = null;
        
        if ($user && $user->role === 'Manager' && $user->healthCenterManager) {
            $hospitalId = $user->healthCenterManager->hospital_id;
        }
        
        if (!$hospitalId) {
            return response()->json([
                'message' => 'Hospital ID not found. Please ensure you are logged in as a hospital manager.',
            ], 403);
        }

        $rules = [
            'appointment_type' => 'required|in:urgent,regular',
            'donation_type' => 'required|in:blood,platelets,organ,Home Blood Donation,Hospital Blood Donation,Alive Organ Donation',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'gap_hours' => 'nullable|numeric|min:0.5',
            'max_capacity' => 'nullable|integer|min:1',
        ];
        
        // Conditional validation based on appointment type
        if ($request->appointment_type === 'regular') {
            $rules['appointment_date'] = 'required|date|after_or_equal:today';
            $rules['due_date'] = 'nullable|date';
            $rules['due_time'] = 'nullable|date_format:H:i';
            $rules['blood_type'] = 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-';
        } else {
            // For urgent appointments, appointment_date will be set to today automatically
            $rules['appointment_date'] = 'nullable|date'; // Will be overridden to today
            $rules['due_date'] = 'required_if:appointment_type,urgent|date';
            $rules['due_time'] = 'required_if:appointment_type,urgent|date_format:H:i';
            $rules['blood_type'] = 'required_if:appointment_type,urgent|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-';
        }
        
        $validated = $request->validate($rules);
        
        // Add hospital_id to validated data
        $validated['hospital_id'] = $hospitalId;
        
        // Custom validation: Check that end_time is after start_time (for time values)
        if (!empty($validated['start_time']) && !empty($validated['end_time'])) {
            // Parse times using createFromFormat to ensure proper time-only parsing
            $startTime = Carbon::createFromFormat('H:i', $validated['start_time']);
            $endTime = Carbon::createFromFormat('H:i', $validated['end_time']);
            
            // Compare times directly
            if ($endTime->lte($startTime)) {
                return response()->json([
                    'message' => 'The end time must be after start time.',
                    'errors' => [
                        'end_time' => ['The end time must be after start time.']
                    ]
                ], 422);
            }
        }

        // Validate urgent appointment constraints
        if ($validated['appointment_type'] === 'urgent') {
            $today = Carbon::today();
            
            // Rule 1: due date must be today
            if (!empty($validated['due_date'])) {
                $dueDate = Carbon::parse($validated['due_date']);
                if (!$dueDate->isSameDay($today)) {
                    return response()->json([
                        'message' => 'Urgent appointments can only be scheduled for today.',
                        'errors' => [
                            'due_date' => ['Urgent appointments can only be scheduled for today.']
                        ]
                    ], 422);
                }
                
                // Rule 2: due datetime must be within 24 hours
                if (!empty($validated['due_time'])) {
                    $dueDateTime = Carbon::createFromFormat(
                        'Y-m-d H:i',
                        $validated['due_date'] . ' ' . $validated['due_time']
                    );
                    $now = Carbon::now();
                    
                    if ($dueDateTime->lessThanOrEqualTo($now)) {
                        return response()->json([
                            'message' => 'Urgent due time must be after the current time.',
                            'errors' => [
                                'due_time' => ['Urgent due time must be after the current time.']
                            ]
                        ], 422);
                    }
                    
                    if ($dueDateTime->greaterThan($now->copy()->addHours(24))) {
                        return response()->json([
                            'message' => 'Urgent appointment must be within 24 hours from now.',
                            'errors' => [
                                'due_time' => ['Urgent appointment must be within 24 hours from now.']
                            ]
                        ], 422);
                    }
                }
            }
        }

        $appointmentData = [
            'hospital_id' => $validated['hospital_id'],
            'appointment_date' => $validated['appointment_type'] === 'urgent' ? Carbon::today()->toDateString() : $validated['appointment_date'],
            'appointment_type' => $validated['appointment_type'],
            'donation_type' => $validated['donation_type'],
            'state' => 'pending',
            'max_capacity' => $validated['max_capacity'] ?? null,
        ];

        // Generate time slots if provided
        if (!empty($validated['start_time']) && !empty($validated['end_time']) && !empty($validated['gap_hours'])) {
            $timeSlots = $this->generateTimeSlots(
                $validated['start_time'],
                $validated['end_time'],
                $validated['gap_hours']
            );
            $appointmentData['time_slots'] = $timeSlots;
        }

        // Add urgent fields if urgent
        if ($validated['appointment_type'] === 'urgent') {
            $appointmentData['due_date'] = $validated['due_date'];
            $appointmentData['due_time'] = $validated['due_time'];
            $appointmentData['blood_type'] = $validated['blood_type'] ?? null;
        }

        $appointment = Appointment::create($appointmentData);

        return response()->json([
            'message' => 'Appointment created successfully',
            'appointment' => $appointment->load('hospital'),
        ], 201);
    }

    /**
     * Display the specified appointment
     */
    public function show($id)
    {
        $appointment = Appointment::with('hospital')->findOrFail($id);
        return response()->json(['appointment' => $appointment], 200);
    }

    /**
     * Update the specified appointment
     */
    public function update(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'appointment_date' => 'sometimes|required|date',
            'appointment_type' => 'sometimes|required|in:urgent,regular',
            'donation_type' => 'sometimes|required|in:blood,platelets,organ,Home Blood Donation,Hospital Blood Donation,Alive Organ Donation',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'gap_hours' => 'nullable|numeric|min:0.5',
            'max_capacity' => 'nullable|integer|min:1',
            'state' => 'sometimes|required|in:pending,completed,canceled',
            'due_date' => 'nullable|date',
            'due_time' => 'nullable|date_format:H:i',
            'blood_type' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);
        
        // Custom validation: Check that end_time is after start_time (for time values)
        if (!empty($validated['start_time']) && !empty($validated['end_time'])) {
            // Parse times using createFromFormat to ensure proper time-only parsing
            $startTime = Carbon::createFromFormat('H:i', $validated['start_time']);
            $endTime = Carbon::createFromFormat('H:i', $validated['end_time']);
            
            // Compare times directly
            if ($endTime->lte($startTime)) {
                return response()->json([
                    'message' => 'The end time must be after start time.',
                    'errors' => [
                        'end_time' => ['The end time must be after start time.']
                    ]
                ], 422);
            }
        }

        // Regenerate time slots if time fields are provided
        if (!empty($validated['start_time']) && !empty($validated['end_time']) && !empty($validated['gap_hours'])) {
            $validated['time_slots'] = $this->generateTimeSlots(
                $validated['start_time'],
                $validated['end_time'],
                $validated['gap_hours']
            );
        }

        $appointment->update($validated);

        return response()->json([
            'message' => 'Appointment updated successfully',
            'appointment' => $appointment->load('hospital'),
        ], 200);
    }

    /**
     * Remove the specified appointment
     */
    public function destroy($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();

        return response()->json(['message' => 'Appointment deleted successfully'], 200);
    }

    /**
     * Get urgent requests for hospital dashboard
     */
    public function getUrgentRequests(Request $request)
    {
        // Get hospital ID from authenticated user
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }
        
        $hospitalId = null;
        $userRole = strtolower($user->role ?? '');
        
        if ($userRole === 'manager') {
            // Load the healthCenterManager relationship if not already loaded
            if (!$user->relationLoaded('healthCenterManager')) {
                $user->load('healthCenterManager');
            }
            
            if ($user->healthCenterManager && $user->healthCenterManager->hospital_id) {
                $hospitalId = $user->healthCenterManager->hospital_id;
            }
        }
        
        // Fallback to request input if not found
        if (!$hospitalId) {
            $hospitalId = $request->input('hospital_id');
        }
        
        if (!$hospitalId) {
            \Log::warning('getUrgentRequests: Hospital ID not found', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'has_healthCenterManager' => $user->relationLoaded('healthCenterManager') ? 'loaded' : 'not_loaded',
                'healthCenterManager' => $user->healthCenterManager ? $user->healthCenterManager->toArray() : null,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Hospital ID not found. Please ensure you are logged in as a hospital manager.',
            ], 403);
        }

        // Get urgent appointments with their bookings and donors
        $urgentAppointments = Appointment::where('hospital_id', $hospitalId)
            ->where('appointment_type', 'urgent')
            ->where('state', 'pending')
            ->whereNotNull('due_date')
            ->whereNotNull('due_time')
            ->whereNotNull('blood_type')
            ->with([
                'homeAppointments.donor.user',
                'homeAppointments.donor.bloodType',
                'hospitalAppointments.donor.user',
                'hospitalAppointments.donor.bloodType',
                'hospital'
            ])
            ->orderBy('due_date', 'asc')
            ->orderBy('due_time', 'asc')
            ->get();

        $urgentRequests = $urgentAppointments->map(function ($appointment) {
            // Calculate time remaining
            $dueDateTime = Carbon::parse($appointment->due_date . ' ' . $appointment->due_time);
            $now = Carbon::now();
            $diffInMinutes = $now->diffInMinutes($dueDateTime, false);
            $hoursRemaining = floor(abs($diffInMinutes) / 60);
            $minutesRemaining = abs($diffInMinutes) % 60;
            
            $timeRemainingFormatted = 'Expired';
            if ($diffInMinutes > 0) {
                $timeRemainingFormatted = "{$hoursRemaining}h {$minutesRemaining}m";
            }
            
            // Determine urgency level
            $urgency = 'low';
            if ($diffInMinutes <= 0) {
                $urgency = 'expired';
            } elseif ($diffInMinutes <= 6 * 60) { // 6 hours
                $urgency = 'critical';
            } elseif ($diffInMinutes <= 24 * 60) { // 24 hours
                $urgency = 'high';
            }
            
            // Collect all registered donors from home and hospital appointments
            $registeredDonors = collect();
            
            // Get donors from home appointments
            foreach ($appointment->homeAppointments as $homeAppointment) {
                if ($homeAppointment->donor) {
                    $registeredDonors->push([
                        'id' => $homeAppointment->donor->id,
                        'code' => $homeAppointment->donor->code,
                        'name' => $homeAppointment->donor->user ? 
                            ($homeAppointment->donor->user->first_name . ' ' . $homeAppointment->donor->user->last_name) : 'N/A',
                        'phone' => $homeAppointment->donor->user->phone_nb ?? 'N/A',
                        'email' => $homeAppointment->donor->user->email ?? 'N/A',
                        'bloodType' => $homeAppointment->donor->bloodType ? 
                            ($homeAppointment->donor->bloodType->type . $homeAppointment->donor->bloodType->rh_factor) : 'N/A',
                        'appointmentType' => 'home',
                        'appointmentTime' => $homeAppointment->appointment_time,
                        'state' => $homeAppointment->state,
                        'bookingCode' => $homeAppointment->code,
                    ]);
                }
            }
            
            // Get donors from hospital appointments
            foreach ($appointment->hospitalAppointments as $hospitalAppointment) {
                if ($hospitalAppointment->donor) {
                    $registeredDonors->push([
                        'id' => $hospitalAppointment->donor->id,
                        'code' => $hospitalAppointment->donor->code,
                        'name' => $hospitalAppointment->donor->user ? 
                            ($hospitalAppointment->donor->user->first_name . ' ' . $hospitalAppointment->donor->user->last_name) : 'N/A',
                        'phone' => $hospitalAppointment->donor->user->phone_nb ?? 'N/A',
                        'email' => $hospitalAppointment->donor->user->email ?? 'N/A',
                        'bloodType' => $hospitalAppointment->donor->bloodType ? 
                            ($hospitalAppointment->donor->bloodType->type . $hospitalAppointment->donor->bloodType->rh_factor) : 'N/A',
                        'appointmentType' => 'hospital',
                        'appointmentTime' => $hospitalAppointment->appointment_time,
                        'state' => $hospitalAppointment->state,
                        'bookingCode' => $hospitalAppointment->code,
                    ]);
                }
            }
            
            return [
                'id' => $appointment->id,
                'code' => $appointment->code,
                'requestTime' => $appointment->created_at->toISOString(),
                'bloodType' => $appointment->blood_type,
                'donation_type' => $appointment->donation_type, // Add donation_type to determine Home/Hospital
                'dueDateTime' => $dueDateTime->toISOString(),
                'dueDate' => $appointment->due_date,
                'dueTime' => $appointment->due_time,
                'timeRemaining' => $timeRemainingFormatted,
                'hoursRemaining' => $diffInMinutes > 0 ? $hoursRemaining : 0,
                'minutesRemaining' => $diffInMinutes > 0 ? $minutesRemaining : 0,
                'urgency' => $urgency,
                'registeredDonors' => $registeredDonors->values()->all(),
                'registeredDonorCount' => $registeredDonors->count(),
                'hospitalName' => $appointment->hospital->name ?? 'N/A',
            ];
        });

        return response()->json([
            'success' => true,
            'urgent_requests' => $urgentRequests,
            'total' => $urgentRequests->count(),
        ], 200);
    }

    /**
     * Generate time slots
     */
    private function generateTimeSlots($start, $end, $gap)
    {
        $timeslots = [];
        $gap = (float) $gap;
        // Parse times using createFromFormat to ensure proper time-only parsing
        $start_time = Carbon::createFromFormat('H:i', $start);
        $end_time = Carbon::createFromFormat('H:i', $end);

        while ($start_time->lessThan($end_time)) {
            $timeslots[] = $start_time->format('H:i');
            $start_time->addHours($gap);
        }

        return $timeslots;
    }
}
