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
                'answer' => 'Click on the sign in button in the upper right corner of the home page, login page will show up, then click on "Register Here" to navigate to the register page and you\'re all set.',
                'category' => 'Account',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I see my XP?',
                'answer' => 'Visit your Dashboard by clicking on your profile icon, navigate to reward page and you will see your XP there.',
                'category' => 'Rewards',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I buy rewards?',
                'answer' => 'Go to the Rewards page, select a product, and spend your XP.',
                'category' => 'Rewards',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I donate blood?',
                'answer' => "Go to the donation page, select the type of donation you want to make, fill in the form and you're all set. But before that, you need to be logged in and have a donor account.",
                'category' => 'Blood Donation',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How often can I donate blood?',
                'answer' => 'You can donate whole blood every 8 weeks (56 days). This allows your body to replenish the blood cells.',
                'category' => 'Blood Donation',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'What are the requirements to donate blood?',
                'answer' => 'You must be at least 18 years old (or 17 with parental consent), weigh at least 110 pounds, be in good health, and not have donated blood in the last 8 weeks.',
                'category' => 'Blood Donation',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I book an appointment?',
                'answer' => 'Go to the Donation page, choose between home donation or hospital donation, select your preferred date and time, and complete the booking form.',
                'category' => 'Appointments',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'Can I cancel my appointment?',
                'answer' => 'Yes, you can cancel your appointment from your dashboard. Go to "My Appointments" and click cancel on the appointment you wish to cancel.',
                'category' => 'Appointments',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'How do I donate organs?',
                'answer' => 'You can register as an organ donor by going to the Donation page and selecting "Organ Donation". You can choose between living organ donation or after-death organ pledge.',
                'category' => 'Organ Donation',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'Is my personal information safe?',
                'answer' => 'Yes, we take your privacy seriously. All personal and medical information is encrypted and stored securely. We never share your information with third parties without your consent.',
                'category' => 'Privacy',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}

