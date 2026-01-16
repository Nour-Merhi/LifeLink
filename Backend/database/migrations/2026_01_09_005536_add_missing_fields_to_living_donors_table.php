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
            // Check if columns don't exist before adding them
            if (!Schema::hasColumn('living_donors', 'recipient_full_name')) {
                $table->string('recipient_full_name')->nullable()->after('hospital_id');
            }
            if (!Schema::hasColumn('living_donors', 'recipient_age')) {
                $table->integer('recipient_age')->nullable()->after('recipient_full_name');
            }
            if (!Schema::hasColumn('living_donors', 'recipient_contact')) {
                $table->string('recipient_contact')->nullable()->after('recipient_age');
            }
            if (!Schema::hasColumn('living_donors', 'recipient_contact_type')) {
                $table->enum('recipient_contact_type', ['phone', 'email'])->nullable()->after('recipient_contact');
            }
            if (!Schema::hasColumn('living_donors', 'recipient_blood_type')) {
                $table->string('recipient_blood_type')->nullable()->after('recipient_contact_type');
            }
            if (!Schema::hasColumn('living_donors', 'id_picture')) {
                $table->string('id_picture')->nullable()->after('medical_conditions');
            }
            if (!Schema::hasColumn('living_donors', 'hospital_selection')) {
                $table->enum('hospital_selection', ['general', 'specific'])->nullable()->after('hospital_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('living_donors', function (Blueprint $table) {
            $columns = [
                'recipient_full_name',
                'recipient_age',
                'recipient_contact',
                'recipient_contact_type',
                'recipient_blood_type',
                'id_picture',
                'hospital_selection'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('living_donors', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
