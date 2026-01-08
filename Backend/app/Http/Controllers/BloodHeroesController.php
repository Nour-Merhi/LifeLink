<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Models\HospitalAppointment;
use App\Models\HomeAppointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BloodHeroesController extends Controller
{
    /**
     * Get top blood donors with their donation counts
     */
    public function index()
    {
        try {
            // Get all donors with their user and blood type information
            $donors = Donor::with(['user', 'bloodType'])
                ->whereHas('user') // Only donors with user accounts
                ->get();

            // Calculate donation counts and last donation dates for each donor
            $donorsWithStats = $donors->map(function ($donor) {
                // Count completed hospital appointments
                $hospitalDonations = HospitalAppointment::where('donor_id', $donor->id)
                    ->where('state', 'completed')
                    ->count();

                // Count completed home appointments
                $homeDonations = HomeAppointment::where('donor_id', $donor->id)
                    ->where('state', 'completed')
                    ->count();

                $totalDonations = $hospitalDonations + $homeDonations;

                // Get the most recent completed donation date
                $lastHospitalDonation = HospitalAppointment::where('donor_id', $donor->id)
                    ->where('state', 'completed')
                    ->orderBy('created_at', 'desc')
                    ->first();

                $lastHomeDonation = HomeAppointment::where('donor_id', $donor->id)
                    ->where('state', 'completed')
                    ->orderBy('created_at', 'desc')
                    ->first();

                $lastDonationDate = null;
                if ($lastHospitalDonation && $lastHomeDonation) {
                    $lastDonationDate = $lastHospitalDonation->created_at > $lastHomeDonation->created_at 
                        ? $lastHospitalDonation->created_at 
                        : $lastHomeDonation->created_at;
                } elseif ($lastHospitalDonation) {
                    $lastDonationDate = $lastHospitalDonation->created_at;
                } elseif ($lastHomeDonation) {
                    $lastDonationDate = $lastHomeDonation->created_at;
                }

                return [
                    'id' => $donor->id,
                    'name' => $donor->user 
                        ? ($donor->user->first_name . ' ' . ($donor->user->middle_name ? $donor->user->middle_name . ' ' : '') . $donor->user->last_name)
                        : 'Unknown',
                    'bloodType' => $donor->bloodType 
                        ? ($donor->bloodType->type . $donor->bloodType->rh_factor)
                        : 'N/A',
                    'donations' => $totalDonations,
                    'lastDonated' => $lastDonationDate 
                        ? $lastDonationDate->format('M d, Y')
                        : null,
                    'daysAgo' => $lastDonationDate 
                        ? intval($lastDonationDate->diffInDays(Carbon::now()))
                        : null,
                ];
            })
            ->filter(function ($donor) {
                // Only include donors with at least one donation
                return $donor['donations'] > 0;
            })
            ->sortByDesc('donations') // Sort by donation count descending
            ->values()
            ->take(10); // Get top 10

            // Calculate overall statistics
            $totalDonations = HospitalAppointment::where('state', 'completed')->count() 
                + HomeAppointment::where('state', 'completed')->count();
            
            $activeDonors = Donor::whereHas('hospitalAppointments', function($query) {
                    $query->where('state', 'completed');
                })
                ->orWhereHas('homeAppointments', function($query) {
                    $query->where('state', 'completed');
                })
                ->distinct()
                ->count();

            // Estimate lives saved (each donation can save up to 3 lives)
            $livesSaved = $totalDonations * 3;

            return response()->json([
                'topDonors' => $donorsWithStats,
                'stats' => [
                    'totalDonations' => $totalDonations,
                    'activeDonors' => $activeDonors,
                    'livesSaved' => $livesSaved,
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching top blood donors:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'topDonors' => [],
                'stats' => [
                    'totalDonations' => 0,
                    'activeDonors' => 0,
                    'livesSaved' => 0,
                ],
                'error' => 'Failed to fetch top blood donors'
            ], 500);
        }
    }
}

