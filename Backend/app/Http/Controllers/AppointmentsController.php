<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Hospital;
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
        // Cast gapHours to float to ensure it's numeric
        $gapHours = (float) $gapHours;

        while ($start->lessThan($end)) {
            $slotEnd = $start->copy()->addHours($gapHours);

            if ($slotEnd->greaterThan($end)) {
                break;
            }

            $slots[] = [
                'start' => $start->format('H:i'),
                'end'   => $slotEnd->format('H:i'),
                'date'  => $start->toDateString(),
                'is_available' => true
            ];

            $start->addHours($gapHours);
        }

        return $slots;
    }

    public function createHomeAppointments(Request $request)
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
                'appointment_date' => 'required|date|after_or_equal:today',
                'hospital_id'      => 'required|exists:hospitals,id',
                'gap_hours'        => 'required|numeric|min:0|max:4',
            ];

            // Conditional validation based on appointment type
            if ($request->appointment_type === 'regular') {
                $rules['start_time'] = 'required|string|date_format:H:i';
                $rules['end_time'] = 'required|string|date_format:H:i';
                $rules['gap_hours'] = 'required|numeric|min:0.5|max:4';
                // Make urgent fields nullable for regular appointments
                $rules['due_date'] = 'nullable|date';
                $rules['due_time'] = 'nullable|date_format:H:i';
                $rules['blood_type'] = 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-';
            } else {
                // Urgent fields
                $rules['due_date'] = 'required_if:appointment_type,urgent|date';
                $rules['due_time'] = 'required_if:appointment_type,urgent|date_format:H:i';
                $rules['blood_type'] = 'required_if:appointment_type,urgent|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-';
                // For urgent appointments, don't validate start_time and end_time
                // Remove them from request if they exist to avoid validation issues
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

            $validated = $request->validate($rules);

        $timezone = config('app.timezone', 'UTC');

        // ----------------------------
        // 2. STATIC VALUES
        // ----------------------------
        $hospital = Hospital::find($validated['hospital_id']);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $today = Carbon::now($timezone);
        $appointmentDate = Carbon::parse($validated['appointment_date'], $timezone);

        // ----------------------------
        // 3. URGENT LOGIC (24-hour window)
        // ----------------------------
        if ($validated['appointment_type'] === 'urgent') {

            $dueDate = Carbon::parse($validated['due_date'], $timezone)->startOfDay();
            $dueDateTime = Carbon::parse($validated['due_date'] . ' ' . $validated['due_time'], $timezone);

            // Rule: urgent must start today
            if (!$appointmentDate->isSameDay($today)) {
                return response()->json([
                    'message' => 'Urgent appointments must start today.'
                ], 422);
            }

            // Rule: due date must be today or tomorrow
            if (!($dueDate->isSameDay($today) || $dueDate->isSameDay($today->copy()->addDay()))) {
                return response()->json([
                    'message' => 'Urgent appointments can only last until today or tomorrow.'
                ], 422);
            }

            // Rule: due_time MUST be after now
            if ($dueDateTime->lessThanOrEqualTo($today)) {
                return response()->json([
                    'message' => 'Due time must be after the current time.'
                ], 422);
            }

            // Rule: cannot exceed 24 hours from now
            if ($dueDateTime->greaterThan($today->copy()->addHours(24))) {
                return response()->json([
                    'message' => 'Urgent appointment cannot exceed a 24-hour window.'
                ], 422);
            }

            // FOR URGENT: start time = now
            $startTime = $today->format('H:i');
            $endTime   = $validated['due_time'];

            // Generate time slots for URGENT
            $timeSlots = $this->generateUrgentTimeSlots($today, $dueDateTime, $validated['gap_hours']);
        } 
        
        // ----------------------------
        // 4. REGULAR LOGIC
        // ----------------------------
        else {
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
    public function show(Appointment $appointments)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Appointment $appointments)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Appointment $appointments)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Appointment $appointments)
    {
        //
    }
}
