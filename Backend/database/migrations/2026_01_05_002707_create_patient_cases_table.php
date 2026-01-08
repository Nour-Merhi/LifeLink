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
        Schema::create('patient_cases', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('full_name');
            $table->date('date_of_birth');
            $table->enum('gender', ['male', 'female'])->default('male');
            $table->string('case_title'); // e.g., "Kidney Transplant", "Cancer Treatment"
            $table->text('description');
            $table->enum('severity', ['high', 'medium', 'low'])->default('medium');
            $table->decimal('target_amount', 10, 2);
            $table->decimal('current_funding', 10, 2)->default(0.00);
            $table->string('hospital_name');
            $table->foreignId('hospital_id')->nullable()->references('id')->on('hospitals')->onDelete('set null');
            $table->date('due_date'); // Deadline for funding
            $table->enum('status', ['active', 'done', 'cancelled'])->default('active');
            $table->string('image')->nullable(); // Patient image URL
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_cases');
    }
};
