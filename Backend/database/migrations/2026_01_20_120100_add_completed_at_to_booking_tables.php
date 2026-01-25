<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Track when a booking was marked as "completed".
     *
     * We do NOT rely on updated_at because other edits (like usage toggles)
     * would change it and break reporting.
     */
    public function up(): void
    {
        Schema::table('home_appointments', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable()->after('state');
        });

        Schema::table('hospital_appointments', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable()->after('state');
        });

        // Backfill existing completed rows: completed_at = updated_at (best available signal)
        DB::table('home_appointments')
            ->where('state', 'completed')
            ->whereNull('completed_at')
            ->update(['completed_at' => DB::raw('updated_at')]);

        DB::table('hospital_appointments')
            ->where('state', 'completed')
            ->whereNull('completed_at')
            ->update(['completed_at' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('home_appointments', function (Blueprint $table) {
            $table->dropColumn(['completed_at']);
        });

        Schema::table('hospital_appointments', function (Blueprint $table) {
            $table->dropColumn(['completed_at']);
        });
    }
};

