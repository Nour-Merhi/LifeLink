<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->date('appointment_date');
            $table->enum('appointment_type', ['urgent', 'regular'])->default('regular');
            $table->json('time_slots')->nullable();
            $table->foreignId('hospital_id')->references('id')->on('hospitals')->onDelete('cascade');
            $table->enum('donation_type', ['Home Blood Donation', 'Hospital Blood Donation', 'Alive Organ Donation'])->default('Hospital Blood Donation');
            $table->enum('state', ['pending', 'completed', 'canceled'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
