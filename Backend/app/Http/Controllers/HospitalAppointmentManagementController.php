<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Hospital;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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
        $validated = $request->validate([
            'hospital_id' => 'required|exists:hospitals,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_type' => 'required|in:urgent,regular',
            'donation_type' => 'required|in:blood,platelets,organ,Home Blood Donation,Hospital Blood Donation,Alive Organ Donation',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'gap_hours' => 'nullable|numeric|min:0.5',
            'max_capacity' => 'nullable|integer|min:1',
            'due_date' => 'nullable|date|required_if:appointment_type,urgent|after_or_equal:appointment_date',
            'due_time' => 'nullable|date_format:H:i|required_if:appointment_type,urgent',
            'blood_type' => 'nullable|string|required_if:appointment_type,urgent|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
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

        $appointmentData = [
            'hospital_id' => $validated['hospital_id'],
            'appointment_date' => $validated['appointment_date'],
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
