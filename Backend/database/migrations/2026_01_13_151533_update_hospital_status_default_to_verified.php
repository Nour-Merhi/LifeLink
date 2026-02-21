<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Make status column a string temporarily
        Schema::table('hospitals', function (Blueprint $table) {
            $table->string('status', 50)->default('verified')->change();
        });

        // Optional: update existing null/unverified values to verified
        DB::table('hospitals')
            ->whereNull('status')
            ->orWhere('status', 'unverified')
            ->update(['status' => 'verified']);

        // Add PostgreSQL check constraint to simulate ENUM
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM pg_constraint 
                        WHERE conname = 'hospitals_status_check'
                    ) THEN
                        ALTER TABLE hospitals
                        ADD CONSTRAINT hospitals_status_check
                        CHECK (status IN ('verified', 'unverified'));
                    END IF;
                END$$;
            ");
        }
    }

    public function down(): void
    {
        // Make column string
        Schema::table('hospitals', function (Blueprint $table) {
            $table->string('status', 50)->default('unverified')->change();
        });

        // Drop PostgreSQL check constraint if exists
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                ALTER TABLE hospitals
                DROP CONSTRAINT IF EXISTS hospitals_status_check
            ");
        }
    }
};