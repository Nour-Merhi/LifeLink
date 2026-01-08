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
        Schema::create('xp_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donor_id')->references('id')->on('donors')->onDelete('cascade');
            $table->integer('xp_amount');
            $table->string('donation_type'); // 'blood', 'live_organ', 'after_death', 'financial'
            $table->string('reference_type')->nullable(); // e.g., 'App\Models\HomeAppointment', 'App\Models\LivingDonor', etc.
            $table->unsignedBigInteger('reference_id')->nullable(); // ID of the related record
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['donor_id', 'created_at']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('xp_transactions');
    }
};
