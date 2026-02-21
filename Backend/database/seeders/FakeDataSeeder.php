<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\BloodType;
use App\Models\Donor;
use App\Models\HealthCenterManager;
use App\Models\HomeAppointment;
use App\Models\HomeAppointmentRating;
use App\Models\Hospital;
use App\Models\HospitalAppointment;
use App\Models\MobilePhlebotomist;
use App\Models\QuizLevel;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Models\XpTransaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class FakeDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding fake data: Lebanon hospitals, donors, phlebotomists, appointments, XP, ratings...');

        if (BloodType::count() === 0) {
            $this->call(BloodTypeSeeder::class);
        }
        if (QuizLevel::count() === 0) {
            $this->call(QuizLevelsSeeder::class);
        }

        // 1. Lebanon hospitals
        $hospitals = $this->seedHospitals();
        if ($hospitals->isEmpty()) {
            $this->command->warn('No hospitals created. Aborting.');
            return;
        }

        // 2. Donor users
        $donorUsers = $this->seedDonorUsers();
        // 3. Manager users + HealthCenterManagers (one per hospital)
        $managers = $this->seedManagers($hospitals);
        // 4. Phlebotomist users + MobilePhlebotomists (spread across hospitals)
        $phlebotomists = $this->seedPhlebotomists($hospitals, $managers);

        // 5. Donors (linked to donor users, varied donation_nb for leaderboard)
        $donors = $this->seedDonors($donorUsers);

        // 6. Appointments (regular + urgent, various dates)
        $appointments = $this->seedAppointments($hospitals);

        // 7. Home appointments (varied states, some assigned to phlebotomists, some completed)
        $this->seedHomeAppointments($donors, $hospitals, $phlebotomists, $appointments);

        // 8. Hospital appointments (varied states, regular and urgent)
        $this->seedHospitalAppointments($donors, $hospitals, $appointments);

        // 9. Home appointment ratings (for completed home visits with phlebotomist)
        $this->seedHomeAppointmentRatings();

        // 10. XP transactions (blood + quiz) so donors appear on top player leaderboard
        $this->seedXpTransactions($donors);

        // 11. Update donation_nb on donors to match completed bookings (blood donor leaderboard)
        $this->updateDonorDonationCounts();

        $this->command->info('Fake data seeded successfully.');
    }

    private function seedHospitals()
    {
        $data = [
            ['name' => 'American University of Beirut Medical Center', 'city' => 'Beirut', 'address' => 'Bliss Street, Beirut, Lebanon'],
            ['name' => 'Hotel Dieu de France', 'city' => 'Beirut', 'address' => 'Alfred Naccache Ave, Beirut, Lebanon'],
            ['name' => 'Rafik Hariri University Hospital', 'city' => 'Beirut', 'address' => 'Bir Hassan, Beirut, Lebanon'],
            ['name' => 'Lebanese American University Medical Center - Rizk Hospital', 'city' => 'Beirut', 'address' => 'Achrafieh, Beirut, Lebanon'],
            ['name' => 'Saint George Hospital University Medical Center', 'city' => 'Beirut', 'address' => 'Achrafieh, Beirut, Lebanon'],
            ['name' => 'Tripoli Governmental Hospital', 'city' => 'Tripoli', 'address' => 'Tripoli, North Lebanon'],
            ['name' => 'Nini Hospital', 'city' => 'Tripoli', 'address' => 'Tripoli, North Lebanon'],
            ['name' => 'Sahel General Hospital', 'city' => 'Jounieh', 'address' => 'Jounieh, Mount Lebanon'],
            ['name' => 'Bellevue Medical Center', 'city' => 'Jounieh', 'address' => 'Jounieh, Mount Lebanon'],
            ['name' => 'Sidon Governmental Hospital', 'city' => 'Sidon', 'address' => 'Sidon, South Lebanon'],
        ];

        $hospitals = collect();
        foreach ($data as $i => $row) {
            $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($row['name'])) . '-lb' . ($i + 1);
            $email = 'contact@' . $slug . '.lb';
            $hospital = Hospital::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $row['name'],
                    'phone_nb' => '+961' . (1000000 + $i * 11111),
                    'address' => $row['address'],
                    'status' => 'verified',
                ]
            );
            $hospitals->push($hospital);
        }

        $this->command->info('Hospitals (Lebanon): ' . $hospitals->count());
        return $hospitals;
    }

    private function seedDonorUsers(): \Illuminate\Support\Collection
    {
        $names = [
            ['first' => 'Rami', 'last' => 'Khoury'],
            ['first' => 'Layla', 'last' => 'Hassan'],
            ['first' => 'Omar', 'last' => 'Fakhry'],
            ['first' => 'Nour', 'last' => 'Mansour'],
            ['first' => 'Youssef', 'last' => 'Sabbagh'],
            ['first' => 'Maya', 'last' => 'Nasr'],
            ['first' => 'Karim', 'last' => 'Taha'],
            ['first' => 'Sara', 'last' => 'Bassil'],
            ['first' => 'Fadi', 'last' => 'Georges'],
            ['first' => 'Lina', 'last' => 'Chamoun'],
            ['first' => 'Hassan', 'last' => 'Jaber'],
            ['first' => 'Dina', 'last' => 'Saliba'],
            ['first' => 'Tarek', 'last' => 'Hamdan'],
            ['first' => 'Rania', 'last' => 'Karam'],
            ['first' => 'Bilal', 'last' => 'Nassif'],
        ];

        $users = collect();
        foreach ($names as $i => $name) {
            $email = 'donor.fake' . ($i + 1) . '@lifelink-lb.test';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'first_name' => $name['first'],
                    'middle_name' => null,
                    'last_name' => $name['last'],
                    'phone_nb' => null,
                    'city' => ['Beirut', 'Tripoli', 'Jounieh', 'Sidon', 'Zahle'][$i % 5],
                    'role' => 'Donor',
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );
            $users->push($user);
        }

        $this->command->info('Created ' . $users->count() . ' donor users.');
        return $users;
    }

    private function seedManagers(\Illuminate\Support\Collection $hospitals): \Illuminate\Support\Collection
    {
        $managers = collect();
        foreach ($hospitals as $i => $hospital) {
            $email = 'manager.fake' . $hospital->id . '@lifelink-lb.test';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'first_name' => 'Manager',
                    'middle_name' => null,
                    'last_name' => $hospital->name,
                    'phone_nb' => '+961' . (2000000 + $hospital->id),
                    'city' => 'Beirut',
                    'role' => 'Manager',
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );
            $manager = HealthCenterManager::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'hospital_id' => $hospital->id,
                    'position' => 'Health Center Manager',
                    'office_location' => 'Building A',
                    'working_dates' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    'start_time' => '08:00',
                    'end_time' => '17:00',
                ]
            );
            $managers->push($manager);
        }
        $this->command->info('Created ' . $managers->count() . ' health center managers.');
        return $managers;
    }

    private function seedPhlebotomists(\Illuminate\Support\Collection $hospitals, \Illuminate\Support\Collection $managers): \Illuminate\Support\Collection
    {
        $phlebotomistNames = [
            ['first' => 'Nadia', 'last' => 'Assaf'],
            ['first' => 'Walid', 'last' => 'Haddad'],
            ['first' => 'Rita', 'last' => 'Moukalled'],
            ['first' => 'Samir', 'last' => 'Khalil'],
            ['first' => 'Hala', 'last' => 'Sfeir'],
            ['first' => 'Fouad', 'last' => 'Younes'],
            ['first' => 'Rola', 'last' => 'Daher'],
            ['first' => 'Nabil', 'last' => 'Fares'],
        ];

        $phlebotomists = collect();
        foreach ($phlebotomistNames as $i => $name) {
            $hospital = $hospitals->get($i % $hospitals->count());
            $manager = $managers->firstWhere('hospital_id', $hospital->id);
            if (!$manager) {
                $manager = $managers->first();
            }
            $email = 'phleb.fake' . ($i + 1) . '@lifelink-lb.test';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'first_name' => $name['first'],
                    'middle_name' => null,
                    'last_name' => $name['last'],
                    'phone_nb' => '+961' . (3000000 + $i),
                    'city' => 'Beirut',
                    'role' => 'Phlebotomist',
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );
            $phleb = MobilePhlebotomist::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'hospital_id' => $hospital->id,
                    'manager_id' => $manager->id,
                    'license_number' => 'MP-LB-' . str_pad((string)($i + 1), 4, '0', STR_PAD_LEFT),
                    'start_time' => '08:00',
                    'end_time' => '18:00',
                    'working_dates' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    'max_appointments' => 10,
                    'availability' => 'available',
                ]
            );
            $phlebotomists->push($phleb);
        }
        $this->command->info('Created ' . $phlebotomists->count() . ' mobile phlebotomists.');
        return $phlebotomists;
    }

    private function seedDonors(\Illuminate\Support\Collection $donorUsers): \Illuminate\Support\Collection
    {
        $bloodTypeIds = BloodType::pluck('id')->toArray();
        $genders = ['male', 'female'];
        $donors = collect();
        foreach ($donorUsers as $i => $user) {
            if ($user->donor()->exists()) {
                $donors->push($user->donor);
                continue;
            }
            $donor = Donor::create([
                'user_id' => $user->id,
                'blood_type_id' => $bloodTypeIds[$i % count($bloodTypeIds)],
                'gender' => $genders[$i % 2],
                'date_of_birth' => Carbon::now()->subYears(25 + ($i % 30))->format('Y-m-d'),
                'organ_consent' => (bool)($i % 3),
                'availability' => true,
                'last_donation' => $i > 2 ? Carbon::now()->subMonths(rand(1, 6))->format('Y-m-d') : null,
            ]);
            $donors->push($donor);
        }
        $this->command->info('Created ' . $donors->count() . ' donors.');
        return $donors;
    }

    private function seedAppointments(\Illuminate\Support\Collection $hospitals): \Illuminate\Support\Collection
    {
        $created = collect();
        $types = ['regular', 'urgent'];
        $donationTypes = ['Hospital Blood Donation', 'Home Blood Donation'];
        for ($i = 0; $i < 50; $i++) {
            $hospital = $hospitals->random();
            $date = Carbon::now()->addDays(rand(-60, 30))->format('Y-m-d');
            $apt = Appointment::create([
                'hospital_id' => $hospital->id,
                'appointment_date' => $date,
                'appointment_type' => $types[$i % 2],
                'donation_type' => $donationTypes[$i % 2],
                'due_date' => $date,
                'due_time' => sprintf('%02d:00', 8 + ($i % 10)),
                'state' => 'pending',
                'max_capacity' => 5,
                'time_slots' => ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'],
            ]);
            $created->push($apt);
        }
        $this->command->info('Created ' . $created->count() . ' appointments (regular + urgent).');
        return $created;
    }

    private function seedHomeAppointments(
        \Illuminate\Support\Collection $donors,
        \Illuminate\Support\Collection $hospitals,
        \Illuminate\Support\Collection $phlebotomists,
        \Illuminate\Support\Collection $appointments
    ): void {
        // Use only pending|completed|canceled (confirmed may not exist in all DB constraints)
        $states = ['pending', 'pending', 'pending', 'pending', 'completed', 'completed', 'completed', 'canceled'];
        $homeSlots = $appointments->where('donation_type', 'Home Blood Donation');
        if ($homeSlots->isEmpty()) {
            $homeSlots = $appointments->take(20);
        }
        $slotArray = $homeSlots->values()->all();
        $count = 0;
        foreach (array_slice($slotArray, 0, min(25, count($slotArray))) as $idx => $apt) {
            $donor = $donors->random();
            $hospital = $hospitals->firstWhere('id', $apt->hospital_id) ?? $hospitals->first();
            $state = $states[$idx % count($states)];
            $phlebotomist_id = $state === 'completed' ? $phlebotomists->random()->id : null;
            $completedAt = $state === 'completed' ? now()->subDays(rand(1, 30)) : null;
            $weightCol = 'weight(kg)'; // actual column name in migration
            $data = [
                'donor_id' => $donor->id,
                'hospital_id' => $hospital->id,
                'appointment_id' => $apt->id,
                'appointment_time' => '09:00 - 10:00',
                'phlebotomist_id' => $phlebotomist_id,
                $weightCol => (string)rand(55, 95),
                'address' => 'Fake Address ' . $donor->id . ', Beirut, Lebanon',
                'state' => $state,
                'blood_units_collected' => 1,
                'blood_usage_status' => 'unused',
            ];
            if ($completedAt) {
                $data['completed_at'] = $completedAt;
            }
            HomeAppointment::firstOrCreate(
                [
                    'donor_id' => $donor->id,
                    'appointment_id' => $apt->id,
                ],
                $data
            );
            $count++;
        }
        $this->command->info('Created/updated ' . $count . ' home appointments (varied states, some with phlebotomist).');
    }

    private function seedHospitalAppointments(
        \Illuminate\Support\Collection $donors,
        \Illuminate\Support\Collection $hospitals,
        \Illuminate\Support\Collection $appointments
    ): void {
        // Hospital appointments: pending|completed|canceled only (no confirmed in enum)
        $states = ['pending', 'pending', 'completed', 'completed', 'completed', 'canceled'];
        $hospitalSlots = $appointments->where('donation_type', 'Hospital Blood Donation');
        if ($hospitalSlots->isEmpty()) {
            $hospitalSlots = $appointments->take(25);
        }
        $slotArray = $hospitalSlots->values()->all();
        $count = 0;
        foreach (array_slice($slotArray, 0, min(30, count($slotArray))) as $idx => $apt) {
            $donor = $donors->random();
            $hospital = $hospitals->firstWhere('id', $apt->hospital_id) ?? $hospitals->first();
            $state = $states[$idx % count($states)];
            $completedAt = $state === 'completed' ? now()->subDays(rand(1, 45)) : null;
            $data = [
                'donor_id' => $donor->id,
                'hospital_id' => $hospital->id,
                'appointment_id' => $apt->id,
                'appointment_time' => '10:00 - 11:00',
                'state' => $state,
                'blood_units_collected' => 1,
                'blood_usage_status' => 'unused',
            ];
            if ($completedAt) {
                $data['completed_at'] = $completedAt;
            }
            HospitalAppointment::firstOrCreate(
                [
                    'donor_id' => $donor->id,
                    'appointment_id' => $apt->id,
                ],
                $data
            );
            $count++;
        }
        $this->command->info('Created/updated ' . $count . ' hospital appointments (varied states, regular + urgent).');
    }

    private function seedHomeAppointmentRatings(): void
    {
        $completed = HomeAppointment::where('state', 'completed')
            ->whereNotNull('phlebotomist_id')
            ->get();
        $count = 0;
        foreach ($completed as $ha) {
            HomeAppointmentRating::firstOrCreate(
                ['home_appointment_id' => $ha->id],
                [
                    'donor_id' => $ha->donor_id,
                    'phlebotomist_id' => $ha->phlebotomist_id,
                    'rating' => (int)rand(3, 5),
                    'comment' => 'Fake rating for seeder.',
                ]
            );
            $count++;
        }
        $this->command->info('Created ' . $count . ' home appointment ratings (phlebotomist leaderboard).');
    }

    private function seedXpTransactions(\Illuminate\Support\Collection $donors): void
    {
        $bloodXp = 150; // XpService::awardBloodDonationXp uses 150

        // Blood XP: one per completed home appointment
        $completedHome = HomeAppointment::where('state', 'completed')->get();
        foreach ($completedHome as $ha) {
            XpTransaction::firstOrCreate(
                [
                    'donor_id' => $ha->donor_id,
                    'donation_type' => 'blood',
                    'reference_type' => 'App\Models\HomeAppointment',
                    'reference_id' => $ha->id,
                ],
                [
                    'xp_amount' => $bloodXp,
                    'description' => 'Blood donation (home)',
                ]
            );
        }

        // Blood XP: one per completed hospital appointment
        $completedHosp = HospitalAppointment::where('state', 'completed')->get();
        foreach ($completedHosp as $hospApt) {
            XpTransaction::firstOrCreate(
                [
                    'donor_id' => $hospApt->donor_id,
                    'donation_type' => 'blood',
                    'reference_type' => 'App\Models\HospitalAppointment',
                    'reference_id' => $hospApt->id,
                ],
                [
                    'xp_amount' => $bloodXp,
                    'description' => 'Blood donation (hospital)',
                ]
            );
        }

        // Quiz XP for top player leaderboard (varied totals per donor)
        $levels = QuizLevel::orderBy('number')->get();
        $questionsByLevel = QuizQuestion::all()->groupBy('level');
        $xpPerLevel = [1 => 10, 2 => 10, 3 => 15, 4 => 15, 5 => 15, 6 => 20, 7 => 20, 8 => 25, 9 => 25, 10 => 25];

        foreach ($donors->take(12) as $idx => $donor) {
            $levelsToAward = min($idx + 1, 5); // 1–5 levels per donor for variety
            foreach ($levels->take($levelsToAward) as $level) {
                $existing = XpTransaction::where('donor_id', $donor->id)
                    ->where('reference_type', QuizLevel::class)
                    ->where('reference_id', $level->id)
                    ->exists();
                if (!$existing) {
                    XpTransaction::create([
                        'donor_id' => $donor->id,
                        'xp_amount' => $level->xp_amount ?? 50,
                        'donation_type' => 'quiz-level',
                        'reference_type' => QuizLevel::class,
                        'reference_id' => $level->id,
                        'description' => 'Quiz level ' . $level->number . ' (fake seeder)',
                    ]);
                }
            }
            foreach ($levels->take($levelsToAward) as $level) {
                $levelQuestions = $questionsByLevel->get($level->number, collect());
                foreach ($levelQuestions->take(3) as $q) {
                    $existing = XpTransaction::where('donor_id', $donor->id)
                        ->where('reference_type', 'App\Models\QuizQuestion')
                        ->where('reference_id', $q->id)
                        ->exists();
                    if (!$existing) {
                        $xp = $xpPerLevel[$level->number] ?? 10;
                        XpTransaction::create([
                            'donor_id' => $donor->id,
                            'xp_amount' => $xp,
                            'donation_type' => 'quiz_correct_answer',
                            'reference_type' => 'App\Models\QuizQuestion',
                            'reference_id' => $q->id,
                            'description' => 'Quiz answer (fake seeder)',
                        ]);
                    }
                }
            }
        }

        $this->command->info('Created XP transactions (blood + quiz) for leaderboards.');
    }

    private function updateDonorDonationCounts(): void
    {
        $donorIds = Donor::pluck('id');
        foreach ($donorIds as $donorId) {
            $completed = HomeAppointment::where('donor_id', $donorId)->where('state', 'completed')->count()
                + HospitalAppointment::where('donor_id', $donorId)->where('state', 'completed')->count();
            DB::table('donors')->where('id', $donorId)->update(['donation_nb' => $completed]);
        }
        $this->command->info('Updated donor donation_nb for blood donor leaderboard.');
    }
}
