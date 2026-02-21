<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mobile_phlebotomists', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('mobile_phlebotomists', function (Blueprint $table) {
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('mobile_phlebotomists', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
    }
};