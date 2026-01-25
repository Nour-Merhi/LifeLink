<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlatformFaqSeeder extends Seeder
{
    public function run()
    {
        DB::table('platform_faqs')->insert([
            [
                'question' => 'How do I register as a donor?',
                'answer' => 'Click on the sign in button in the upper right corner of the hoem page, login pae will sow up, then click on "Register Here" to navigate to the register page and you\'re all set.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I see my XP?',
                'answer' => 'Visit your Dashboard by clicking on your profile icon, naviaget to reward page and you will see your XP down.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I buy rewards?',
                'answer' => 'Go to the Rewards page, select a product, and spend your XP.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I donate blood?',
                'answer' => "Go to the donation page, select the type of donation you want to make, fill in the form and you're all set. But before that, you need to be logged in and have a donor account.",
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}

