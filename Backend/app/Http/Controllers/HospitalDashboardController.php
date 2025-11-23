<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Hospital;
use App\Models\Appointment;
use App\Models\HomeAppointment;
use App\Models\HospitalAppointment;
use App\Models\Donor;
use App\Models\EmergencyRequest;
use App\Models\BloodInventory;
use App\Models\CustomNotification;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HospitalDashboardController extends Controller
{
    /**
     * Get dashboard overview for a specific hospital
     */
    public function overview(Request $request, $hospitalId = null)
    {
        // For now, get hospital from request or use first hospital
        // Later: get from authenticated user's hospital
        $hospitalId = $hospitalId ?? $request->input('hospital_id');
        
        if (!$hospitalId) {
            return response()->json(['message' => 'Hospital ID required'], 400);
        }

        $hospital = Hospital::find($hospitalId);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found'], 404);
        }

        // Summary Cards
        $totalUpcomingAppointments = Appointment::where('hospital_id', $hospitalId)
            ->where('state', '!=', 'canceled')
            ->where('appointment_date', '>=', now()->toDateString())
            ->count();

        $totalCompletedDonations = HomeAppointment::where('hospital_id', $hospitalId)
            ->where('state', 'completed')
            ->count() + HospitalAppointment::where('hospital_id', $hospitalId)
            ->where('state', 'completed')
            ->count();

        $totalCancelledAppointments = Appointment::where('hospital_id', $hospitalId)
            ->where('state', 'canceled')
            ->count();

        $todayAppointments = Appointment::where('hospital_id', $hospitalId)
            ->where('appointment_date', now()->toDateString())
            ->where('state', '!=', 'canceled')
            ->count();

        $urgentCases = EmergencyRequest::where('hospital_id', $hospitalId)
            ->where('status', 'pending')
            ->count();

        $donorsWaiting = Donor::whereHas('hospitalAppointments', function($q) use ($hospitalId) {
            $q->where('hospital_id', $hospitalId)->where('state', 'pending');
        })->count();

        $bloodInventoryCount = BloodInventory::where('hospital_id', $hospitalId)
            ->where('status', 'available')
            ->sum('quantity');

        // Monthly Donation Trends (Last 12 months)
        $monthlyTrends = [];
        for ($i = 11; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            
            $homeDonations = HomeAppointment::where('hospital_id', $hospitalId)
                ->where('state', 'completed')
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->count();
            
            $hospitalDonations = HospitalAppointment::where('hospital_id', $hospitalId)
                ->where('state', 'completed')
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->count();
            
            $monthlyTrends[] = [
                'month' => $monthStart->format('M Y'),
                'home_visits' => $homeDonations,
                'hospital' => $hospitalDonations,
                'total' => $homeDonations + $hospitalDonations,
            ];
        }

        // Donation Types Distribution
        $donationTypes = [
            'blood' => Appointment::where('hospital_id', $hospitalId)
                ->where('donation_type', 'like', '%Blood%')
                ->where('state', 'completed')
                ->count(),
            'platelets' => Appointment::where('hospital_id', $hospitalId)
                ->where('donation_type', 'like', '%Platelet%')
                ->count(),
            'organs' => Appointment::where('hospital_id', $hospitalId)
                ->where('donation_type', 'like', '%Organ%')
                ->count(),
            'home_visit' => HomeAppointment::where('hospital_id', $hospitalId)
                ->where('state', 'completed')
                ->count(),
        ];

        // Blood Type Distribution
        $bloodTypeDistribution = BloodInventory::where('hospital_id', $hospitalId)
            ->join('blood_types', 'blood_inventory.blood_type_id', '=', 'blood_types.id')
            ->select('blood_types.type', 'blood_types.rh_factor', DB::raw('SUM(blood_inventory.quantity) as total'))
            ->groupBy('blood_types.type', 'blood_types.rh_factor')
            ->get()
            ->map(function($item) {
                return [
                    'blood_type' => $item->type . $item->rh_factor,
                    'quantity' => $item->total,
                ];
            });

        // Popular Appointment Times
        $popularTimes = Appointment::where('hospital_id', $hospitalId)
            ->whereNotNull('time_slots')
            ->get()
            ->flatMap(function($apt) {
                return $apt->time_slots ?? [];
            })
            ->countBy()
            ->sortDesc()
            ->take(10)
            ->map(function($count, $time) {
                return ['time' => $time, 'count' => $count];
            })
            ->values();

        return response()->json([
            'hospital' => $hospital,
            'summary' => [
                'total_upcoming_appointments' => $totalUpcomingAppointments,
                'total_completed_donations' => $totalCompletedDonations,
                'total_cancelled_appointments' => $totalCancelledAppointments,
                'today_appointments' => $todayAppointments,
                'urgent_cases' => $urgentCases,
                'donors_waiting' => $donorsWaiting,
                'blood_inventory_count' => $bloodInventoryCount,
            ],
            'monthly_trends' => $monthlyTrends,
            'donation_types' => $donationTypes,
            'blood_type_distribution' => $bloodTypeDistribution,
            'popular_times' => $popularTimes,
        ], 200);
    }
}
