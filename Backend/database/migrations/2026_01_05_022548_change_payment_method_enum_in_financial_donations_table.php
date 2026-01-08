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
        // Temporarily change to VARCHAR to allow value updates
        DB::statement("ALTER TABLE `financial_donations` MODIFY COLUMN `payment_method` VARCHAR(50) DEFAULT 'credit card'");

        // Update any existing 'paypal' values to 'cash'
        DB::table('financial_donations')
            ->where('payment_method', 'paypal')
            ->update(['payment_method' => 'cash']);

        // Change back to ENUM with new values
        DB::statement("ALTER TABLE `financial_donations` MODIFY COLUMN `payment_method` ENUM('credit card', 'wish', 'cash') DEFAULT 'credit card'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Temporarily change to VARCHAR
        DB::statement("ALTER TABLE `financial_donations` MODIFY COLUMN `payment_method` VARCHAR(50) DEFAULT 'credit card'");

        // Update any existing 'cash' values to 'paypal'
        DB::table('financial_donations')
            ->where('payment_method', 'cash')
            ->update(['payment_method' => 'paypal']);

        // Change back to ENUM with old values
        DB::statement("ALTER TABLE `financial_donations` MODIFY COLUMN `payment_method` ENUM('credit card', 'wish', 'paypal') DEFAULT 'credit card'");
    }
};
