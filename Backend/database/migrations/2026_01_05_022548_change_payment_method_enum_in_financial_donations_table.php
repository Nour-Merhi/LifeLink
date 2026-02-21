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
        // Make payment_method a string temporarily
        Schema::table('financial_donations', function (Blueprint $table) {
            $table->string('payment_method', 50)->default('credit card')->change();
        });

        // Update existing values: 'paypal' → 'cash'
        DB::table('financial_donations')
            ->where('payment_method', 'paypal')
            ->update(['payment_method' => 'cash']);

        // Add check constraint for PostgreSQL to simulate ENUM
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                ALTER TABLE financial_donations
                ADD CONSTRAINT payment_method_check
                CHECK (payment_method IN ('credit card','wish','cash'))
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Make payment_method a string again
        Schema::table('financial_donations', function (Blueprint $table) {
            $table->string('payment_method', 50)->default('credit card')->change();
        });

        // Revert values: 'cash' → 'paypal'
        DB::table('financial_donations')
            ->where('payment_method', 'cash')
            ->update(['payment_method' => 'paypal']);

        // Drop PostgreSQL check constraint if exists
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                ALTER TABLE financial_donations
                DROP CONSTRAINT IF EXISTS payment_method_check
            ");
        }
    }
};