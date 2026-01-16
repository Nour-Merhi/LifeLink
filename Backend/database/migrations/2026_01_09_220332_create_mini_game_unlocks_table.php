<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mini_game_unlocks', function (Blueprint $table) {
            $table->id();
            $table->string('game_type');      // e.g., 'tictactoe'
            $table->integer('unlock_level');  // Level at which game unlocks
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mini_game_unlocks');
    }
};
