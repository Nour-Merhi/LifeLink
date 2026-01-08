<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Article;
use App\Models\User;
use Carbon\Carbon;

class ArticleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get admin user or create a default one for articles
        $admin = User::where('role', 'Admin')->first();
        
        if (!$admin) {
            $this->command->warn('No admin user found. Articles will be created without author.');
        }

        $articles = [
            [
                'title' => 'The Complete Guide to Blood Donation: What You Need to Know',
                'description' => 'Everything from eligibility requirements to the donation process, plus how your donation saves lives and health benefits for donors.',
                'content' => 'Blood donation is one of the most selfless acts you can perform. Every donation can save up to three lives. In this comprehensive guide, we will walk you through everything you need to know about blood donation, including eligibility requirements, the donation process, and the incredible impact your donation can have on patients in need.

Understanding the importance of blood donation is crucial. Hospitals and medical facilities require a constant supply of blood for surgeries, trauma cases, cancer treatments, and various medical conditions. Your donation ensures that this life-saving resource is available when needed most.

Before donating, it\'s important to understand the eligibility requirements. Generally, donors must be in good health, at least 17 years old (or 16 with parental consent in some areas), and weigh at least 110 pounds. There are also specific requirements regarding recent travel, medications, and medical history that our staff will review with you during the screening process.

The donation process itself is simple and safe. After a brief health screening, a trained phlebotomist will collect approximately one pint of blood, which takes about 8-10 minutes. The entire process, including registration and refreshments, typically takes less than an hour.

After donating, your body quickly replenishes the lost blood. Within 24-48 hours, your plasma volume is restored, and your red blood cells are regenerated within 4-8 weeks. Many donors report feeling energized after donation and enjoy the satisfaction of knowing they\'ve made a difference.',
                'category' => 'Blood Donation',
                'is_published' => true,
                'published_at' => Carbon::now()->subDays(5),
            ],
            [
                'title' => 'Understanding Organ Donation: A Comprehensive Overview',
                'description' => 'Learn about the different types of organ donation, the registration process, and how organ matching works to save lives.',
                'content' => 'Organ donation is a life-saving gift that allows individuals to help others even after death, or in some cases, while they are still alive. This comprehensive overview will help you understand the different types of organ donation, how to register as an organ donor, and how the matching process works.

There are two main types of organ donation: deceased donation and living donation. Deceased donation occurs when organs are recovered from someone who has died, while living donation involves a healthy person donating an organ or part of an organ to someone in need.

The organ matching process is complex and carefully managed to ensure the best possible outcomes. Factors such as blood type, tissue type, organ size, medical urgency, geographic location, and time on the waiting list are all considered when matching organs to recipients.

Registering as an organ donor is a simple process that can be done through your state\'s donor registry, when obtaining or renewing your driver\'s license, or through online registration systems. It\'s also important to discuss your decision with your family members so they can honor your wishes.

Living organ donation, such as kidney or liver donation, has become increasingly common and successful. Living donors can lead completely normal, healthy lives after donation, and the procedure is performed with the utmost care and safety.',
                'category' => 'Organ Donation',
                'is_published' => true,
                'published_at' => Carbon::now()->subDays(3),
            ],
            [
                'title' => 'Health Benefits of Regular Blood Donation',
                'description' => 'Discover the surprising health benefits that come with regular blood donation, including reduced risk of heart disease and improved circulation.',
                'content' => 'Many people are surprised to learn that blood donation offers significant health benefits to the donor. Beyond the profound impact on recipients, regular blood donation can provide several advantages for your own health and well-being.

One of the most notable benefits is the potential reduction in the risk of heart disease. Regular blood donation helps maintain healthy iron levels in the body. While iron is essential for good health, excessive iron can contribute to cardiovascular problems. By donating blood regularly, you help your body maintain optimal iron levels, which may reduce your risk of heart attack and stroke.

Blood donation also stimulates the production of new blood cells. After donating, your body works to replenish the blood you\'ve given, which can help maintain healthy blood cell production and improve overall circulation.

Additionally, the health screening that accompanies each donation provides valuable information about your health status. Before each donation, donors receive a mini-physical that includes checking blood pressure, pulse, temperature, and hemoglobin levels. This regular health check can help identify potential health issues early.

Many regular donors also report psychological benefits, including a sense of purpose, increased self-esteem, and the satisfaction of helping others. These emotional benefits can contribute to overall mental well-being and a positive outlook on life.',
                'category' => 'Health & Wellness',
                'is_published' => true,
                'published_at' => Carbon::now()->subDays(2),
            ],
            [
                'title' => 'Living Organ Donation: What You Should Know',
                'description' => 'A detailed guide to living organ donation, including kidney and liver donation, eligibility criteria, and the recovery process.',
                'content' => 'Living organ donation is a remarkable act of generosity that allows healthy individuals to donate organs or parts of organs to people in need. This detailed guide will help you understand the process, eligibility requirements, and what to expect.

The most common types of living organ donation are kidney and liver donation. A person can live a completely normal, healthy life with one kidney, making kidney donation one of the most frequent living donation procedures. Partial liver donation is also possible because the liver has the unique ability to regenerate, allowing both the donor and recipient to have fully functioning livers after the procedure.

Eligibility for living donation is carefully assessed through a comprehensive evaluation process. Potential donors undergo extensive medical, psychological, and social evaluations to ensure they are healthy enough to donate and that the procedure is safe for them. Factors such as age, overall health, organ function, and compatibility with the recipient are all considered.

The evaluation process typically includes blood tests, imaging studies, psychological assessment, and consultations with various specialists. This thorough process ensures that both the donor and recipient have the best possible outcomes.

Recovery time varies depending on the type of donation. Most kidney donors can return to normal activities within 2-4 weeks, while liver donors may need 6-8 weeks. The medical team provides comprehensive support throughout the recovery process, and long-term follow-up care is provided to ensure the donor\'s continued health and well-being.',
                'category' => 'Organ Donation',
                'is_published' => true,
                'published_at' => Carbon::now()->subDays(1),
            ],
            [
                'title' => 'After-Death Organ Donation: Making Your Wishes Known',
                'description' => 'How to register as an organ donor, communicate your wishes to family, and ensure your legacy of life continues after death.',
                'content' => 'Registering as an organ donor is one of the most meaningful decisions you can make, allowing you to save lives even after your own life has ended. This guide will help you understand how to register, communicate your wishes, and ensure your decision is honored.

The first step in becoming an organ donor is to register with your state\'s donor registry. This can typically be done when you obtain or renew your driver\'s license, through your state\'s online registry, or by signing up through organizations like Donate Life. Registration is simple, free, and takes just a few minutes.

However, registration alone is not enough. It\'s crucial to have an open and honest conversation with your family members about your decision to be an organ donor. Your family will be consulted at the time of your death, and their support is essential for the donation process to proceed. Sharing your wishes with them ensures they understand and can honor your decision during a difficult time.

When you register, you can specify which organs and tissues you wish to donate. You can choose to donate all organs and tissues, or you can be more selective. Common donations include kidneys, liver, heart, lungs, pancreas, intestines, corneas, skin, bone, and heart valves.

It\'s also important to understand that organ donation does not interfere with open-casket funerals or traditional funeral arrangements. The donation process is performed with the utmost respect and care, and funeral arrangements can proceed as planned.

By registering and discussing your wishes, you ensure that your legacy of giving continues, potentially saving multiple lives and providing hope to countless families in need.',
                'category' => 'Organ Donation',
                'is_published' => true,
                'published_at' => Carbon::now(),
            ],
            [
                'title' => 'Preparing for Your First Blood Donation',
                'description' => 'Step-by-step guide to prepare for your first blood donation, including what to eat, what to avoid, and what to expect during the process.',
                'content' => 'Donating blood for the first time can feel a bit overwhelming, but with proper preparation, the experience is simple, safe, and rewarding. This step-by-step guide will help you prepare for your first donation and know exactly what to expect.

In the days leading up to your donation, focus on maintaining good health. Get plenty of sleep, stay hydrated by drinking extra water, and eat iron-rich foods such as lean red meat, poultry, fish, beans, spinach, and iron-fortified cereals. These steps help ensure your hemoglobin levels are optimal for donation.

On the day of your donation, eat a healthy meal before you arrive. Avoid fatty foods, as they can affect the quality of your blood. Instead, choose foods rich in iron and vitamin C, which can help with iron absorption. Continue drinking plenty of water or other non-alcoholic beverages.

Wear comfortable clothing with sleeves that can be easily rolled up above your elbow. This makes the donation process more convenient for both you and the phlebotomist.

When you arrive at the donation center, you\'ll complete a registration process and answer a health history questionnaire. This screening helps ensure the safety of both you and the recipient. A trained staff member will check your temperature, pulse, blood pressure, and hemoglobin level.

The actual donation takes about 8-10 minutes, during which you\'ll be seated comfortably. The phlebotomist will insert a sterile needle into a vein in your arm, and you\'ll simply relax while approximately one pint of blood is collected. Most donors report feeling little to no discomfort.

After your donation, you\'ll rest for a few minutes and enjoy refreshments. The staff will monitor you to ensure you\'re feeling well before you leave. You\'ll be advised to avoid heavy lifting and strenuous activity for the rest of the day, and to continue drinking plenty of fluids.

Remember, if you feel any discomfort or have questions at any point, the staff is there to help. Your first donation is an important milestone in making a difference in the lives of others!',
                'category' => 'Blood Donation',
                'is_published' => true,
                'published_at' => Carbon::now()->subHours(12),
            ],
        ];

        foreach ($articles as $articleData) {
            Article::create([
                'title' => $articleData['title'],
                'description' => $articleData['description'],
                'content' => $articleData['content'],
                'category' => $articleData['category'],
                'is_published' => $articleData['is_published'],
                'published_at' => $articleData['published_at'],
                'author_id' => $admin ? $admin->id : null,
                'image' => null, // You can add images later if needed
            ]);
        }

        $this->command->info('Successfully created ' . count($articles) . ' articles!');
    }
}
