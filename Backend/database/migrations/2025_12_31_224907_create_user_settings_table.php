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
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unique('user_id'); // One settings record per user
            
            // Notification preferences
            $table->boolean('sms_notifications')->default(false);
            $table->boolean('app_notifications')->default(true);
            $table->boolean('email_notifications')->default(true);
            $table->boolean('appointment_reminders')->default(true);
            $table->boolean('emergency_alerts')->default(true);
            $table->boolean('campaign_updates')->default(false);
            $table->boolean('mute_non_urgent')->default(false);
            
            // Communication preferences
            $table->enum('preferred_channel', ['sms', 'email', 'both'])->default('both');
            $table->boolean('hospital_updates')->default(true);
            $table->boolean('donation_campaigns')->default(false);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};
