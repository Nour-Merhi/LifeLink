<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('financial_donations', function (Blueprint $table) {
            // Add foreign key constraint if patient_cases table exists
            if (Schema::hasTable('patient_cases')) {
                $table->foreign('patient_case_id')
                    ->references('id')
                    ->on('patient_cases')
                    ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_donations', function (Blueprint $table) {
            $table->dropForeign(['patient_case_id']);
        });
    }
};
