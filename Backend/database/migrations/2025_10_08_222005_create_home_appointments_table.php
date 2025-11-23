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
        Schema::create('home_appointments', function(Blueprint $table){
            $table->id();
            $table->string('code')->unique();
            $table->foreignID('donor_id')->references('id')->on('donors')->onDelete('cascade');
            $table->foreignId('hospital_id')->references('id')->on('hospitals')->onDelete('cascade');
            $table->foreignId('appointment_id')->references('id')->on('appointments')->onDelete('cascade');
            $table->string('weight(kg)');
            $table->string('address');
            $table->string('emerg_contact')->nullable();
            $table->string('emerg_phone')->nullable();
            $table->json('medical_conditions')->nullable();
            $table->string('note')->nullable();
            $table->enum('state', ['pending', 'completed', 'canceled'])->default('pending');
            $table->foreignId('phlebotomist_id')->references('id')->on('mobile_phlebotomists')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('home_appointments');
    }
};
