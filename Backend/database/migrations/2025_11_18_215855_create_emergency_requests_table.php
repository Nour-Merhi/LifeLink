<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emergency_requests', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('patient_name');
            $table->foreignId('hospital_id')->references('id')->on('hospitals')->onDelete('cascade');
            $table->string('required_blood_type')->nullable();
            $table->string('required_organ')->nullable();
            $table->integer('required_quantity')->default(1);
            $table->dateTime('deadline');
            $table->enum('status', ['pending', 'fulfilled', 'failed'])->default('pending');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emergency_requests');
    }
};
