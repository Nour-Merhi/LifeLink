<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Allows creating a phlebotomist for a hospital that does not yet have a health center manager.
     * Uses raw SQL so it works without doctrine/dbal (PostgreSQL/MySQL).
     */
    public function up(): void
    {
        if (!Schema::hasTable('mobile_phlebotomists')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE mobile_phlebotomists ALTER COLUMN manager_id DROP NOT NULL');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE mobile_phlebotomists MODIFY manager_id BIGINT UNSIGNED NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('mobile_phlebotomists')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE mobile_phlebotomists ALTER COLUMN manager_id SET NOT NULL');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE mobile_phlebotomists MODIFY manager_id BIGINT UNSIGNED NOT NULL');
        }
    }
};
