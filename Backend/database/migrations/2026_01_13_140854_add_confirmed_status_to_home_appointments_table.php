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
        // Modify the enum to include 'confirmed'
        DB::statement("ALTER TABLE `home_appointments` MODIFY COLUMN `state` ENUM('pending', 'confirmed', 'completed', 'canceled') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum (without 'confirmed')
        // Note: This will fail if there are any records with 'confirmed' status
        DB::statement("ALTER TABLE `home_appointments` MODIFY COLUMN `state` ENUM('pending', 'completed', 'canceled') DEFAULT 'pending'");
    }
};
