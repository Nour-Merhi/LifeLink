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
        Schema::create('mobile_phlebotomists', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('license_number');
            $table->time('start_time');
            $table->time('end_time');
            $table->json('working_dates');
            $table->integer('max_appointments');
            $table->enum('availability', ['unavailable', 'available', 'onDuty'])->default('available');
            $table->foreignId('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreignId('hospital_id')->references('id')->on('hospitals')->onDelete('cascade');
            $table->foreignId('manager_id')->references('id')->on('health_center_managers')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mobile_phlebotomists');
    }
};
