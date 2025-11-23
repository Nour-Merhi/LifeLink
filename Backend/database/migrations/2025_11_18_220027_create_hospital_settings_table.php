<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospital_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->unique()->references('id')->on('hospitals')->onDelete('cascade');
            $table->string('logo')->nullable();
            $table->text('about')->nullable();
            $table->string('phone_number')->nullable();
            $table->text('address')->nullable();
            $table->json('working_hours')->nullable(); // {monday: {start: "09:00", end: "17:00"}, ...}
            $table->integer('default_time_gap_minutes')->default(60); // Default gap between appointments
            $table->json('auto_approval_rules')->nullable(); // Rules for auto-approving appointments
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hospital_settings');
    }
};
