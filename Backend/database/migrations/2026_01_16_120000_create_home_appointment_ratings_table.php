<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('home_appointment_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('home_appointment_id')
                ->constrained('home_appointments')
                ->cascadeOnDelete();
            $table->foreignId('donor_id')
                ->constrained('donors')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('rating'); // 1..5
            $table->text('comment')->nullable();
            $table->timestamps();

            // One rating per home appointment
            $table->unique('home_appointment_id');
            $table->index(['donor_id', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('home_appointment_ratings');
    }
};

