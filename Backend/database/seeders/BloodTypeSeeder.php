<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\BloodType;

class BloodTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Insert blood types in specific order to guarantee IDs
        // ID mapping: 1=A+, 2=A-, 3=B+, 4=B-, 5=AB+, 6=AB-, 7=O+, 8=O-
        $bloodTypes = [
            ['id' => 1, 'type' => 'A', 'rh_factor' => '+'],
            ['id' => 2, 'type' => 'A', 'rh_factor' => '-'],
            ['id' => 3, 'type' => 'B', 'rh_factor' => '+'],
            ['id' => 4, 'type' => 'B', 'rh_factor' => '-'],
            ['id' => 5, 'type' => 'AB', 'rh_factor' => '+'],
            ['id' => 6, 'type' => 'AB', 'rh_factor' => '-'],
            ['id' => 7, 'type' => 'O', 'rh_factor' => '+'],
            ['id' => 8, 'type' => 'O', 'rh_factor' => '-'],
        ];

        foreach ($bloodTypes as $bloodType) {
            // Use updateOrCreate to avoid duplicates
            BloodType::updateOrCreate(
                ['id' => $bloodType['id']], // Match by ID
                $bloodType                   // Update/Create with these values
            );
        }

        $this->command->info('✅ Blood types seeded successfully!');
        $this->command->table(
            ['ID', 'Blood Type', 'Display'],
            [
                [1, 'A+', 'Type A, Positive'],
                [2, 'A-', 'Type A, Negative'],
                [3, 'B+', 'Type B, Positive'],
                [4, 'B-', 'Type B, Negative'],
                [5, 'AB+', 'Type AB, Positive'],
                [6, 'AB-', 'Type AB, Negative'],
                [7, 'O+', 'Type O, Positive'],
                [8, 'O-', 'Type O, Negative'],
            ]
        );
    }
}
