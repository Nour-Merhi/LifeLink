<?php

namespace App\Http\Controllers;

use App\Models\Donor;
use App\Models\HomeAppointment;
use App\Models\HomeAppointmentRating;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HomeAppointmentRatingController extends Controller
{
    /**
     * Create or update a rating for a completed home appointment.
     * Donor can only rate their own appointment.
     */
    public function upsert(Request $request, HomeAppointment $homeAppointment)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (strtolower($user->role ?? '') !== 'donor') {
            return response()->json(['message' => 'Unauthorized. Only donors can rate appointments.'], 403);
        }

        $donor = Donor::where('user_id', $user->id)->first();
        if (!$donor) {
            return response()->json(['message' => 'Donor record not found'], 404);
        }

        // Ownership check
        if ((int) $homeAppointment->donor_id !== (int) $donor->id) {
            return response()->json(['message' => 'You can only rate your own appointments'], 403);
        }

        // State check
        if (($homeAppointment->state ?? '') !== 'completed') {
            return response()->json(['message' => 'You can only rate completed appointments'], 422);
        }

        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $rating = HomeAppointmentRating::updateOrCreate(
            ['home_appointment_id' => $homeAppointment->id],
            [
                'donor_id' => $donor->id,
                'rating' => (int) $data['rating'],
                'comment' => $data['comment'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Rating saved',
            'rating' => [
                'id' => $rating->id,
                'home_appointment_id' => $rating->home_appointment_id,
                'rating' => $rating->rating,
                'comment' => $rating->comment,
                'created_at' => $rating->created_at,
                'updated_at' => $rating->updated_at,
            ],
        ], 200);
    }

    /**
     * Get rating for a home appointment (owner only).
     */
    public function show(Request $request, HomeAppointment $homeAppointment)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (strtolower($user->role ?? '') !== 'donor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $donor = Donor::where('user_id', $user->id)->first();
        if (!$donor) {
            return response()->json(['message' => 'Donor record not found'], 404);
        }

        if ((int) $homeAppointment->donor_id !== (int) $donor->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $rating = $homeAppointment->rating;
        return response()->json([
            'rating' => $rating ? [
                'id' => $rating->id,
                'home_appointment_id' => $rating->home_appointment_id,
                'rating' => $rating->rating,
                'comment' => $rating->comment,
                'created_at' => $rating->created_at,
                'updated_at' => $rating->updated_at,
            ] : null,
        ]);
    }
}

