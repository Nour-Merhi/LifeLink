<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_levels', function (Blueprint $table) {
            $table->id();                 // Level ID
            $table->string('name');       // e.g., "Level 1"
            $table->integer('xp_amount'); // XP awarded for completing this level
            $table->integer('number');    // Level number (1,2,3...)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_levels');
    }
};
