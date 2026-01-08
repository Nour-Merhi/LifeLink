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
        Schema::create('financial_donations', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('donor_id')->nullable()->references('id')->on('donors')->onDelete('set null');
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->enum('donation_type', ['one time', 'monthly'])->default('one time');
            $table->decimal('donation_amount', 10, 2);
            $table->enum('recipient_chosen', ['general patient', 'specific patient'])->default('general patient');
            $table->unsignedBigInteger('patient_case_id')->nullable(); // Will add foreign key when patient_cases table is created
            $table->enum('payment_method', ['credit card', 'wish', 'paypal'])->default('credit card');
            $table->enum('preference', ['anonymous', 'stay_updated'])->nullable();
            $table->enum('status', ['pending', 'completed', 'failed', 'canceled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_donations');
    }
};
