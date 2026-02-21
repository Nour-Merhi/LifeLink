<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('home_appointments', function (Blueprint $table) {
            $table->string('state', 50)->default('pending')->change();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM pg_constraint 
                        WHERE conname = 'home_appointments_state_check'
                    ) THEN
                        ALTER TABLE home_appointments
                        ADD CONSTRAINT home_appointments_state_check
                        CHECK (state IN ('pending', 'confirmed', 'completed', 'canceled'));
                    END IF;
                END$$;
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('home_appointments', function (Blueprint $table) {
            $table->string('state', 50)->default('pending')->change();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                ALTER TABLE home_appointments
                DROP CONSTRAINT IF EXISTS home_appointments_state_check
            ");
        }
    }
};