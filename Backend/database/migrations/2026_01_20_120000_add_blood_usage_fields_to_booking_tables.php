<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds per-booking blood unit usage tracking for blood donations.
     *
     * We keep it on booking tables (home_appointments / hospital_appointments)
     * so Inventory can show donors + completion time + usage state without introducing
     * a new table.
     */
    public function up(): void
    {
        Schema::table('home_appointments', function (Blueprint $table) {
            $table->unsignedInteger('blood_units_collected')->default(1)->after('state');
            $table->string('blood_usage_status', 20)->default('unused')->after('blood_units_collected'); // unused|used
            $table->timestamp('blood_used_at')->nullable()->after('blood_usage_status');
        });

        Schema::table('hospital_appointments', function (Blueprint $table) {
            $table->unsignedInteger('blood_units_collected')->default(1)->after('state');
            $table->string('blood_usage_status', 20)->default('unused')->after('blood_units_collected'); // unused|used
            $table->timestamp('blood_used_at')->nullable()->after('blood_usage_status');
        });
    }

    public function down(): void
    {
        Schema::table('home_appointments', function (Blueprint $table) {
            $table->dropColumn(['blood_units_collected', 'blood_usage_status', 'blood_used_at']);
        });

        Schema::table('hospital_appointments', function (Blueprint $table) {
            $table->dropColumn(['blood_units_collected', 'blood_usage_status', 'blood_used_at']);
        });
    }
};

