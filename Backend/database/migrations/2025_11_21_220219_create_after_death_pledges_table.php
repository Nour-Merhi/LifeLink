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
        Schema::create('after_death_pledges', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            
            // Personal Information (Step 1)
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('email');
            $table->string('phone_nb');
            $table->date('date_of_birth');
            $table->enum('gender', ['male', 'female']);
            $table->text('address');
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            
            // Personal Details (Step 2)
            $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable();
            $table->string('education_level')->nullable();
            $table->enum('professional_status', ['no-work', 'working'])->nullable();
            $table->string('work_type')->nullable();
            $table->string('mother_name')->nullable(); // For single people
            $table->string('spouse_name')->nullable(); // For married/divorced/widowed
            
            // ID Photos (stored as file paths)
            $table->string('id_photo_path')->nullable();
            $table->string('father_id_photo_path')->nullable(); // For under 18
            $table->string('mother_id_photo_path')->nullable(); // For under 18
            
            // Organ Selection (Step 3) - stored as JSON array
            $table->json('pledged_organs');
            
            // Blood Type (if available)
            $table->string('blood_type')->nullable();
            
            // Status
            $table->enum('status', ['active', 'cancelled'])->default('active');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('after_death_pledges');
    }
};
