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

        if (DB::getDriverName() === 'pgsql') {
            // PostgreSQL version
            DB::statement("
                UPDATE home_appointment_ratings AS r
                SET phlebotomist_id = ha.phlebotomist_id
                FROM home_appointments AS ha
                WHERE ha.id = r.home_appointment_id
                  AND r.phlebotomist_id IS NULL
                  AND ha.phlebotomist_id IS NOT NULL
            ");
        } else {
            // MySQL version
            DB::table('home_appointment_ratings as r')
                ->join('home_appointments as ha', 'ha.id', '=', 'r.home_appointment_id')
                ->whereNull('r.phlebotomist_id')
                ->whereNotNull('ha.phlebotomist_id')
                ->update(['r.phlebotomist_id' => DB::raw('ha.phlebotomist_id')]);
        }
    }

    public function down(): void
    {
        // no-op (data backfill)
    }
};