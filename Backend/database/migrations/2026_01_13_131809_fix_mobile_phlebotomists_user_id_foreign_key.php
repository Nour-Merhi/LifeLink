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
        // First, drop any existing foreign key constraint on user_id
        $foreignKeyName = $this->getForeignKeyName('mobile_phlebotomists', 'user_id');
        
        if ($foreignKeyName) {
            Schema::table('mobile_phlebotomists', function (Blueprint $table) use ($foreignKeyName) {
                $table->dropForeign($foreignKeyName);
            });
        }
        
        // Add the correct foreign key constraint
        Schema::table('mobile_phlebotomists', function (Blueprint $table) {
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mobile_phlebotomists', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
    }
    
    /**
     * Get foreign key constraint name for a column
     */
    private function getForeignKeyName($table, $column)
    {
        $foreignKey = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND COLUMN_NAME = ?
            AND REFERENCED_TABLE_NAME IS NOT NULL
            LIMIT 1
        ", [$table, $column]);
        
        return $foreignKey ? $foreignKey[0]->CONSTRAINT_NAME : null;
    }
};
