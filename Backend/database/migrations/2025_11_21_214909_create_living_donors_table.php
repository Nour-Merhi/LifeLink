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
        Schema::create('living_donors', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            
            // Personal Information
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('email');
            $table->string('phone_nb');
            $table->date('date_of_birth');
            $table->enum('gender', ['male', 'female']);
            $table->text('address');
            
            // Health Information
            $table->string('blood_type'); // A+, A-, B+, B-, AB+, AB-, O+, O-
            $table->string('organ'); // kidney, liver-partial, bone-marrow
            $table->json('medical_conditions')->nullable(); // Array of conditions
            
            // Donation Information
            $table->enum('donation_type', ['directed', 'non-directed']); // directed = direct-donation, non-directed = non-direct-donation
            
            // Status Fields
            $table->enum('medical_status', ['not_started', 'in_progress', 'cleared', 'rejected'])->default('not_started');
            $table->enum('ethics_status', ['pending', 'approved', 'rejected'])->default('pending');
            
            // Hospital Assignment (nullable initially)
            $table->foreignId('hospital_id')->nullable()->references('id')->on('hospitals')->onDelete('set null');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('living_donors');
    }
};
