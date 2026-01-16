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
        // Change the default value of status column from 'unverified' to 'verified'
        DB::statement("ALTER TABLE `hospitals` MODIFY COLUMN `status` ENUM('verified', 'unverified') DEFAULT 'verified'");
        
        // Update existing records with null status or 'unverified' status to 'verified' (optional)
        // Uncomment the line below if you want to update existing records
        // DB::table('hospitals')->whereNull('status')->orWhere('status', 'unverified')->update(['status' => 'verified']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to 'unverified' as default
        DB::statement("ALTER TABLE `hospitals` MODIFY COLUMN `status` ENUM('verified', 'unverified') DEFAULT 'unverified'");
    }
};
