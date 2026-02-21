<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Make phone_nb nullable
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone_nb', 255)->nullable()->change();
        });

        // Clean existing temp_* values
        DB::table('users')
            ->where('phone_nb', 'like', 'temp\_%')
            ->update(['phone_nb' => null]);
    }

    public function down(): void
    {
        // Revert to NOT NULL (may fail if nulls exist)
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone_nb', 255)->nullable(false)->change();
        });
    }
};