<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hospital_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('hospital_settings', 'emergency_contact')) {
                $table->string('emergency_contact')->nullable()->after('working_hours');
            }
            if (!Schema::hasColumn('hospital_settings', 'blood_bank_capacity')) {
                $table->unsignedInteger('blood_bank_capacity')->nullable()->after('emergency_contact');
            }
            if (!Schema::hasColumn('hospital_settings', 'auto_reorder_threshold')) {
                $table->unsignedInteger('auto_reorder_threshold')->nullable()->after('blood_bank_capacity');
            }
        });
    }

    public function down(): void
    {
        Schema::table('hospital_settings', function (Blueprint $table) {
            if (Schema::hasColumn('hospital_settings', 'auto_reorder_threshold')) {
                $table->dropColumn('auto_reorder_threshold');
            }
            if (Schema::hasColumn('hospital_settings', 'blood_bank_capacity')) {
                $table->dropColumn('blood_bank_capacity');
            }
            if (Schema::hasColumn('hospital_settings', 'emergency_contact')) {
                $table->dropColumn('emergency_contact');
            }
        });
    }
};

