<?php

namespace App\Http\Controllers;

use App\Models\HospitalAppointment;
use App\Models\HomeAppointment;
use App\Models\Appointment;
use App\Models\Donor;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminAppointmentsController extends Controller
{
    /**
     * Get critical/urgent appointments scheduled by donors
     * Returns both hospital and home appointments that are urgent
     */
    public function getCriticalAppointments(Request $request)
    {
        try {
            $today = now()->toDateString();
            
            // Get urgent hospital appointments
            $hospitalAppointments = HospitalAppointment::where('state', 'pending')
                ->with([
                    'donor.user',
                    'donor.bloodType',
                    'hospital',
                    'appointments' => function($query) {
                        $query->where('appointment_type', 'urgent');
                    }
                ])
                ->whereHas('appointments', function($query) use ($today) {
                    $query->where('appointment_type', 'urgent')
                          ->whereDate('appointment_date', '>=', $today);
                })
                ->get()
                ->filter(function($appointment) {
                    // Filter to only include urgent appointments
                    return $appointment->appointments && $appointment->appointments->appointment_type === 'urgent';
                })
                ->map(function($appointment) {
                    // Note: appointments() is a belongsTo relationship
                    $appt = $appointment->appointments;
                    $donor = $appointment->donor;
                    $user = $donor ? $donor->user : null;
                    
                    return [
                        'id' => $appointment->id,
                        'code' => $appointment->code,
                        'type' => 'hospital',
                        'state' => $appointment->state,
                        'appointment_date' => $appt ? $appt->appointment_date : null,
                        'appointment_time' => $appointment->appointment_time ?? null,
                        'due_date' => $appt ? $appt->due_date : null,
                        'due_time' => $appt ? $appt->due_time : null,
                        'blood_type' => $appt ? $appt->blood_type : null,
                        'note' => $appointment->note ?? null,
                        'created_at' => $appointment->created_at,
                        'donor' => $user ? [
                            'id' => $donor->id,
                            'code' => $donor->code,
                            'name' => trim(($user->first_name ?? '') . ' ' . ($user->middle_name ?? '') . ' ' . ($user->last_name ?? '')),
                            'email' => $user->email,
                            'phone' => $user->phone_nb,
                            'blood_type' => $donor->bloodType ? $donor->bloodType->type : null,
                        ] : null,
                        'hospital' => $appointment->hospital ? [
                            'id' => $appointment->hospital->id,
                            'name' => $appointment->hospital->name,
                            'address' => $appointment->hospital->address,
                            'phone' => $appointment->hospital->phone_nb,
                            'code' => $appointment->hospital->code,
                        ] : null,
                    ];
                });

            // Get urgent home appointments
            $homeAppointments = HomeAppointment::where('state', 'pending')
                ->with([
                    'donor.user',
                    'donor.bloodType',
                    'hospital',
                    'appointment' => function($query) {
                        $query->where('appointment_type', 'urgent');
                    }
                ])
                ->whereHas('appointment', function($query) use ($today) {
                    $query->where('appointment_type', 'urgent')
                          ->whereDate('appointment_date', '>=', $today);
                })
                ->get()
                ->filter(function($appointment) {
                    // Filter to only include urgent appointments
                    return $appointment->appointment && $appointment->appointment->appointment_type === 'urgent';
                })
                ->map(function($appointment) {
                    $appt = $appointment->appointment;
                    $donor = $appointment->donor;
                    $user = $donor ? $donor->user : null;
                    
                    return [
                        'id' => $appointment->id,
                        'code' => $appointment->code,
                        'type' => 'home',
                        'state' => $appointment->state,
                        'appointment_date' => $appt ? $appt->appointment_date : null,
                        'appointment_time' => $appointment->appointment_time ?? null,
                        'due_date' => $appt ? $appt->due_date : null,
                        'due_time' => $appt ? $appt->due_time : null,
                        'blood_type' => $appt ? $appt->blood_type : null,
                        'note' => $appointment->note ?? null,
                        'address' => $appointment->address ?? null,
                        'medical_conditions' => $appointment->medical_conditions ?? [],
                        'emergency_contact' => $appointment->emerg_contact ?? null,
                        'emergency_phone' => $appointment->emerg_phone ?? null,
                        'created_at' => $appointment->created_at,
                        'donor' => $user ? [
                            'id' => $donor->id,
                            'code' => $donor->code,
                            'name' => trim(($user->first_name ?? '') . ' ' . ($user->middle_name ?? '') . ' ' . ($user->last_name ?? '')),
                            'email' => $user->email,
                            'phone' => $user->phone_nb,
                            'blood_type' => $donor->bloodType ? $donor->bloodType->type : null,
                        ] : null,
                        'hospital' => $appointment->hospital ? [
                            'id' => $appointment->hospital->id,
                            'name' => $appointment->hospital->name,
                            'address' => $appointment->hospital->address,
                            'phone' => $appointment->hospital->phone_nb,
                            'code' => $appointment->hospital->code,
                        ] : null,
                        'phlebotomist' => $appointment->mobilePhlebotomist ? [
                            'id' => $appointment->mobilePhlebotomist->id,
                            'name' => $appointment->mobilePhlebotomist->name ?? 'N/A',
                            'phone' => $appointment->mobilePhlebotomist->phone_nb ?? null,
                        ] : null,
                    ];
                });

            // Combine and sort by due date (most urgent first)
            $allAppointments = $hospitalAppointments->concat($homeAppointments)
                ->sortBy(function($appointment) {
                    // Sort by due_date if available, otherwise by appointment_date
                    $date = $appointment['due_date'] ?? $appointment['appointment_date'];
                    return $date ? Carbon::parse($date)->timestamp : 0;
                })
                ->values();

            return response()->json([
                'success' => true,
                'appointments' => $allAppointments,
                'total' => $allAppointments->count(),
                'hospital_count' => $hospitalAppointments->count(),
                'home_count' => $homeAppointments->count(),
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching critical appointments:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch critical appointments',
                'error' => $e->getMessage(),
                'appointments' => [],
                'total' => 0,
            ], 500);
        }
    }
}

