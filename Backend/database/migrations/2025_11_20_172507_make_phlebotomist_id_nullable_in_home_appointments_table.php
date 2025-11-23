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
        // Use raw SQL to avoid needing doctrine/dbal package
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Try to get the actual foreign key constraint name
        $fkName = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'home_appointments' 
            AND COLUMN_NAME = 'phlebotomist_id' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        ");
        
        if (!empty($fkName)) {
            $constraintName = $fkName[0]->CONSTRAINT_NAME;
            // Drop the existing foreign key constraint
            DB::statement("ALTER TABLE home_appointments DROP FOREIGN KEY {$constraintName}");
        }
        
        // Make phlebotomist_id nullable
        DB::statement('ALTER TABLE home_appointments MODIFY phlebotomist_id BIGINT UNSIGNED NULL');
        
        // Re-add the foreign key constraint
        DB::statement('ALTER TABLE home_appointments ADD CONSTRAINT home_appointments_phlebotomist_id_foreign 
            FOREIGN KEY (phlebotomist_id) REFERENCES mobile_phlebotomists(id) ON DELETE CASCADE');
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Use raw SQL to reverse the changes
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Drop the foreign key constraint
        DB::statement('ALTER TABLE home_appointments DROP FOREIGN KEY home_appointments_phlebotomist_id_foreign');
        
        // Make phlebotomist_id NOT NULL again
        DB::statement('ALTER TABLE home_appointments MODIFY phlebotomist_id BIGINT UNSIGNED NOT NULL');
        
        // Re-add the foreign key constraint
        DB::statement('ALTER TABLE home_appointments ADD CONSTRAINT home_appointments_phlebotomist_id_foreign 
            FOREIGN KEY (phlebotomist_id) REFERENCES mobile_phlebotomists(id) ON DELETE CASCADE');
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
};
