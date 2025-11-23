<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospital_appointments', function(Blueprint $table){
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('hospital_Id')->references('id')->on('hospitals')->onDelete('cascade');
            $table->foreignId('appointment_id')->references('id')->on('appointments')->onDelete('cascade');
            $table->enum('state', ['pending', 'completed', 'canceled'])->default('pending');
            $table->string('note')->nullable();
            $table->foreignId('donor_id')->references('id')->on('donors')->onDelete('cascade');
            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('hospital_appointments');
    }
};
