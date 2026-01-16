<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MiniGameUnlock;

class MiniGameUnlocksSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            ['game_type' => 'tictactoe', 'unlock_level' => 2],
            ['game_type' => 'tictactoe', 'unlock_level' => 8],
            ['game_type' => 'hangman', 'unlock_level' => 4],
            ['game_type' => 'hangman', 'unlock_level' => 10],
            ['game_type' => 'memory', 'unlock_level' => 6],
        ];

        foreach ($rules as $rule) {
            MiniGameUnlock::updateOrCreate(
                ['game_type' => $rule['game_type'], 'unlock_level' => $rule['unlock_level']],
                $rule
            );
        }
    }
}
