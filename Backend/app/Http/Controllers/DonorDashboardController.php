<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Models\HomeAppointment;
use App\Models\HospitalAppointment;
use App\Models\HomeAppointmentRating;
use App\Models\LivingDonor;
use App\Models\AfterDeathPledge;
use App\Models\XpTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use App\Services\XpService;
use App\Mail\LivingOrganAppointmentCancelled;

class DonorDashboardController extends Controller
{
    /**
     * Get donor dashboard data
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            if (strtolower($user->role ?? '') !== 'donor') {
                return response()->json([
                    'message' => 'Unauthorized. Only donors can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            $donor = Donor::where('user_id', $user->id)
                ->with(['user', 'bloodType'])
                ->first();
            
            if (!$donor) {
                return response()->json([
                    'message' => 'Donor record not found. Please complete your profile registration.',
                    'error' => 'donor_not_found'
                ], 404);
            }

            // Get total XP and calculate level
            $totalXp = XpService::getTotalXp($donor->id);
            $currentLevel = XpService::calculateLevel($totalXp);
            
            // Calculate XP progress using the same formula as calculateLevel
            // Formula: XP required to REACH level N = 50 * N^2 + 50 * N
            // The XP needed to REACH the current level (minimum XP for current level)
            $currentLevelMinXp = $currentLevel > 1 
                ? (50 * pow($currentLevel - 1, 2) + 50 * ($currentLevel - 1))
                : 0;
            
            // The XP needed to REACH the next level (maximum XP for current level)
            $nextLevelMinXp = 50 * pow($currentLevel, 2) + 50 * $currentLevel;
            
            // XP needed to reach next level from current total
            $xpUntilNextLevel = max(0, $nextLevelMinXp - $totalXp);
            
            // Progress within current level (how much XP earned in this level range)
            $currentLevelProgress = $totalXp - $currentLevelMinXp;
            // Total XP range for this level
            $currentLevelMaxXp = $nextLevelMinXp - $currentLevelMinXp;
            
            // Calculate percentage (clamp between 0 and 100)
            $progressPercentage = $currentLevelMaxXp > 0 
                ? max(0, min(100, round(($currentLevelProgress / $currentLevelMaxXp) * 100, 2))) 
                : 0;

            // Count completed donations
            $completedHomeAppointments = HomeAppointment::where('donor_id', $donor->id)
                ->where('state', 'completed')
                ->count();
            
            $completedHospitalAppointments = HospitalAppointment::where('donor_id', $donor->id)
                ->where('state', 'completed')
                ->count();
            
            $totalCompletedDonations = $completedHomeAppointments + $completedHospitalAppointments;
            $livesSaved = round($totalCompletedDonations * 2.4);

            // Get upcoming appointments
            try {
                $upcomingAppointments = $this->getUpcomingAppointments($donor->id);
            } catch (\Exception $e) {
                \Log::warning('Error getting upcoming appointments:', [
                    'donor_id' => $donor->id,
                    'error' => $e->getMessage()
                ]);
                $upcomingAppointments = collect([]);
            }
            
            // Get donation history
            try {
                $donationHistory = $this->getDonationHistory($donor);
            } catch (\Exception $e) {
                \Log::warning('Error getting donation history:', [
                    'donor_id' => $donor->id,
                    'error' => $e->getMessage()
                ]);
                $donationHistory = collect([]);
            }

            return response()->json([
                'level_progress' => [
                    'current_level' => $currentLevel,
                    'current_xp' => $totalXp,
                    'xp_until_next_level' => $xpUntilNextLevel,
                    'progress_percentage' => $progressPercentage
                ],
                'progress_info' => [
                    'donations_count' => $totalCompletedDonations,
                    'lives_saved' => $livesSaved,
                    'total_xp' => $totalXp
                ],
                'upcoming_appointments' => $upcomingAppointments,
                'donation_history' => $donationHistory
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching donor dashboard:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch donor dashboard data',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get upcoming appointments
     */
    private function getUpcomingAppointments($donorId)
    {
        $upcomingAppointments = collect([]);
        $today = Carbon::today();

        // Home appointments
        $homeAppointments = HomeAppointment::where('donor_id', $donorId)
            ->where('state', 'pending')
            ->with(['appointment.hospital', 'hospital'])
            ->get();

        foreach ($homeAppointments as $appt) {
            try {
                $appointment = $appt->appointment;
                $appointmentDate = null;
                
                if ($appointment && $appointment->appointment_date) {
                    $appointmentDate = Carbon::parse($appointment->appointment_date);
                }
                
                if ($appointmentDate && $appointmentDate->gte($today)) {
                    $hospitalName = 'N/A';
                    if ($appt->hospital && $appt->hospital->name) {
                        $hospitalName = $appt->hospital->name;
                    } elseif ($appointment && $appointment->hospital && $appointment->hospital->name) {
                        $hospitalName = $appointment->hospital->name;
                    }
                    
                    $appointmentTime = $appt->appointment_time;
                    if (!$appointmentTime && $appointment && $appointment->appointment_time) {
                        $appointmentTime = $appointment->appointment_time;
                    }
                    if (!$appointmentTime) {
                        $appointmentTime = 'N/A';
                    }
                    
                    $upcomingAppointments->push([
                        'code' => $appt->code ?? 'N/A',
                        'hospital' => $hospitalName,
                        'date' => $appointmentDate->format('M d'),
                        'time' => $appointmentTime,
                        'type' => 'Blood Donation'
                    ]);
                }
            } catch (\Exception $e) {
                \Log::warning('Error processing home appointment for dashboard:', [
                    'appointment_id' => $appt->id,
                    'error' => $e->getMessage()
                ]);
                continue;
            }
        }

        // Hospital appointments
        $hospitalAppointments = HospitalAppointment::where('donor_id', $donorId)
            ->where('state', 'pending')
            ->with(['appointments.hospital', 'hospital'])
            ->get();

        foreach ($hospitalAppointments as $appt) {
            try {
                $appointment = $appt->appointments;
                $appointmentDate = null;
                
                if ($appointment && $appointment->appointment_date) {
                    $appointmentDate = Carbon::parse($appointment->appointment_date);
                }
                
                if ($appointmentDate && $appointmentDate->gte($today)) {
                    $hospitalName = 'N/A';
                    if ($appt->hospital && $appt->hospital->name) {
                        $hospitalName = $appt->hospital->name;
                    } elseif ($appointment && $appointment->hospital && $appointment->hospital->name) {
                        $hospitalName = $appointment->hospital->name;
                    }
                    
                    $appointmentTime = 'N/A';
                    if ($appointment && $appointment->appointment_time) {
                        $appointmentTime = $appointment->appointment_time;
                    }
                    
                    $upcomingAppointments->push([
                        'code' => $appt->code ?? 'N/A',
                        'hospital' => $hospitalName,
                        'date' => $appointmentDate->format('M d'),
                        'time' => $appointmentTime,
                        'type' => 'Blood Donation'
                    ]);
                }
            } catch (\Exception $e) {
                \Log::warning('Error processing hospital appointment for dashboard:', [
                    'appointment_id' => $appt->id,
                    'error' => $e->getMessage()
                ]);
                continue;
            }
        }

        // Take first 5 (already sorted by date in the queries above)
        return $upcomingAppointments->take(5)->values();
    }

    /**
     * Get donation history
     */
    private function getDonationHistory($donor)
    {
        $donationHistory = collect([]);

        // Home appointments history
        $homeAppointments = HomeAppointment::where('donor_id', $donor->id)
            ->with(['appointment.hospital', 'hospital', 'rating'])
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($homeAppointments as $appt) {
            try {
                $appointment = $appt->appointment;
                $appointmentDate = null;
                
                if ($appointment && $appointment->appointment_date) {
                    $appointmentDate = Carbon::parse($appointment->appointment_date);
                }
                
                $donationHistory->push([
                    'id' => $appt->id,
                    'code' => $appt->code ?? 'N/A',
                    'donation_type' => 'Home Donation',
                    'appointment_kind' => 'home',
                    'status' => ucfirst($appt->state ?? 'pending'),
                    'status_color' => $this->getStatusColor($appt->state ?? 'pending'),
                    'date' => $appointmentDate ? $appointmentDate->format('M d') : 'N/A',
                    'reward' => $appt->state === 'completed' ? '+100 XP' : ($appt->state === 'canceled' ? '+0 XP' : 'loading...'),
                    'can_rate' => ($appt->state ?? '') === 'completed',
                    'rating' => $appt->rating ? [
                        'rating' => $appt->rating->rating,
                        'comment' => $appt->rating->comment,
                    ] : null,
                ]);
            } catch (\Exception $e) {
                \Log::warning('Error processing home appointment history:', [
                    'appointment_id' => $appt->id,
                    'error' => $e->getMessage()
                ]);
                continue;
            }
        }

        // Hospital appointments history
        $hospitalAppointments = HospitalAppointment::where('donor_id', $donor->id)
            ->with(['appointments.hospital', 'hospital'])
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($hospitalAppointments as $appt) {
            try {
                $appointment = $appt->appointments;
                $appointmentDate = null;
                
                if ($appointment && $appointment->appointment_date) {
                    $appointmentDate = Carbon::parse($appointment->appointment_date);
                }
                
                $donationHistory->push([
                    'id' => $appt->id + 100000,
                    'code' => $appt->code ?? 'N/A',
                    'donation_type' => 'Hospital Donation',
                    'appointment_kind' => 'hospital',
                    'status' => ucfirst($appt->state ?? 'pending'),
                    'status_color' => $this->getStatusColor($appt->state ?? 'pending'),
                    'date' => $appointmentDate ? $appointmentDate->format('M d') : 'N/A',
                    'reward' => $appt->state === 'completed' ? '+100 XP' : ($appt->state === 'canceled' ? '+0 XP' : 'loading...')
                ]);
            } catch (\Exception $e) {
                \Log::warning('Error processing hospital appointment history:', [
                    'appointment_id' => $appt->id,
                    'error' => $e->getMessage()
                ]);
                continue;
            }
        }

        // Organ donations
        if ($donor->user && $donor->user->email) {
            $livingDonor = LivingDonor::where('email', $donor->user->email)->first();
            
            if ($livingDonor) {
                try {
                    $xpAwarded = XpTransaction::where('donor_id', $donor->id)
                        ->where('reference_type', LivingDonor::class)
                        ->where('reference_id', $livingDonor->id)
                        ->exists();

                    $donationHistory->push([
                        'code' => $livingDonor->code ?? 'N/A',
                        'donation_type' => 'Organ Donation',
                        'status' => 'Pending',
                        'status_color' => '#f5cf26',
                        'date' => $livingDonor->created_at ? $livingDonor->created_at->format('M d') : 'N/A',
                        'reward' => $xpAwarded ? '+250 XP' : 'loading...'
                    ]);
                } catch (\Exception $e) {
                    \Log::warning('Error processing living donor:', [
                        'living_donor_id' => $livingDonor->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        // Sort by date (most recent first) - use created_at from original records for proper sorting
        // We'll keep the formatted dates for display but use a simple reverse since they're already ordered by created_at desc
        return $donationHistory->values();
    }

    /**
     * Get all donations for MyDonations page
     */
    public function myDonations(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            if (strtolower($user->role ?? '') !== 'donor') {
                return response()->json([
                    'message' => 'Unauthorized. Only donors can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            $donor = Donor::where('user_id', $user->id)
                ->with(['user'])
                ->first();
            
            if (!$donor) {
                return response()->json([
                    'message' => 'Donor record not found. Please complete your profile registration.',
                    'error' => 'donor_not_found'
                ], 404);
            }

            $donations = collect([]);

            // Home Appointments
            $homeAppointments = HomeAppointment::where('donor_id', $donor->id)
                ->with(['appointment.hospital', 'hospital', 'rating'])
                ->orderBy('created_at', 'desc')
                ->get();

            foreach ($homeAppointments as $appt) {
                try {
                    $appointment = $appt->appointment;
                    $appointmentDate = $appt->created_at;
                    
                    if ($appointment && $appointment->appointment_date) {
                        $appointmentDate = Carbon::parse($appointment->appointment_date);
                    } else {
                        $appointmentDate = Carbon::parse($appointmentDate);
                    }
                    
                    $hospitalName = 'N/A';
                    if ($appt->hospital && $appt->hospital->name) {
                        $hospitalName = $appt->hospital->name;
                    } elseif ($appointment && $appointment->hospital && $appointment->hospital->name) {
                        $hospitalName = $appointment->hospital->name;
                    }
                    
                    $xpTransaction = XpTransaction::where('donor_id', $donor->id)
                        ->where('reference_type', HomeAppointment::class)
                        ->where('reference_id', $appt->id)
                        ->first();

                    $xpEarned = '-';
                    if ($appt->state === 'completed') {
                        if ($xpTransaction) {
                            $xpEarned = '+' . $xpTransaction->xp_amount . ' xp';
                        } else {
                            // If completed but no XP transaction, check if it should have earned XP
                            // Blood donations earn 500 XP, but let's show 0 if no transaction exists
                            $xpEarned = '+0 xp';
                        }
                    } elseif ($appt->state === 'canceled' || $appt->state === 'cancelled') {
                        $xpEarned = '+0 xp';
                    }

                    $donations->push([
                        'id' => $appt->id,
                        'donationType' => 'Home Donation',
                        'hospitalName' => $hospitalName,
                        'date' => $appointmentDate->format('M d, Y'),
                        'xpEarned' => $xpEarned,
                        'status' => ucfirst($appt->state ?? 'pending'),
                        'canRate' => ($appt->state ?? '') === 'completed',
                        'rating' => $appt->rating ? [
                            'rating' => $appt->rating->rating,
                            'comment' => $appt->rating->comment,
                        ] : null,
                    ]);
                } catch (\Exception $e) {
                    \Log::warning('Error processing home appointment for my donations:', [
                        'appointment_id' => $appt->id,
                        'error' => $e->getMessage()
                    ]);
                    continue;
                }
            }

            // Hospital Appointments
            $hospitalAppointments = HospitalAppointment::where('donor_id', $donor->id)
                ->with(['appointments.hospital', 'hospital'])
                ->orderBy('created_at', 'desc')
                ->get();

            foreach ($hospitalAppointments as $appt) {
                try {
                    $appointment = $appt->appointments;
                    $appointmentDate = $appt->created_at;
                    
                    if ($appointment && $appointment->appointment_date) {
                        $appointmentDate = Carbon::parse($appointment->appointment_date);
                    } else {
                        $appointmentDate = Carbon::parse($appointmentDate);
                    }
                    
                    $hospitalName = 'N/A';
                    if ($appt->hospital && $appt->hospital->name) {
                        $hospitalName = $appt->hospital->name;
                    } elseif ($appointment && $appointment->hospital && $appointment->hospital->name) {
                        $hospitalName = $appointment->hospital->name;
                    }
                    
                    $xpTransaction = XpTransaction::where('donor_id', $donor->id)
                        ->where('reference_type', HospitalAppointment::class)
                        ->where('reference_id', $appt->id)
                        ->first();

                    $xpEarned = '-';
                    if ($appt->state === 'completed') {
                        if ($xpTransaction) {
                            $xpEarned = '+' . $xpTransaction->xp_amount . ' xp';
                        } else {
                            // If completed but no XP transaction, check if it should have earned XP
                            // Blood donations earn 500 XP, but let's show 0 if no transaction exists
                            $xpEarned = '+0 xp';
                        }
                    } elseif ($appt->state === 'canceled' || $appt->state === 'cancelled') {
                        $xpEarned = '+0 xp';
                    }

                    $donations->push([
                        'id' => $appt->id + 100000,
                        'donationType' => 'Hospital Donation',
                        'hospitalName' => $hospitalName,
                        'date' => $appointmentDate->format('M d, Y'),
                        'xpEarned' => $xpEarned,
                        'status' => ucfirst($appt->state ?? 'pending'),
                    ]);
                } catch (\Exception $e) {
                    \Log::warning('Error processing hospital appointment for my donations:', [
                        'appointment_id' => $appt->id,
                        'error' => $e->getMessage()
                    ]);
                    continue;
                }
            }

            // Living Donor Pledges
            if ($user->email) {
                $livingDonors = LivingDonor::where('email', $user->email)
                    ->with('hospital')
                    ->orderBy('created_at', 'desc')
                    ->get();

                foreach ($livingDonors as $livingDonor) {
                    try {
                        $xpTransaction = XpTransaction::where('donor_id', $donor->id)
                            ->where('reference_type', LivingDonor::class)
                            ->where('reference_id', $livingDonor->id)
                            ->first();

                        $xpEarned = '-';
                        if ($xpTransaction) {
                            $xpEarned = '+' . $xpTransaction->xp_amount . ' xp';
                        }

                        $hospitalName = 'N/A';
                        if ($livingDonor->hospital && $livingDonor->hospital->name) {
                            $hospitalName = $livingDonor->hospital->name;
                        }

                        $donations->push([
                            'id' => $livingDonor->id + 200000,
                            'donationType' => 'Live Organ Donation',
                            'hospitalName' => $hospitalName,
                            'date' => $livingDonor->created_at ? $livingDonor->created_at->format('M d, Y') : 'N/A',
                            'xpEarned' => $xpEarned,
                            'status' => 'Pending',
                        ]);
                    } catch (\Exception $e) {
                        \Log::warning('Error processing living donor for my donations:', [
                            'living_donor_id' => $livingDonor->id,
                            'error' => $e->getMessage()
                        ]);
                        continue;
                    }
                }
            }

            // After Death Pledges
            if ($user->email) {
                $afterDeathPledges = AfterDeathPledge::where('email', $user->email)
                    ->orderBy('created_at', 'desc')
                    ->get();

                foreach ($afterDeathPledges as $pledge) {
                    try {
                        $xpTransaction = XpTransaction::where('donor_id', $donor->id)
                            ->where('reference_type', AfterDeathPledge::class)
                            ->where('reference_id', $pledge->id)
                            ->first();

                        $xpEarned = 'loading...';
                        if ($xpTransaction) {
                            $xpEarned = '+' . $xpTransaction->xp_amount . ' xp';
                        }

                        $donations->push([
                            'id' => $pledge->id + 300000,
                            'donationType' => 'After Death Organ Donation',
                            'hospitalName' => 'N/A',
                            'date' => $pledge->created_at ? $pledge->created_at->format('M d, Y') : 'N/A',
                            'xpEarned' => $xpEarned,
                            'status' => ucfirst($pledge->status ?? 'Pending'),
                        ]);
                    } catch (\Exception $e) {
                        \Log::warning('Error processing after death pledge for my donations:', [
                            'pledge_id' => $pledge->id,
                            'error' => $e->getMessage()
                        ]);
                        continue;
                    }
                }
            }

            // Sort by date (most recent first)
            $donations = $donations->sortByDesc(function($donation) {
                try {
                    if ($donation['date'] === 'N/A') {
                        return Carbon::minValue();
                    }
                    return Carbon::parse($donation['date']);
                } catch (\Exception $e) {
                    return Carbon::now();
                }
            })->values();

            return response()->json([
                'donations' => $donations,
                'total' => $donations->count()
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching my donations:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch donations',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get all appointments for MyAppointments page
     */
    public function myAppointments(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to access this endpoint.'
                ], 401);
            }
            
            if (strtolower($user->role ?? '') !== 'donor') {
                return response()->json([
                    'message' => 'Unauthorized. Only donors can access this endpoint.',
                    'user_role' => $user->role
                ], 403);
            }

            $donor = Donor::where('user_id', $user->id)
                ->with(['user'])
                ->first();
            
            if (!$donor) {
                return response()->json([
                    'message' => 'Donor record not found. Please complete your profile registration.',
                    'error' => 'donor_not_found'
                ], 404);
            }

            $appointments = collect([]);
            $organAppointments = [];

            // Home appointments (only pending)
            try {
                $homeAppointments = HomeAppointment::where('donor_id', $donor->id)
                    ->where('state', 'pending')
                    ->with(['appointment.hospital', 'hospital', 'mobilePhlebotomist.user'])
                    ->orderBy('created_at', 'desc')
                    ->get();

                foreach ($homeAppointments as $appt) {
                    try {
                        $appointment = $appt->appointment;
                        $appointmentDate = $appt->created_at;
                        
                        if ($appointment && $appointment->appointment_date) {
                            $appointmentDate = Carbon::parse($appointment->appointment_date);
                        } else {
                            $appointmentDate = Carbon::parse($appointmentDate);
                        }
                        
                        $hospitalName = 'N/A';
                        if ($appt->hospital && $appt->hospital->name) {
                            $hospitalName = $appt->hospital->name;
                        } elseif ($appointment && $appointment->hospital && $appointment->hospital->name) {
                            $hospitalName = $appointment->hospital->name;
                        }
                        
                        $appointmentTime = $appt->appointment_time;
                        if (!$appointmentTime && $appointment && $appointment->appointment_time) {
                            $appointmentTime = $appointment->appointment_time;
                        }
                        if (!$appointmentTime) {
                            $appointmentTime = 'N/A';
                        }

                        $phlebName = null;
                        $phlebPhone = null;
                        $phlebCode = null;
                        if ($appt->mobilePhlebotomist) {
                            $phlebCode = $appt->mobilePhlebotomist->code ?? null;
                            $phlebUser = $appt->mobilePhlebotomist->user;
                            if ($phlebUser) {
                                $phlebName = trim(($phlebUser->first_name ?? '') . ' ' . ($phlebUser->last_name ?? '')) ?: null;
                                $phlebPhone = $phlebUser->phone_nb ?? null;
                            }
                        }

                        $appointments->push([
                            'id' => $appt->id,
                            'code' => $appt->code ?? 'N/A',
                            'donationType' => 'Home Donation',
                            'hospitalName' => $hospitalName,
                            'date' => $appointmentDate->format('M d, Y'),
                            'time' => $appointmentTime,
                            'status' => ucfirst($appt->state ?? 'pending'),
                            'phlebotomist' => [
                                'name' => $phlebName,
                                'phone' => $phlebPhone,
                                'code' => $phlebCode,
                            ],
                        ]);
                    } catch (\Exception $e) {
                        \Log::warning('Error processing home appointment for my appointments:', [
                            'appointment_id' => $appt->id ?? 'unknown',
                            'error' => $e->getMessage()
                        ]);
                        continue;
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('Error fetching home appointments:', [
                    'donor_id' => $donor->id,
                    'error' => $e->getMessage()
                ]);
            }

            // Hospital appointments (only pending)
            try {
                $hospitalAppointments = HospitalAppointment::where('donor_id', $donor->id)
                    ->where('state', 'pending')
                    ->with(['appointments.hospital', 'hospital'])
                    ->orderBy('created_at', 'desc')
                    ->get();

                foreach ($hospitalAppointments as $appt) {
                    try {
                        $appointment = $appt->appointments;
                        $appointmentDate = $appt->created_at;
                        
                        if ($appointment && $appointment->appointment_date) {
                            $appointmentDate = Carbon::parse($appointment->appointment_date);
                        } else {
                            $appointmentDate = Carbon::parse($appointmentDate);
                        }
                        
                        $hospitalName = 'N/A';
                        if ($appt->hospital && $appt->hospital->name) {
                            $hospitalName = $appt->hospital->name;
                        } elseif ($appointment && $appointment->hospital && $appointment->hospital->name) {
                            $hospitalName = $appointment->hospital->name;
                        }
                        
                        $appointmentTime = 'N/A';
                        if ($appointment && $appointment->appointment_time) {
                            $appointmentTime = $appointment->appointment_time;
                        }

                        $appointments->push([
                            'id' => $appt->id + 100000, // Offset to avoid ID conflicts
                            'code' => $appt->code ?? 'N/A',
                            'donationType' => 'Hospital Donation',
                            'hospitalName' => $hospitalName,
                            'date' => $appointmentDate->format('M d, Y'),
                            'time' => $appointmentTime,
                            'status' => ucfirst($appt->state ?? 'pending'),
                        ]);
                    } catch (\Exception $e) {
                        \Log::warning('Error processing hospital appointment for my appointments:', [
                            'appointment_id' => $appt->id ?? 'unknown',
                            'error' => $e->getMessage()
                        ]);
                        continue;
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('Error fetching hospital appointments:', [
                    'donor_id' => $donor->id,
                    'error' => $e->getMessage()
                ]);
            }

            // Sort by date (most recent first)
            $appointments = $appointments->sortByDesc(function($appt) {
                try {
                    if ($appt['date'] === 'N/A') {
                        return Carbon::minValue();
                    }
                    return Carbon::parse($appt['date']);
                } catch (\Exception $e) {
                    return Carbon::now();
                }
            })->values();

            // Living organ appointment suggestions (for donor panel)
            if ($user->email) {
                $livingDonors = LivingDonor::where('email', $user->email)
                    ->orderBy('created_at', 'desc')
                    ->get();

                $organAppointments = $livingDonors->map(function (LivingDonor $ld) {
                    return [
                        'code' => $ld->code,
                        'organ' => $ld->organ,
                        'ethics_status' => $ld->ethics_status,
                        'medical_status' => $ld->medical_status,
                        'appointment_status' => $ld->appointment_status,
                        'suggested_appointments' => $ld->suggested_appointments ?? [],
                        'selected_appointment_at' => $ld->selected_appointment_at ? $ld->selected_appointment_at->toISOString() : null,
                        'created_at' => $ld->created_at ? $ld->created_at->toISOString() : null,
                    ];
                })->values();
            }

            return response()->json([
                'appointments' => $appointments,
                'organ_appointments' => $organAppointments,
                'total' => $appointments->count()
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching my appointments:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch appointments',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Step 4: Donor chooses one suggested appointment time for a living donor pledge.
     */
    public function chooseLivingDonorAppointment(Request $request, string $code)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            if (strtolower($user->role ?? '') !== 'donor') {
                return response()->json(['message' => 'Unauthorized. Only donors can access this endpoint.'], 403);
            }

            $validated = $request->validate([
                'selected_appointment_at' => 'required|string',
            ]);

            $livingDonor = LivingDonor::where('code', $code)->firstOrFail();

            // Ensure this pledge belongs to the logged-in donor
            if (strtolower((string)$livingDonor->email) !== strtolower((string)$user->email)) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            if (($livingDonor->appointment_status ?? '') === 'cancelled') {
                return response()->json(['message' => 'This appointment workflow is cancelled.'], 422);
            }
            if (($livingDonor->appointment_status ?? '') === 'completed') {
                return response()->json(['message' => 'This appointment is already completed.'], 422);
            }

            $suggested = $livingDonor->suggested_appointments ?? [];
            $choice = trim((string)$validated['selected_appointment_at']);
            if (!in_array($choice, $suggested, true)) {
                return response()->json(['message' => 'Selected appointment must be one of the suggested options.'], 422);
            }

            $livingDonor->selected_appointment_at = Carbon::parse($choice);
            $livingDonor->selected_at = now();
            $livingDonor->appointment_status = 'in_progress';
            $livingDonor->medical_status = 'in_progress';
            $livingDonor->save();

            return response()->json([
                'message' => 'Appointment choice saved.',
                'living_donor' => $livingDonor->fresh(),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Living donor pledge not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error choosing living donor appointment:', [
                'user_id' => Auth::id(),
                'code' => $code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Failed to choose appointment'], 500);
        }
    }

    /**
     * Get status color for donation status
     */
    private function getStatusColor($state)
    {
        return match($state) {
            'completed' => '#16a34a', // green
            'pending' => '#f5cf26',   // yellow
            'canceled' => '#E92C30',  // red
            default => '#666666'      // gray
        };
    }
}
