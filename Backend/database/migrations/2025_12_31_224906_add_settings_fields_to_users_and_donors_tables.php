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
        // Add fields to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_picture')->nullable()->after('phone_nb');
            $table->text('address')->nullable()->after('city');
        });

        // Add fields to donors table
        Schema::table('donors', function (Blueprint $table) {
            $table->text('address')->nullable()->after('blood_type_id');
            $table->decimal('weight', 5, 2)->nullable()->after('date_of_birth'); // weight in kg
            $table->string('emergency_contact_name')->nullable()->after('weight');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['profile_picture', 'address']);
        });

        Schema::table('donors', function (Blueprint $table) {
            $table->dropColumn(['address', 'weight', 'emergency_contact_name', 'emergency_contact_phone']);
        });
    }
};
