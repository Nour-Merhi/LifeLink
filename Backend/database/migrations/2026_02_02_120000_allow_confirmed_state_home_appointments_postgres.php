<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Allow 'confirmed' state on home_appointments (PostgreSQL).
     * Run this if the original add_confirmed_status migration did not apply
     * (e.g. enum->string change failed). Safe to run multiple times.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // Ensure state column accepts varchar and add CHECK including 'confirmed'
        DB::statement("
            DO $$
            BEGIN
                -- Change column to varchar if it is still an enum (allow 'confirmed')
                BEGIN
                    ALTER TABLE home_appointments
                    ALTER COLUMN state TYPE character varying(50) USING state::text;
                EXCEPTION
                    WHEN others THEN NULL; -- column may already be varchar
                END;

                -- Drop old check if it exists (without 'confirmed')
                ALTER TABLE home_appointments DROP CONSTRAINT IF EXISTS home_appointments_state_check;

                -- Add check that includes 'confirmed'
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conrelid = 'home_appointments'::regclass
                    AND conname = 'home_appointments_state_check'
                ) THEN
                    ALTER TABLE home_appointments
                    ADD CONSTRAINT home_appointments_state_check
                    CHECK (state IN ('pending', 'confirmed', 'completed', 'canceled'));
                END IF;
            END$$;
        ");
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("
            ALTER TABLE home_appointments DROP CONSTRAINT IF EXISTS home_appointments_state_check;
        ");
    }
};
