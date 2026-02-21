<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('home_appointment_ratings', function (Blueprint $table) {
            if (!Schema::hasColumn('home_appointment_ratings', 'phlebotomist_id')) {
                $table->foreignId('phlebotomist_id')
                    ->nullable()
                    ->constrained('mobile_phlebotomists')
                    ->nullOnDelete();

                $table->index('phlebotomist_id');
            }
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                UPDATE home_appointment_ratings AS r
                SET phlebotomist_id = ha.phlebotomist_id
                FROM home_appointments AS ha
                WHERE ha.id = r.home_appointment_id
                  AND r.phlebotomist_id IS NULL
                  AND ha.phlebotomist_id IS NOT NULL
            ");
        } else {
            // MySQL version
            DB::table('home_appointment_ratings as r')
                ->join('home_appointments as ha', 'ha.id', '=', 'r.home_appointment_id')
                ->whereNull('r.phlebotomist_id')
                ->whereNotNull('ha.phlebotomist_id')
                ->update(['phlebotomist_id' => DB::raw('ha.phlebotomist_id')]);
        }
    }

    public function down(): void
    {
        Schema::table('home_appointment_ratings', function (Blueprint $table) {
            if (Schema::hasColumn('home_appointment_ratings', 'phlebotomist_id')) {
                $table->dropForeign(['phlebotomist_id']);
                $table->dropIndex(['phlebotomist_id']);
                $table->dropColumn('phlebotomist_id');
            }
        });
    }
};