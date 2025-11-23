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
        Schema::create('donors', function (Blueprint $table){
            $table->id();
            $table->foreignId('userID')->refernces('id')->on('users')->onDelete('cascade');
            $table->boolean('organ_consent');
            $table->boolean('availability');
            $table->date('last_donation')->nullable();
            $table->integer('donation_nb');
            $table->boolean('eligibility');
            $table->string('gender');
            $table->date('date_of_birth');
            $table->foreignId('blood_type_id')->references('id')->on('blood_types')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('donors');
    }
};
