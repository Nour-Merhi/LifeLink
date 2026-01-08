<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin user already exists
        $existingAdmin = User::where('email', 'admin@lifelink.com')->first();
        
        if ($existingAdmin) {
            $this->command->info('Admin user already exists. Skipping...');
            return;
        }

        // Create master admin user
        User::create([
            'code' => 'ADMIN-' . strtoupper(Str::random(8)),
            'first_name' => 'Master',
            'middle_name' => null,
            'last_name' => 'Admin',
            'email' => 'admin@lifelink.com',
            'phone_nb' => '0000000000', // Placeholder phone number
            'city' => null,
            'role' => 'Admin',
            'password' => Hash::make('AdminLifelink123!'),
            'email_verified_at' => now(),
        ]);

        $this->command->info('Master admin user created successfully!');
        $this->command->info('Email: admin@lifelink.com');
        $this->command->info('Password: AdminLifelink123!');
    }
}

