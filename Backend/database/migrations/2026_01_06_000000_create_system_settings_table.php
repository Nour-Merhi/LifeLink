<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            
            // General System Settings
            $table->string('platform_name')->default('LifeLink');
            $table->text('system_logo')->nullable();
            $table->string('system_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('default_language', 10)->default('en');
            $table->string('timezone')->default('UTC');
            
            // Donation & Medical Settings
            $table->integer('min_days_between_donations')->default(56);
            $table->json('allowed_blood_types')->nullable(); // Array of blood types like ["A+", "B-", etc.]
            $table->string('emergency_request_expiry', 10)->default('24h'); // e.g., "6h", "12h", "24h", "48h"
            $table->integer('donor_age_min')->default(18);
            $table->integer('donor_age_max')->default(65);
            
            $table->timestamps();
        });

        // Insert default settings
        DB::table('system_settings')->insert([
            'platform_name' => 'LifeLink',
            'system_email' => null,
            'contact_phone' => null,
            'default_language' => 'en',
            'timezone' => 'UTC',
            'min_days_between_donations' => 56,
            'allowed_blood_types' => json_encode(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
            'emergency_request_expiry' => '24h',
            'donor_age_min' => 18,
            'donor_age_max' => 65,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};

