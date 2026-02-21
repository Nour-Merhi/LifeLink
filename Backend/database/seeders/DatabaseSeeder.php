<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed blood types first (required for donors)
        $this->call(BloodTypeSeeder::class);
        
        // Create master admin user
        $this->call(AdminUserSeeder::class);

        // Seed articles
        $this->call(ArticleSeeder::class);

        // Seed quiz levels and questions
        $this->call(QuizLevelsSeeder::class);

        // Fake data: Lebanon hospitals, donors, phlebotomists, appointments, XP, ratings (leaderboards)
        $this->call(FakeDataSeeder::class);

        // User::factory(10)->create();

    }
}
