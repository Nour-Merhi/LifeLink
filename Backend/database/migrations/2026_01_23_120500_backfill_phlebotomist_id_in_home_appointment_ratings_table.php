<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('home_appointment_ratings', 'phlebotomist_id')) {
            return;
        }

        // Backfill snapshot for existing rows.
        // Use the appointment's assigned phlebotomist_id at the time of backfill.
        DB::table('home_appointment_ratings')
            ->join('home_appointments', 'home_appointments.id', '=', 'home_appointment_ratings.home_appointment_id')
            ->whereNull('home_appointment_ratings.phlebotomist_id')
            ->whereNotNull('home_appointments.phlebotomist_id')
            ->update([
                'home_appointment_ratings.phlebotomist_id' => DB::raw('home_appointments.phlebotomist_id'),
            ]);
    }

    public function down(): void
    {
        // no-op (data backfill)
    }
};

