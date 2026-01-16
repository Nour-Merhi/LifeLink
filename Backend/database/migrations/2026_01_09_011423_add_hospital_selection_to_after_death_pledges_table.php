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
        Schema::table('after_death_pledges', function (Blueprint $table) {
            // Check if columns don't exist before adding them
            if (!Schema::hasColumn('after_death_pledges', 'hospital_selection')) {
                $table->enum('hospital_selection', ['general', 'specific'])->nullable()->after('blood_type');
            }
            if (!Schema::hasColumn('after_death_pledges', 'hospital_id')) {
                $table->foreignId('hospital_id')->nullable()->after('hospital_selection')->references('id')->on('hospitals')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('after_death_pledges', function (Blueprint $table) {
            if (Schema::hasColumn('after_death_pledges', 'hospital_id')) {
                $table->dropForeign(['hospital_id']);
                $table->dropColumn('hospital_id');
            }
            if (Schema::hasColumn('after_death_pledges', 'hospital_selection')) {
                $table->dropColumn('hospital_selection');
            }
        });
    }
};
