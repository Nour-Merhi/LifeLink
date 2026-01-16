<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hospital_appointments', function (Blueprint $table) {
            $table->string('appointment_time')->nullable()->after('appointment_id');
        });
    }

    public function down(): void
    {
        Schema::table('hospital_appointments', function (Blueprint $table) {
            $table->dropColumn('appointment_time');
        });
    }
};

