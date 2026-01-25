<?php

namespace App\Http\Controllers;

use App\Models\HomeAppointment;
use App\Models\Appointment;
use App\Models\Hospital;
use App\Models\User;
use App\Models\Donor;
use App\Models\BloodType;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Home_Appointment;
use Illuminate\Support\Facades\Mail;
use App\Mail\HomeDonationRegistered;

class HomeAppointmentController extends Controller
{
    /**
     * Display a listing of hospitals with available home appointments.
     */
    public function index()
    {
        try {
            $today = now()->toDateString();
            
            // Log for debugging
            \Log::info('Fetching hospitals for home donation', [
                'today' => $today,
                'total_appointments' => Appointment::where('donation_type', 'Home Blood Donation')->count(),
                'pending_appointments' => Appointment::where('donation_type', 'Home Blood Donation')->where('state', 'pending')->count(),
                'future_appointments' => Appointment::where('donation_type', 'Home Blood Donation')
                    ->where('state', 'pending')
                    ->whereDate('appointment_date', '>=', $today)
                    ->count()
            ]);
            
            // Get hospitals that have appointments with donation_type = 'Home Blood Donation'
            $hospitals = Hospital::query()
            ->select(['id','name','address','phone_nb','email','code','created_at'])
            ->whereHas('appointments', function($query) use ($today) {
                $query->where('donation_type', 'Home Blood Donation')
                      ->where('state', 'pending')
                      ->whereDate('appointment_date', '>=', $today);
            })
            ->with(['appointments' => function($query) use ($today) {
                $query->where('donation_type', 'Home Blood Donation')
                      ->where('state', 'pending')
                      ->whereDate('appointment_date', '>=', $today)
                      ->orderBy('appointment_date', 'asc');
            }])
            ->orderBy('created_at', 'desc')
            ->get();
        } catch (\Exception $e) {
            \Log::error('Error fetching hospitals for home donation:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'hospitals' => [],
                'urgent_hospitals' => [],
                'regular_hospitals' => [],
                'total' => 0,
                'error' => 'Failed to fetch hospitals: ' . $e->getMessage()
            ], 500);
        }

        // Build a lookup of current bookings per appointment/time (pending only)
        $appointmentIds = $hospitals->flatMap(function ($h) {
            return $h->appointments->pluck('id');
        })->values();

        $bookedAppointments = HomeAppointment::whereIn('appointment_id', $appointmentIds)
            ->where('state', 'pending')
            ->select('appointment_id', 'appointment_time')
            ->get()
            ->groupBy('appointment_id')
            ->map(function ($group) {
                return $group->groupBy('appointment_time')->map->count();
            });

        // Calculate remaining available slots for each hospital (urgent + regular)
        $hospitalsWithSlots = $hospitals->map(function($hospital) use ($bookedAppointments) {
            $totalAvailableSlots = 0;
            $urgentAvailableSlots = 0;
            $regularAvailableSlots = 0;
            $hasUrgent = false;
            $hasRegular = false;
            $urgentDueDate = null;
            $urgentDueTime = null;
            $urgentBloodType = null;

            foreach ($hospital->appointments as $appointment) {
                $slots = $appointment->time_slots ?? [];
                $maxCapacity = $appointment->max_capacity ?? null;

                foreach ($slots as $slot) {
                    // Extract start time key for booking lookup
                    $timeKey = '';
                    if (is_array($slot) || is_object($slot)) {
                        $slotArray = (array) $slot;
                        $timeKey = $slotArray['start'] ?? '';
                        if (!$timeKey && isset($slotArray['time'])) {
                            $timeKey = (string) $slotArray['time'];
                        }
                    } else {
                        $timeKey = (string) $slot;
                    }
                    if (!$timeKey) continue;
                    // If timeKey is "09:00 - 10:00" use the start as key
                    if (str_contains($timeKey, ' - ')) {
                        $timeKey = trim(explode(' - ', $timeKey)[0]);
                    }

                    $currentBookings = $bookedAppointments[$appointment->id][$timeKey] ?? 0;
                    $isBooked = false;
                    if ($maxCapacity !== null) {
                        $isBooked = $currentBookings >= $maxCapacity;
                    } else {
                        $isBooked = $currentBookings > 0;
                    }

                    if ($isBooked) {
                        continue;
                    }

                    // Slot is available
                    $totalAvailableSlots++;

                    if ($appointment->appointment_type === 'urgent' && !empty($appointment->due_date)) {
                        $hasUrgent = true;
                        $urgentAvailableSlots++;

                        // Track earliest urgent due date/time
                        try {
                            $appointmentDueDate = Carbon::parse($appointment->due_date);
                            if (!$urgentDueDate) {
                                $urgentDueDate = $appointment->due_date;
                                $urgentDueTime = $appointment->due_time ?? null;
                                $urgentBloodType = $appointment->blood_type ?? null;
                            } else {
                                $currentUrgentDueDate = Carbon::parse($urgentDueDate);
                                if ($appointmentDueDate->lessThan($currentUrgentDueDate)) {
                                    $urgentDueDate = $appointment->due_date;
                                    $urgentDueTime = $appointment->due_time ?? null;
                                    $urgentBloodType = $appointment->blood_type ?? null;
                                }
                            }
                        } catch (\Exception $e) {
                            \Log::warning('Invalid due_date format for appointment: ' . $appointment->id);
                        }
                    }

                    if ($appointment->appointment_type === 'regular') {
                        $hasRegular = true;
                        $regularAvailableSlots++;
                    }
                }
            }

            $hospitalArray = $hospital->toArray();
            $hospitalArray['available_slots'] = $totalAvailableSlots;
            $hospitalArray['urgent_slots'] = $urgentAvailableSlots;
            $hospitalArray['regular_slots'] = $regularAvailableSlots;
            $hospitalArray['has_urgent'] = $hasUrgent;
            $hospitalArray['has_regular'] = $hasRegular;
            if ($hasUrgent) {
                $hospitalArray['urgent_due_date'] = $urgentDueDate;
                $hospitalArray['urgent_due_time'] = $urgentDueTime;
                $hospitalArray['blood_type_needed'] = $urgentBloodType;
            } else {
                $hospitalArray['blood_type_needed'] = null;
            }
            unset($hospitalArray['appointments']);
            return $hospitalArray;
        });

                // Separate urgent and regular hospitals
                // A hospital can appear in BOTH lists if it has both urgent and regular appointments
                $urgentHospitals = $hospitalsWithSlots->filter(function($hospital) {
                    return $hospital['has_urgent'] === true;
                })->values();

                $regularHospitals = $hospitalsWithSlots->filter(function($hospital) {
                    return $hospital['has_regular'] === true;
                })->values();

        return response()->json([
            'hospitals' => $hospitalsWithSlots,
            'urgent_hospitals' => $urgentHospitals,
            'regular_hospitals' => $regularHospitals,
            'total' => $hospitals->count()
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
     
        try {
            $validated = $request->validate([
                // Donor information
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email',
                'phone_nb' => 'required|string|max:30',
                'gender' => 'required|in:male,female',
                'blood_type' => 'required|string',
                'date_of_birth' => 'required|date|before:today',
                // Appointment information
                'hospital_id' => 'required|exists:hospitals,id',
                'appointment_date' => 'required|date',
                'appointment_time' => 'required|string',
                // Home appointment specific
                'address' => 'required|string',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'weight' => 'required|string',
                'emerg_contact' => 'nullable|string|max:255',
                'emerg_phone' => 'nullable|string|max:30',
                'medical_conditions' => 'nullable|array',
                'last_donation' => 'nullable|date|before_or_equal:today',
                'note' => 'nullable|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
         
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }

        // Validate blood type format before starting transaction
        $bloodTypeString = $validated['blood_type'];
        $bloodTypePattern = '/^(A|B|AB|O)([+-])$/';
        if (!preg_match($bloodTypePattern, $bloodTypeString, $matches)) {
            return response()->json(['message' => 'Invalid blood type format. Expected format: A+, B-, AB+, O+, etc.'], 422);
        }
        
        $type = $matches[1]; // A, B, AB, or O
        $rhFactor = $matches[2]; // + or -
        
        // Get blood type ID
        $bloodType = BloodType::where('type', $type)
            ->where('rh_factor', $rhFactor)
            ->first();
            
        if (!$bloodType) {
            return response()->json(['message' => 'Blood type not found in database'], 422);
        }

        try {
            DB::beginTransaction();

            // Check if user exists by email
            $user = User::where('email', $validated['email'])->first();
            
            if (!$user) {
                // Create new user
                $user = User::create([
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'phone_nb' => $validated['phone_nb'],
                    'email' => $validated['email'],
                    'role' => 'Donor',
                    'password' => Hash::make(Str::random(16)), 
                ]);
            } else {
                // Update existing user info (but check phone_nb uniqueness if changed)
                $phoneChanged = $user->phone_nb !== $validated['phone_nb'];
                
                if ($phoneChanged && User::where('phone_nb', $validated['phone_nb'])->where('id', '!=', $user->id)->exists()) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Phone number is already registered to another user'
                    ], 422);
                }
                
                // Update user info
                $user->update([
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'phone_nb' => $validated['phone_nb'],
                ]);
            }

            // Get or create Donor
            $donor = Donor::where('user_id', $user->id)->first();
            
            if (!$donor) {
                // Create new donor
                $donor = Donor::create([
                    'user_id' => $user->id,
                    'gender' => $validated['gender'],
                    'date_of_birth' => $validated['date_of_birth'],
                    'blood_type_id' => $bloodType->id,
                    'last_donation' => $validated['last_donation'] ?? null,
                ]);
            } else {
                // Update existing donor info
                $donor->update([
                    'gender' => $validated['gender'],
                    'date_of_birth' => $validated['date_of_birth'],
                    'blood_type_id' => $bloodType->id,
                    'last_donation' => $validated['last_donation'] ?? null,
                ]);
            }

            // Find the appointment based on hospital_id, date, donation_type, and time
            $appointments = Appointment::where('hospital_id', $validated['hospital_id'])
                ->where('appointment_date', $validated['appointment_date'])
                ->where('donation_type', 'Home Blood Donation')
                ->where('state', 'pending')
                ->get();

            // Extract start time from appointment_time (handle "09:00 - 10:00" or "09:00" formats)
            $requestedTime = $validated['appointment_time'];
            $requestedStartTime = $requestedTime;
            if (strpos($requestedTime, ' - ') !== false) {
                $requestedStartTime = trim(explode(' - ', $requestedTime)[0]);
            }
            
            // Find appointment that has the selected time in its time_slots
            $appointment = null;
            foreach ($appointments as $apt) {
                $timeSlots = $apt->time_slots ?? [];
                
                // Check if the selected time matches any slot (handle both object and string formats)
                foreach ($timeSlots as $slot) {
                    $slotStart = '';
                    $slotTimeDisplay = '';
                    
                    if (is_array($slot) || is_object($slot)) {
                        // Handle object format: {start: "09:00", end: "10:00"}
                        $slotArray = (array) $slot;
                        $slotStart = $slotArray['start'] ?? '';
                        $slotEnd = $slotArray['end'] ?? '';
                        $slotTimeDisplay = $slotStart . ($slotEnd ? ' - ' . $slotEnd : '');
                    } else {
                        // Handle string format (fallback)
                        $slotTimeDisplay = (string) $slot;
                        $slotStart = $slotTimeDisplay;
                    }
                    
                    // Match if the requested time matches the slot display or start time
                    if ($requestedTime === $slotTimeDisplay || 
                        $requestedTime === $slotStart ||
                        $requestedStartTime === $slotStart) {
                        $appointment = $apt;
                        break 2; // Break out of both loops
                    }
                }
            }

            if (!$appointment) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Appointment slot not found or already booked'
                ], 404);
            }

            // Validate urgent appointment constraints
            if ($appointment->appointment_type === 'urgent') {
                $appointmentDate = Carbon::parse($appointment->appointment_date);
                $today = Carbon::today();
                
                // Check if appointment date is today
                if (!$appointmentDate->isSameDay($today)) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Urgent appointments can only be scheduled for today'
                    ], 422);
                }
                
                // Check if appointment time is within 24 hours
                $appointmentDateTime = Carbon::parse($appointment->appointment_date . ' ' . $requestedStartTime);
                $now = Carbon::now();
                $hoursDiff = $now->diffInHours($appointmentDateTime, false);
                
                if ($hoursDiff <= 0) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Urgent appointment time must be in the future'
                    ], 422);
                }
                
                if ($hoursDiff > 24) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Urgent appointments can only be scheduled within 24 hours from now'
                    ], 422);
                }
            }

            // Use the extracted start time for storing
            // Create Home Appointment
            $homeAppointmentData = [
                'donor_id' => $donor->id,
                'hospital_id' => $validated['hospital_id'],
                'appointment_id' => $appointment->id,
                'appointment_time' => $requestedStartTime,
                'weight(kg)' => $validated['weight'],
                'address' => $validated['address'],
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'emerg_contact' => $validated['emerg_contact'] ?? null,
                'emerg_phone' => $validated['emerg_phone'] ?? null,
                'medical_conditions' => $validated['medical_conditions'] ?? null,
                'note' => $validated['note'] ?? null,
                'state' => 'pending',
            ];
            
            // Only set phlebotomist_id if it's nullable (will be assigned later by admin)
            // Check if column allows null before attempting to set it
            $homeAppointment = HomeAppointment::create($homeAppointmentData);

            try {
                $donor->loadMissing(['user', 'bloodType']);
                $homeAppointment->loadMissing(['hospital', 'appointment']);

                $recipientEmail = $donor->user->email ?? null;
                if ($recipientEmail) {
                    Mail::to($recipientEmail)->send(new HomeDonationRegistered($donor, $homeAppointment));
                } else {
                    \Log::warning('Skipping home donation registered email: donor user email is missing.', [
                        'donor_id' => $donor->id ?? null,
                        'donor_code' => $donor->code ?? null,
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to send home donation registered email:', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Home appointment created successfully',
                'home_appointment' => $homeAppointment,
                'donor' => $donor->load('user')
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            \Log::error('Database error creating home appointment:', [
                'error' => $e->getMessage(),
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request_data' => $request->all()
            ]);
            
            $errorMessage = config('app.debug') 
                ? $e->getMessage() . ' | SQL: ' . $e->getSql()
                : 'Database error occurred. Please check the logs.';
            
            return response()->json([
                'message' => 'Failed to create home appointment',
                'error' => $errorMessage,
                'type' => 'database_error'
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating home appointment:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request_data' => $request->all()
            ]);
            
            // Return more detailed error in development
            $errorMessage = config('app.debug') 
                ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine()
                : 'Failed to create home appointment. Please try again.';
            
            return response()->json([
                'message' => 'Failed to create home appointment',
                'error' => $errorMessage,
                'type' => 'general_error',
                'details' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null
            ], 500);
        }
    }

    /**
     * Display appointments for a specific hospital.
     */
    public function show(Request $request, $hospitalId)
    {
        // Get appointment_type from query parameter (urgent or regular)
        $appointmentType = $request->query('appointment_type'); // 'urgent' or 'regular' or null
        
        $today = now()->toDateString();
        
        // Build query for appointments
        $query = Appointment::where('hospital_id', $hospitalId)
            ->where('donation_type', 'Home Blood Donation')
            ->where('state', 'pending')
            ->whereDate('appointment_date', '>=', $today);
        
        // Filter by appointment_type if provided
        if ($appointmentType && in_array($appointmentType, ['urgent', 'regular'])) {
            $query->where('appointment_type', $appointmentType);
        }
        
        $appointments = $query->with('hospital')
            ->orderBy('appointment_date', 'asc')
            ->get();

        // Get all booked appointments to check slot availability
        $bookedAppointments = HomeAppointment::whereIn('appointment_id', $appointments->pluck('id'))
            ->where('state', 'pending') // Only count pending bookings, not cancelled/completed
            ->select('appointment_id', 'appointment_time')
            ->get()
            ->groupBy('appointment_id')
            ->map(function ($group) {
                return $group->groupBy('appointment_time')->map->count();
            });

        // Transform appointments into time slots format
        $timeSlots = [];
        $totalAvailableSlots = 0;
        $totalBookedSlots = 0;
        
        foreach ($appointments as $appointment) {
            // Format date to YYYY-MM-DD string for consistency
            $date = $appointment->appointment_date instanceof \Carbon\Carbon 
                ? $appointment->appointment_date->toDateString() 
                : (is_string($appointment->appointment_date) 
                    ? date('Y-m-d', strtotime($appointment->appointment_date))
                    : $appointment->appointment_date);
            
            $slots = $appointment->time_slots ?? [];
            
            foreach ($slots as $slotIndex => $slot) {
                // Handle time slot format: could be object with start/end or string
                $timeDisplay = '';
                $timeKey = ''; // For checking bookings
                
                if (is_array($slot) || is_object($slot)) {
                    // Handle object format: {start: "09:00", end: "10:00", is_available: true}
                    $slotArray = (array) $slot;
                    $startTime = $slotArray['start'] ?? '';
                    $endTime = $slotArray['end'] ?? '';
                    
                    if ($startTime && $endTime) {
                        $timeDisplay = $startTime . ' - ' . $endTime;
                        $timeKey = $startTime; // Use start time as key for booking lookup
                    } elseif ($startTime) {
                        $timeDisplay = $startTime;
                        $timeKey = $startTime;
                    }
                } else {
                    // Handle string format (fallback for backward compatibility)
                    $timeDisplay = (string) $slot;
                    $timeKey = $timeDisplay;
                }
                
                if (!$timeDisplay || !$timeKey) {
                    continue; // Skip invalid slots
                }
                
                // Check if this specific time slot is booked
                $currentBookings = $bookedAppointments[$appointment->id][$timeKey] ?? 0;
                
                // Check against max_capacity if it exists
                $maxCapacity = $appointment->max_capacity ?? null;
                
                // Determine if slot is fully booked
                $status = 'available';
                if ($maxCapacity !== null && $currentBookings >= $maxCapacity) {
                    // Fully booked based on capacity
                    $status = 'booked';
                    $totalBookedSlots++;
                } elseif ($maxCapacity === null && $currentBookings > 0) {
                    // No capacity limit set, but there are bookings
                    // Mark as booked once someone has booked it
                    $status = 'booked';
                    $totalBookedSlots++;
                } else {
                    // Slot is available
                    $totalAvailableSlots++;
                }
                
                $timeSlots[] = [
                    'id' => $appointment->id . '_' . $slotIndex . '_' . $timeKey,
                    'date' => $date,
                    'time' => $timeDisplay,
                    'time_key' => $timeKey, // Store the key for booking reference
                    'status' => $status,
                    'appointment_id' => $appointment->id,
                    'bookings_count' => $currentBookings,
                    'max_capacity' => $maxCapacity,
                    'start' => is_array($slot) || is_object($slot) ? ((array)$slot)['start'] ?? $timeKey : $timeKey,
                    'end' => is_array($slot) || is_object($slot) ? ((array)$slot)['end'] ?? null : null
                ];
            }
        }

        // Count total slots
        $totalSlots = count($timeSlots);

        // Get hospital info if appointments exist
        $hospital = null;
        if ($appointments->isNotEmpty()) {
            $hospital = Hospital::find($hospitalId);
        }

        return response()->json([
            'appointments' => $appointments,
            'time_slots' => $timeSlots,
            'total_slots' => $totalSlots,
            'available_slots' => $totalAvailableSlots,
            'booked_slots' => $totalBookedSlots,
            'hospital' => $hospital
        ], 200);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Home_Appointment $home_Appointment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Home_Appointment $home_Appointment)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Home_Appointment $home_Appointment)
    {
        //
    }
}
