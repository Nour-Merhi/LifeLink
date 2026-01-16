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
        Schema::table('living_donors', function (Blueprint $table) {
            // Recipient fields for directed donations
            $table->string('recipient_full_name')->nullable();
            $table->integer('recipient_age')->nullable();
            $table->string('recipient_contact')->nullable();
            $table->enum('recipient_contact_type', ['phone', 'email'])->nullable();
            $table->string('recipient_blood_type')->nullable();
            
            // ID picture path
            $table->string('id_picture')->nullable();
            
            // Hospital selection preference for non-directed donations
            $table->enum('hospital_selection', ['general', 'specific'])->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('living_donors', function (Blueprint $table) {
            $table->dropColumn([
                'recipient_full_name',
                'recipient_age',
                'recipient_contact',
                'recipient_contact_type',
                'recipient_blood_type',
                'id_picture',
                'hospital_selection'
            ]);
        });
    }
};
