<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Drop the old PostgreSQL check constraint on financial_donations.payment_method
     * (named financial_donations_payment_method_check from the original enum).
     * The migration 2026_01_05_022548 added 'cash' via a new constraint (payment_method_check)
     * but did not drop the original enum constraint, so 'cash' was rejected.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                ALTER TABLE financial_donations
                DROP CONSTRAINT IF EXISTS financial_donations_payment_method_check
            ");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                ALTER TABLE financial_donations
                ADD CONSTRAINT financial_donations_payment_method_check
                CHECK (payment_method IN ('credit card', 'wish', 'paypal'))
            ");
        }
    }
};
