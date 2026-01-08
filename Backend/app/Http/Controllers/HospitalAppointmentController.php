<?php

namespace App\Http\Controllers;

use App\Models\HospitalAppointment;
use App\Models\HomeAppointment;
use App\Models\Hospital;
use App\Models\Donor;
use App\Models\Appointment;
use App\Models\User;
use App\Models\BloodType;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class HospitalAppointmentController extends Controller
{
    /**
     * Display a listing of hospitals with available hospital blood donation appointments.
     */
    public function index()
    {
        try {
            $today = now()->toDateString();
            
            // Get hospitals that have appointments with donation_type = 'Hospital Blood Donation'
            $hospitals = Hospital::query()
            ->select(['id','name','address','phone_nb','email','code','created_at'])
            ->whereHas('appointments', function($query) use ($today) {
                $query->where('donation_type', 'Hospital Blood Donation')
                      ->where('state', 'pending')
                      ->whereDate('appointment_date', '>=', $today);
            })
            ->with(['appointments' => function($query) use ($today) {
                $query->where('donation_type', 'Hospital Blood Donation')
                      ->where('state', 'pending')
                      ->whereDate('appointment_date', '>=', $today)
                      ->orderBy('appointment_date', 'asc');
            }])
            ->orderBy('created_at', 'desc')
            ->get();
        } catch (\Exception $e) {
            \Log::error('Error fetching hospitals for hospital donation:', [
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

        // Calculate available slots for each hospital and identify urgent and regular appointments
        $hospitalsWithSlots = $hospitals->map(function($hospital) {
            $totalSlots = 0;
            $urgentSlots = 0;
            $regularSlots = 0;
            $hasUrgent = false;
            $hasRegular = false;
            $urgentDueDate = null;
            $urgentDueTime = null;
            $urgentBloodType = null;
            
            foreach ($hospital->appointments as $appointment) {
                $slots = $appointment->time_slots ?? [];
                $slotCount = count($slots);
                $totalSlots += $slotCount;
                
                // Check appointment type and count slots separately
                if ($appointment->appointment_type === 'urgent' && !empty($appointment->due_date)) {
                    $hasUrgent = true;
                    $urgentSlots += $slotCount;
                    
                    // Get the earliest urgent due date/time using Carbon for proper comparison
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
                        // Skip invalid date format
                        \Log::warning('Invalid due_date format for appointment: ' . $appointment->id);
                    }
                }
                
                // Check if it's a regular appointment (separate check so hospital can have both)
                if ($appointment->appointment_type === 'regular') {
                    $hasRegular = true;
                    $regularSlots += $slotCount;
                }
            }
            
            // Add available_slots and urgent info to hospital data
            $hospitalArray = $hospital->toArray();
            $hospitalArray['available_slots'] = $totalSlots;
            $hospitalArray['urgent_slots'] = $urgentSlots;
            $hospitalArray['regular_slots'] = $regularSlots;
            $hospitalArray['has_urgent'] = $hasUrgent;
            $hospitalArray['has_regular'] = $hasRegular;
            if ($hasUrgent) {
                $hospitalArray['urgent_due_date'] = $urgentDueDate;
                $hospitalArray['urgent_due_time'] = $urgentDueTime;
                $hospitalArray['blood_type_needed'] = $urgentBloodType;
            } else {
                $hospitalArray['blood_type_needed'] = null;
            }
            // Do not include full appointments payload in the list response to reduce size
            unset($hospitalArray['appointments']);
            return $hospitalArray;
        });

        // Separate urgent and regular hospitals
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
     * Display appointments for a specific hospital for hospital blood donation.
     */
    public function show(Request $request, $hospitalId)
    {
        // Get appointment_type from query parameter (urgent or regular)
        $appointmentType = $request->query('appointment_type');
        
        $today = now()->toDateString();
        
        // Build query for appointments
        $query = Appointment::where('hospital_id', $hospitalId)
            ->where('donation_type', 'Hospital Blood Donation')
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
        $bookedAppointments = HospitalAppointment::whereIn('appointment_id', $appointments->pluck('id'))
            ->where('state', 'pending')
            ->select('appointment_id')
            ->get()
            ->groupBy('appointment_id')
            ->map(function ($group) {
                return $group->count();
            });

        // Transform appointments into time slots format
        $timeSlots = [];
        $totalAvailableSlots = 0;
        $totalBookedSlots = 0;
        
        foreach ($appointments as $appointment) {
            $date = $appointment->appointment_date instanceof \Carbon\Carbon 
                ? $appointment->appointment_date->toDateString() 
                : (is_string($appointment->appointment_date) 
                    ? date('Y-m-d', strtotime($appointment->appointment_date))
                    : $appointment->appointment_date);
            
            $slots = $appointment->time_slots ?? [];
            
            foreach ($slots as $time) {
                $timeSlotValue = is_array($time) ? ($time['start'] ?? $time) : $time;
                $currentBookings = $bookedAppointments[$appointment->id] ?? 0;
                
                $maxCapacity = $appointment->max_capacity ?? null;
                
                $status = 'available';
                if ($maxCapacity !== null && $currentBookings >= $maxCapacity) {
                    $status = 'booked';
                    $totalBookedSlots++;
                } elseif ($maxCapacity === null && $currentBookings > 0) {
                    $status = 'booked';
                    $totalBookedSlots++;
                } else {
                    $totalAvailableSlots++;
                }
                
                $timeSlots[] = [
                    'id' => $appointment->id . '_' . $timeSlotValue,
                    'date' => $date,
                    'time' => $timeSlotValue,
                    'status' => $status,
                    'appointment_id' => $appointment->id,
                    'bookings_count' => $currentBookings,
                    'max_capacity' => $maxCapacity
                ];
            }
        }

        $totalSlots = count($timeSlots);

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
     * Get all hospital appointments
     */
    public function getHospitalAppointments(Request $request)
    {
        try {
            // Get all hospital appointments with relationships
            $appointments = HospitalAppointment::with([
                'donor.user',
                'donor.bloodType',
                'hospital',
                'appointments'
            ])
            ->whereHas('donor')
            ->whereHas('hospital')
            ->whereHas('appointments')
            ->get()
            ->sortBy(function ($appointment) {
                // Sort by hospital name, then appointment date, then appointment time
                $hospitalName = $appointment->hospital ? $appointment->hospital->name : '';
                $appointmentDate = $appointment->appointments ? $appointment->appointments->appointment_date : '';
                $appointmentTime = '';
                if ($appointment->appointments && $appointment->appointments->time_slots && is_array($appointment->appointments->time_slots)) {
                    $timeSlots = $appointment->appointments->time_slots;
                    if (!empty($timeSlots)) {
                        $appointmentTime = is_array($timeSlots[0]) ? ($timeSlots[0]['start'] ?? $timeSlots[0]) : $timeSlots[0];
                    }
                }
                
                return [
                    $hospitalName,
                    $appointmentDate ? Carbon::parse($appointmentDate)->timestamp : 0,
                    $appointmentTime ? $this->timeToTimestampForSort($appointmentTime) : 0
                ];
            })
            ->values();

            // Transform to match frontend format
            $transformedAppointments = $appointments->map(function ($appointment) {
                // Calculate age from date of birth
                $age = null;
                if ($appointment->donor && $appointment->donor->date_of_birth) {
                    $birthDate = Carbon::parse($appointment->donor->date_of_birth);
                    $age = $birthDate->age;
                }

                // Get blood type string
                $bloodType = 'N/A';
                if ($appointment->donor && $appointment->donor->bloodType) {
                    $bloodType = $appointment->donor->bloodType->type . $appointment->donor->bloodType->rh_factor;
                }

                // Get donor name
                $donorName = 'N/A';
                if ($appointment->donor && $appointment->donor->user) {
                    $nameParts = array_filter([
                        $appointment->donor->user->first_name,
                        $appointment->donor->user->middle_name,
                        $appointment->donor->user->last_name
                    ]);
                    $donorName = implode(' ', $nameParts);
                }

                // Get appointment date and time from the appointments relationship
                $appointmentDate = 'N/A';
                $appointmentTime = 'N/A';
                if ($appointment->appointments) {
                    $appointmentDate = $appointment->appointments->appointment_date;
                    // Get time from appointments time_slots
                    if ($appointment->appointments->time_slots && is_array($appointment->appointments->time_slots)) {
                        $timeSlots = $appointment->appointments->time_slots;
                        if (!empty($timeSlots)) {
                            // Get first time slot - handle both string and array formats
                            $firstSlot = is_array($timeSlots[0]) ? ($timeSlots[0]['start'] ?? $timeSlots[0]) : $timeSlots[0];
                            $appointmentTime = $firstSlot ?? 'N/A';
                        }
                    }
                }
                
                // Format time to 12-hour format if needed
                if ($appointmentTime !== 'N/A' && preg_match('/^(\d{2}):(\d{2})$/', $appointmentTime, $matches)) {
                    $hour = (int)$matches[1];
                    $minute = $matches[2];
                    $ampm = $hour >= 12 ? 'PM' : 'AM';
                    $hour12 = $hour % 12;
                    if ($hour12 === 0) $hour12 = 12;
                    $appointmentTime = sprintf('%d:%s %s', $hour12, $minute, $ampm);
                }

                // Get donor email and phone
                $email = $appointment->donor && $appointment->donor->user ? $appointment->donor->user->email : 'N/A';
                $phone = $appointment->donor && $appointment->donor->user ? $appointment->donor->user->phone_nb : 'N/A';

                // Get hospital name and ID
                $hospitalName = $appointment->hospital ? $appointment->hospital->name : 'Unknown Hospital';
                $hospitalId = $appointment->hospital ? $appointment->hospital->id : 0;

                return [
                    'id' => $appointment->code ?? 'HOSP-' . str_pad($appointment->id, 4, '0', STR_PAD_LEFT),
                    'db_id' => $appointment->id, // Store database ID for API operations
                    'name' => $donorName,
                    'blood_type' => $bloodType,
                    'age' => $age,
                    'email' => $email,
                    'phone' => $phone,
                    'status' => $appointment->state === 'canceled' ? 'cancelled' : ($appointment->state ?? 'pending'),
                    'created_at' => $appointment->created_at ? Carbon::parse($appointment->created_at)->format('Y-m-d') : 'N/A',
                    'date' => $appointmentDate,
                    'time' => $appointmentTime,
                    'hospital_id' => $hospitalId,
                    'hospital_name' => $hospitalName,
                    'note' => $appointment->note ?? null,
                    'donor_id' => $appointment->donor_id,
                    'appointment_id' => $appointment->appointment_id,
                ];
            });

            return response()->json([
                'appointments' => $transformedAppointments,
                'total' => $transformedAppointments->count()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching hospital appointments:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'appointments' => [],
                'total' => 0,
                'error' => 'Failed to fetch hospital appointments'
            ], 500);
        }
    }

    /**
     * Convert time string to timestamp for sorting
     */
    private function timeToTimestampForSort($timeString)
    {
        // Handle 24-hour format (stored in database)
        if (preg_match('/^(\d{2}):(\d{2})$/', $timeString, $matches)) {
            $hour = (int)$matches[1];
            $minute = (int)$matches[2];
            return ($hour * 60) + $minute; // Return minutes since midnight
        }
        
        // Handle 12-hour format if it comes from frontend
        if (preg_match('/(\d+):(\d+)\s*(AM|PM)/i', $timeString, $matches)) {
            $hour = (int)$matches[1];
            $minute = (int)$matches[2];
            $ampm = strtoupper($matches[3]);
            
            if ($ampm === 'PM' && $hour !== 12) {
                $hour += 12;
            } elseif ($ampm === 'AM' && $hour === 12) {
                $hour = 0;
            }
            
            return ($hour * 60) + $minute;
        }
        
        return 0;
    }

    /**
     * Get all hospital visit appointments (hospital appointment slots)
     */
    public function getHospitalVisitAppointments(Request $request)
    {
        try {
            // Get all appointments with donation_type = 'Hospital Blood Donation'
            // Order by date descending (latest first) - will be re-sorted by hospital grouping
            $appointments = Appointment::where('donation_type', 'Hospital Blood Donation')
                ->with('hospital')
                ->orderBy('appointment_date', 'desc')
                ->get();

            // Group appointments by hospital
            $hospitalGroups = $appointments->groupBy('hospital_id');

            $transformedAppointments = $hospitalGroups->map(function ($hospitalAppointments, $hospitalId) {
                $firstAppointment = $hospitalAppointments->first();
                $hospital = $firstAppointment->hospital;

                if (!$hospital) {
                    return null;
                }

                // Group time slots by date
                $dateGroups = $hospitalAppointments->groupBy('appointment_date');
                
                // Get sorted dates in descending order (latest to earliest)
                $sortedDates = $dateGroups->keys()->sort(function($a, $b) {
                    try {
                        $dateA = Carbon::parse($a)->timestamp;
                        $dateB = Carbon::parse($b)->timestamp;
                        return $dateB - $dateA; // Descending order (latest first)
                    } catch (\Exception $e) {
                        return strcmp($b, $a); // Fallback to string comparison
                    }
                })->values(); // Re-index

                $availableSlots = $sortedDates->map(function ($date) use ($dateGroups) {
                    $dateAppointments = $dateGroups->get($date);
                    
                    // Collect appointment IDs for this date (for delete functionality)
                    $appointmentIds = $dateAppointments->pluck('id')->toArray();
                    
                    // Collect all time slots from all appointments on this date
                    $allTimeSlots = [];
                    
                    foreach ($dateAppointments as $apt) {
                        $timeSlots = $apt->time_slots ?? [];
                        if (is_array($timeSlots)) {
                            // Count bookings for this appointment_id (HospitalAppointment doesn't track specific time slots)
                            $bookingsCount = HospitalAppointment::where('appointment_id', $apt->id)
                                ->where('state', '!=', 'canceled')
                                ->count();
                            
                            $maxCapacity = $apt->max_capacity ?? null;
                            $isBooked = ($maxCapacity && $bookingsCount >= $maxCapacity);
                            
                            foreach ($timeSlots as $timeSlot) {
                                // Handle both old format (string) and new format (array with start/end)
                                $timeSlotValue = null;
                                
                                if (is_string($timeSlot)) {
                                    // Old format: simple time string like "14:30"
                                    $timeSlotValue = $timeSlot;
                                } elseif (is_array($timeSlot) && isset($timeSlot['start'])) {
                                    // New format: array with 'start', 'end', 'date', 'is_available'
                                    $timeSlotValue = $timeSlot['start'];
                                    
                                    // Check if the slot date matches the current date
                                    if (isset($timeSlot['date']) && $timeSlot['date'] !== $date) {
                                        continue; // Skip slots that don't belong to this date
                                    }
                                    
                                    // Use is_available from the slot if available
                                    if (isset($timeSlot['is_available']) && !$timeSlot['is_available']) {
                                        $allTimeSlots[] = [
                                            'time' => $this->formatTime($timeSlotValue),
                                            'available' => false
                                        ];
                                        continue;
                                    }
                                } else {
                                    // Skip invalid formats
                                    continue;
                                }
                                
                                // Format time from 24-hour to 12-hour format
                                $formattedTime = $this->formatTime($timeSlotValue);
                                
                                $allTimeSlots[] = [
                                    'time' => $formattedTime,
                                    'available' => !$isBooked
                                ];
                            }
                        }
                    }

                    // Remove duplicates and format
                    $uniqueSlots = [];
                    $seen = [];
                    foreach ($allTimeSlots as $slot) {
                        if (!in_array($slot['time'], $seen)) {
                            $seen[] = $slot['time'];
                            $uniqueSlots[] = $slot;
                        }
                    }

                    // Sort by time
                    usort($uniqueSlots, function($a, $b) {
                        return strcmp($a['time'], $b['time']);
                    });

                    return [
                        'date' => $date,
                        'times' => $uniqueSlots,
                        'appointment_ids' => $appointmentIds // Include appointment IDs for delete functionality
                    ];
                })
                ->values(); // Maintain the order from sortedDates

                // Calculate total capacity (sum of max_capacity from all appointments or count of time slots)
                $totalCapacity = 0;
                foreach ($hospitalAppointments as $apt) {
                    $timeSlots = $apt->time_slots ?? [];
                    if (is_array($timeSlots)) {
                        $totalCapacity += count($timeSlots);
                    }
                    if ($apt->max_capacity) {
                        $totalCapacity = max($totalCapacity, $apt->max_capacity);
                    }
                }

                return [
                    'id' => $hospital->id,
                    'name' => $hospital->name ?? 'Unknown Hospital',
                    'location' => $hospital->address ?? 'No address',
                    'totalCapacity' => $totalCapacity,
                    'availableSlots' => $availableSlots->toArray()
                ];
            })->filter()->values();

            return response()->json([
                'appointments' => $transformedAppointments,
                'total' => $transformedAppointments->count()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching hospital visit appointments:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'appointments' => [],
                'total' => 0,
                'error' => 'Failed to fetch hospital visit appointments'
            ], 500);
        }
    }

    /**
     * Format time from 24-hour to 12-hour format
     */
    private function formatTime($time)
    {
        if (preg_match('/^(\d{2}):(\d{2})$/', $time, $matches)) {
            $hour = (int)$matches[1];
            $minute = $matches[2];
            $ampm = $hour >= 12 ? 'PM' : 'AM';
            $hour12 = $hour % 12;
            if ($hour12 === 0) $hour12 = 12;
            return sprintf('%d:%s %s', $hour12, $minute, $ampm);
        }
        return $time;
    }

    /**
     * Get a single hospital appointment by code (for admin dashboard)
     */
    public function showHospitalAppointment($code)
    {
        try {
            $hospitalAppointment = HospitalAppointment::where('code', $code)
                ->with(['donor.user', 'donor.bloodType', 'hospital', 'appointments'])
                ->firstOrFail();

            // Calculate age
            $age = null;
            if ($hospitalAppointment->donor && $hospitalAppointment->donor->date_of_birth) {
                $birthDate = Carbon::parse($hospitalAppointment->donor->date_of_birth);
                $age = $birthDate->age;
            }

            // Get blood type
            $bloodType = 'N/A';
            if ($hospitalAppointment->donor && $hospitalAppointment->donor->bloodType) {
                $bloodType = $hospitalAppointment->donor->bloodType->type . $hospitalAppointment->donor->bloodType->rh_factor;
            }

            // Get donor name
            $donorName = 'N/A';
            if ($hospitalAppointment->donor && $hospitalAppointment->donor->user) {
                $nameParts = array_filter([
                    $hospitalAppointment->donor->user->first_name,
                    $hospitalAppointment->donor->user->middle_name,
                    $hospitalAppointment->donor->user->last_name
                ]);
                $donorName = implode(' ', $nameParts);
            }

            // Get appointment date and time
            $appointmentDate = 'N/A';
            $appointmentTime = 'N/A';
            if ($hospitalAppointment->appointments) {
                $appointmentDate = $hospitalAppointment->appointments->appointment_date;
                if ($hospitalAppointment->appointments->time_slots && is_array($hospitalAppointment->appointments->time_slots)) {
                    $timeSlots = $hospitalAppointment->appointments->time_slots;
                    if (!empty($timeSlots)) {
                        $firstSlot = is_array($timeSlots[0]) ? ($timeSlots[0]['start'] ?? $timeSlots[0]) : $timeSlots[0];
                        $appointmentTime = $firstSlot ?? 'N/A';
                    }
                }
            }

            return response()->json([
                'hospitalAppointment' => [
                    'id' => $hospitalAppointment->code,
                    'db_id' => $hospitalAppointment->id,
                    'name' => $donorName,
                    'blood_type' => $bloodType,
                    'age' => $age,
                    'email' => $hospitalAppointment->donor && $hospitalAppointment->donor->user ? $hospitalAppointment->donor->user->email : 'N/A',
                    'phone' => $hospitalAppointment->donor && $hospitalAppointment->donor->user ? $hospitalAppointment->donor->user->phone_nb : 'N/A',
                    'status' => $hospitalAppointment->state === 'canceled' ? 'cancelled' : ($hospitalAppointment->state ?? 'pending'),
                    'date' => $appointmentDate,
                    'time' => $appointmentTime,
                    'hospital_id' => $hospitalAppointment->hospital ? $hospitalAppointment->hospital->id : 0,
                    'hospital_name' => $hospitalAppointment->hospital ? $hospitalAppointment->hospital->name : 'Unknown Hospital',
                    'note' => $hospitalAppointment->note,
                    'donor_id' => $hospitalAppointment->donor_id,
                    'appointment_id' => $hospitalAppointment->appointment_id,
                    'created_at' => $hospitalAppointment->created_at ? Carbon::parse($hospitalAppointment->created_at)->format('Y-m-d') : 'N/A',
                ]
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Hospital appointment not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error fetching hospital appointment:', [
                'code' => $code,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to fetch hospital appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a hospital appointment
     */
    public function update(Request $request, $code)
    {
        try {
            $hospitalAppointment = HospitalAppointment::where('code', $code)->firstOrFail();
            
            $validated = $request->validate([
                'state' => 'sometimes|in:pending,completed,canceled',
                'note' => 'nullable|string|max:1000',
            ]);

            // Check if state is being changed to 'completed' to award XP
            $wasCompleted = $hospitalAppointment->state === 'completed';
            $willBeCompleted = isset($validated['state']) && $validated['state'] === 'completed' && !$wasCompleted;

            $hospitalAppointment->update($validated);
            $hospitalAppointment->refresh();
            $hospitalAppointment->load(['donor.user', 'donor.bloodType', 'hospital', 'appointments']);

            // Award XP if donation was just completed
            if ($willBeCompleted && $hospitalAppointment->donor_id) {
                XpService::awardBloodDonationXp(
                    $hospitalAppointment->donor_id,
                    \App\Models\HospitalAppointment::class,
                    $hospitalAppointment->id
                );
            }

            return response()->json([
                'message' => 'Hospital appointment updated successfully',
                'hospitalAppointment' => $hospitalAppointment
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Hospital appointment not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating hospital appointment:', [
                'code' => $code,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to update hospital appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a hospital appointment
     */
    public function destroy($code)
    {
        try {
            $hospitalAppointment = HospitalAppointment::where('code', $code)->firstOrFail();
            
            // Check if appointment is in a state that allows deletion
            // You might want to add business logic here (e.g., prevent deletion of completed appointments)
            
            $hospitalAppointment->delete();

            return response()->json([
                'message' => 'Hospital appointment deleted successfully'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Hospital appointment not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting hospital appointment:', [
                'code' => $code,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to delete hospital appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created hospital appointment
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
                // Optional fields
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
            $isNewUser = false;
            $generatedPassword = null;
            
            if (!$user) {
                // Generate a readable temporary password for new users
                $generatedPassword = Str::random(12); // 12 character random password
                $isNewUser = true;
                
                // Check if phone_nb is unique before creating user
                if (User::where('phone_nb', $validated['phone_nb'])->exists()) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Phone number is already registered to another user'
                    ], 422);
                }
                
                // Create new user
                $user = User::create([
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'phone_nb' => $validated['phone_nb'],
                    'email' => $validated['email'],
                    'role' => 'Donor',
                    'password' => Hash::make($generatedPassword),
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
            
            // Check eligibility: last donation must be at least 56 days ago
            $lastDonationDate = null;
            if ($donor) {
                // Get the most recent completed hospital appointment
                $lastHospitalAppt = HospitalAppointment::where('donor_id', $donor->id)
                    ->where('state', 'completed')
                    ->with('appointments')
                    ->get()
                    ->filter(function($appt) {
                        return $appt->appointments && $appt->appointments->appointment_date;
                    })
                    ->sortByDesc(function($appt) {
                        return $appt->appointments->appointment_date;
                    })
                    ->first();
                
                // Get the most recent completed home appointment
                $lastHomeAppt = HomeAppointment::where('donor_id', $donor->id)
                    ->where('state', 'completed')
                    ->with('appointment')
                    ->get()
                    ->filter(function($appt) {
                        return $appt->appointment && $appt->appointment->appointment_date;
                    })
                    ->sortByDesc(function($appt) {
                        return $appt->appointment->appointment_date;
                    })
                    ->first();
                
                // Get the most recent donation date from either type
                $hospitalDate = $lastHospitalAppt && $lastHospitalAppt->appointments 
                    ? Carbon::parse($lastHospitalAppt->appointments->appointment_date) 
                    : null;
                $homeDate = $lastHomeAppt && $lastHomeAppt->appointment 
                    ? Carbon::parse($lastHomeAppt->appointment->appointment_date) 
                    : null;
                
                if ($hospitalDate && $homeDate) {
                    $lastDonationDate = $hospitalDate->greaterThan($homeDate) ? $hospitalDate : $homeDate;
                } elseif ($hospitalDate) {
                    $lastDonationDate = $hospitalDate;
                } elseif ($homeDate) {
                    $lastDonationDate = $homeDate;
                } elseif (!empty($validated['last_donation']) && $validated['last_donation'] !== '') {
                    $lastDonationDate = Carbon::parse($validated['last_donation']);
                } elseif ($donor->last_donation) {
                    $lastDonationDate = Carbon::parse($donor->last_donation);
                }
            } elseif (!empty($validated['last_donation']) && $validated['last_donation'] !== '') {
                // For new donors, use the provided last_donation
                $lastDonationDate = Carbon::parse($validated['last_donation']);
            }
            
            // Check eligibility if we have a last donation date
            if ($lastDonationDate) {
                $today = Carbon::today();
                $daysSinceLastDonation = $lastDonationDate->diffInDays($today);
                
                if ($daysSinceLastDonation < 56) {
                    DB::rollBack();
                    $daysRemaining = 56 - $daysSinceLastDonation;
                    return response()->json([
                        'message' => "You are not eligible to donate yet. You must wait at least 56 days between donations. You can donate again in {$daysRemaining} day" . ($daysRemaining !== 1 ? 's' : '') . "."
                    ], 422);
                }
            }
            
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
                ->where('donation_type', 'Hospital Blood Donation')
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

            // Create Hospital Appointment
            $hospitalAppointmentData = [
                'donor_id' => $donor->id,
                'hospital_Id' => $validated['hospital_id'],
                'appointment_id' => $appointment->id,
                'state' => 'pending',
                'note' => $validated['note'] ?? null,
            ];
            
            $hospitalAppointment = HospitalAppointment::create($hospitalAppointmentData);

            DB::commit();

            // Prepare response
            $response = [
                'message' => 'Hospital appointment created successfully',
                'hospital_appointment' => $hospitalAppointment->load(['donor.user', 'donor.bloodType', 'hospital', 'appointments']),
                'donor' => $donor->load('user')
            ];

            // If new user was created, include login credentials
            if ($isNewUser && $generatedPassword) {
                $response['login_info'] = [
                    'email' => $user->email,
                    'password' => $generatedPassword,
                    'message' => 'Your account has been created. Please use these credentials to log in.'
                ];
            }

            return response()->json($response, 201);

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            \Log::error('Database error creating hospital appointment:', [
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
                'message' => 'Failed to create hospital appointment',
                'error' => $errorMessage,
                'type' => 'database_error'
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating hospital appointment:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request_data' => $request->all()
            ]);
            
            // Return more detailed error in development
            $errorMessage = config('app.debug') 
                ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine()
                : 'Failed to create hospital appointment. Please try again.';
            
            return response()->json([
                'message' => 'Failed to create hospital appointment',
                'error' => $errorMessage,
                'type' => 'general_error',
                'details' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null
            ], 500);
        }
    }
}