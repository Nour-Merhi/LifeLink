<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('home_appointments', function (Blueprint $table) {
            $table->date('expires_at')->nullable()->after('completed_at');
        });

        Schema::table('hospital_appointments', function (Blueprint $table) {
            $table->date('expires_at')->nullable()->after('completed_at');
        });

        // Backfill: expires_at = completed_at + 42 days
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                UPDATE home_appointments
                SET expires_at = COALESCE(completed_at, updated_at) + INTERVAL '42 days'
                WHERE state = 'completed' AND expires_at IS NULL
            ");
            DB::statement("
                UPDATE hospital_appointments
                SET expires_at = COALESCE(completed_at, updated_at) + INTERVAL '42 days'
                WHERE state = 'completed' AND expires_at IS NULL
            ");
        } else {
            // MySQL version
            DB::statement("
                UPDATE home_appointments
                SET expires_at = DATE(DATE_ADD(COALESCE(completed_at, updated_at), INTERVAL 42 DAY))
                WHERE state = 'completed' AND expires_at IS NULL
            ");
            DB::statement("
                UPDATE hospital_appointments
                SET expires_at = DATE(DATE_ADD(COALESCE(completed_at, updated_at), INTERVAL 42 DAY))
                WHERE state = 'completed' AND expires_at IS NULL
            ");
        }
    }

    public function down(): void
    {
        Schema::table('home_appointments', function (Blueprint $table) {
            $table->dropColumn(['expires_at']);
        });

        Schema::table('hospital_appointments', function (Blueprint $table) {
            $table->dropColumn(['expires_at']);
        });
    }
};
