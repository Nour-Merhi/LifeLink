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
        Schema::table('home_appointments', function (Blueprint $table) {
            // Drop the foreign key first
            if (DB::getDriverName() === 'pgsql') {
                $table->dropForeign(['phlebotomist_id']);
            }

            // Make column nullable
            $table->unsignedBigInteger('phlebotomist_id')->nullable()->change();

            // Re-add foreign key
            $table->foreign('phlebotomist_id')
                ->references('id')
                ->on('mobile_phlebotomists')
                ->onDelete(DB::getDriverName() === 'mysql' ? 'CASCADE' : 'SET NULL');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('home_appointments', function (Blueprint $table) {
            $table->dropForeign(['phlebotomist_id']);
            $table->unsignedBigInteger('phlebotomist_id')->nullable(false)->change();
            $table->foreign('phlebotomist_id')
                ->references('id')
                ->on('mobile_phlebotomists')
                ->onDelete('CASCADE');
        });
    }
};
