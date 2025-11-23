<?php

namespace App\Http\Controllers;

use App\Models\HomeAppointment;
use App\Models\Appointment;
use App\Models\Hospital;
use App\Models\BloodType;
use App\Models\MobilePhlebotomist;
use Illuminate\Http\Request;
use Carbon\Carbon;

class HomeVisitController extends Controller
{
    /**
     * Get all home visit orders (HomeAppointments)
     */
    public function getHomeVisitOrders(Request $request)
    {
        try {
            // First get all orders with relationships
            $orders = HomeAppointment::with([
                'donor.user',
                'donor.bloodType',
                'mobilePhlebotomist.user',
                'hospital',
                'appointment'
            ])
            ->whereHas('donor') // Only get orders with valid donors
            ->whereHas('hospital') // Only get orders with valid hospitals
            ->whereHas('appointment') // Only get orders with valid appointments
            ->get()
            ->sortBy(function ($order) {
                // Sort by hospital name, then appointment date, then appointment time
                $hospitalName = $order->hospital ? $order->hospital->name : '';
                $appointmentDate = $order->appointment ? $order->appointment->appointment_date : '';
                $appointmentTime = $order->appointment_time ?? '';
                
                return [
                    $hospitalName,
                    $appointmentDate ? Carbon::parse($appointmentDate)->timestamp : 0,
                    $appointmentTime ? $this->timeToTimestampForSort($appointmentTime) : 0
                ];
            })
            ->values();

            // Transform to match frontend format
            $transformedOrders = $orders->map(function ($order) {
                // Calculate age from date of birth
                $age = null;
                if ($order->donor && $order->donor->date_of_birth) {
                    $birthDate = Carbon::parse($order->donor->date_of_birth);
                    $age = $birthDate->age;
                }

                // Get blood type string
                $bloodType = 'N/A';
                if ($order->donor && $order->donor->bloodType) {
                    $bloodType = $order->donor->bloodType->type . $order->donor->bloodType->rh_factor;
                }

                // Get donor name
                $donorName = 'N/A';
                if ($order->donor && $order->donor->user) {
                    $nameParts = array_filter([
                        $order->donor->user->first_name,
                        $order->donor->user->middle_name,
                        $order->donor->user->last_name
                    ]);
                    $donorName = implode(' ', $nameParts);
                }

                // Get phlebotomist name
                $phlebotomistName = 'Unassigned';
                if ($order->phlebotomist_id && $order->mobilePhlebotomist && $order->mobilePhlebotomist->user) {
                    $nameParts = array_filter([
                        $order->mobilePhlebotomist->user->first_name,
                        $order->mobilePhlebotomist->user->middle_name,
                        $order->mobilePhlebotomist->user->last_name
                    ]);
                    $phlebotomistName = implode(' ', $nameParts);
                }

                // Get appointment date and time
                $appointmentDate = 'N/A';
                $appointmentTime = 'N/A';
                if ($order->appointment) {
                    $appointmentDate = $order->appointment->appointment_date;
                    // Use stored appointment_time if available, otherwise get from appointment
                    if ($order->appointment_time) {
                        $appointmentTime = $order->appointment_time;
                    } elseif ($order->appointment->time_slots && is_array($order->appointment->time_slots)) {
                        // Fallback: get first time slot from appointment
                        $timeSlots = $order->appointment->time_slots;
                        if (!empty($timeSlots)) {
                            $appointmentTime = is_array($timeSlots) ? ($timeSlots[0] ?? 'N/A') : $timeSlots;
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
                $email = $order->donor && $order->donor->user ? $order->donor->user->email : 'N/A';
                $phone = $order->donor && $order->donor->user ? $order->donor->user->phone_nb : 'N/A';

                // Get hospital name and ID for sorting
                $hospitalName = $order->hospital ? $order->hospital->name : 'Unknown Hospital';
                $hospitalId = $order->hospital ? $order->hospital->id : 0;

                return [
                    'id' => $order->code ?? 'HAP-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                    'name' => $donorName,
                    'blood_type' => $bloodType,
                    'age' => $age,
                    'weight' => $order->{'weight(kg)'} ?? 'N/A',
                    'email' => $email,
                    'phone' => $phone,
                    'address' => $order->address ?? 'N/A',
                    'status' => $order->state === 'canceled' ? 'cancelled' : ($order->state ?? 'pending'),
                    'created_at' => $order->created_at ? Carbon::parse($order->created_at)->format('Y-m-d') : 'N/A',
                    'phlebotomist' => $phlebotomistName,
                    'date' => $appointmentDate,
                    'time' => $appointmentTime,
                    'hospital_id' => $hospitalId,
                    'hospital_name' => $hospitalName,
                ];
            });

            return response()->json([
                'orders' => $transformedOrders,
                'total' => $transformedOrders->count()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching home visit orders:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'orders' => [],
                'total' => 0,
                'error' => 'Failed to fetch home visit orders'
            ], 500);
        }
    }

    /**
     * Get all home visit appointments (hospital appointment slots)
     */
    public function getHomeVisitAppointments(Request $request)
    {
        try {
            // Get all appointments with donation_type = 'Home Blood Donation'
            // Order by date descending (latest first) - will be re-sorted by hospital grouping
            $appointments = Appointment::where('donation_type', 'Home Blood Donation')
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
                    // Collect all time slots from all appointments on this date
                    $allTimeSlots = [];
                    
                    foreach ($dateAppointments as $apt) {
                        $timeSlots = $apt->time_slots ?? [];
                        if (is_array($timeSlots)) {
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
                                
                                // Check if this specific time slot is booked
                                // Count bookings for this appointment_id and time
                                $bookingsCount = HomeAppointment::where('appointment_id', $apt->id)
                                    ->where('appointment_time', $timeSlotValue)
                                    ->where('state', '!=', 'canceled')
                                    ->count();
                                
                                // Check if max_capacity is reached
                                $maxCapacity = $apt->max_capacity ?? null;
                                $isBooked = ($maxCapacity && $bookingsCount >= $maxCapacity) || $bookingsCount > 0;
                                
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
                        'times' => $uniqueSlots
                    ];
                })
                ->values(); // Maintain the order from sortKeysDesc()

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
            \Log::error('Error fetching home visit appointments:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'appointments' => [],
                'total' => 0,
                'error' => 'Failed to fetch home visit appointments'
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
     * Convert time string to timestamp for sorting (for frontend)
     */
    private function timeToTimestamp($timeString)
    {
        // Handle 12-hour format like "2:30 PM"
        if (preg_match('/(\d+):(\d+)\s*(AM|PM)/i', $timeString, $matches)) {
            $hour = (int)$matches[1];
            $minute = (int)$matches[2];
            $ampm = strtoupper($matches[3]);
            
            if ($ampm === 'PM' && $hour !== 12) {
                $hour += 12;
            } elseif ($ampm === 'AM' && $hour === 12) {
                $hour = 0;
            }
            
            return ($hour * 60) + $minute; // Return minutes since midnight for sorting
        }
        
        // Handle 24-hour format like "14:30"
        if (preg_match('/^(\d{2}):(\d{2})$/', $timeString, $matches)) {
            $hour = (int)$matches[1];
            $minute = (int)$matches[2];
            return ($hour * 60) + $minute;
        }
        
        return 0;
    }

    /**
     * Convert time string to timestamp for sorting (for backend collection sorting)
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

    
}

