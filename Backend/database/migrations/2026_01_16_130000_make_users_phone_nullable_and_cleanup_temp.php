<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Allow NULL so we don't need fake placeholder values like temp_*
        DB::statement("ALTER TABLE `users` MODIFY COLUMN `phone_nb` VARCHAR(255) NULL");

        // Clean existing temp_* values
        DB::table('users')
            ->where('phone_nb', 'like', 'temp\\_%')
            ->update(['phone_nb' => null]);
    }

    public function down(): void
    {
        // Revert to NOT NULL (may fail if nulls exist)
        DB::statement("ALTER TABLE `users` MODIFY COLUMN `phone_nb` VARCHAR(255) NOT NULL");
    }
};

