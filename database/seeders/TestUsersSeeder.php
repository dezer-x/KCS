<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test users with different ELO ratings and roles
        $users = [
            // Admin users
            [
                'name' => 'Admin User 1',
                'email' => 'admin1@test.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'elo' => 2500,
                'steam_id' => '76561198000000001',
                'steam_username' => 'AdminPlayer1',
                'steam_real_name' => 'Admin Player One',
                'created_at' => Carbon::now()->subDays(30),
            ],
            [
                'name' => 'Admin User 2',
                'email' => 'admin2@test.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'elo' => 2800,
                'steam_id' => '76561198000000002',
                'steam_username' => 'AdminPlayer2',
                'steam_real_name' => 'Admin Player Two',
                'created_at' => Carbon::now()->subDays(25),
            ],
            
            // High ELO users
            [
                'name' => 'Pro Player 1',
                'email' => 'pro1@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 3200,
                'steam_id' => '76561198000000003',
                'steam_username' => 'ProPlayer1',
                'steam_real_name' => 'Pro Player One',
                'created_at' => Carbon::now()->subDays(20),
            ],
            [
                'name' => 'Pro Player 2',
                'email' => 'pro2@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 3100,
                'steam_id' => '76561198000000004',
                'steam_username' => 'ProPlayer2',
                'steam_real_name' => 'Pro Player Two',
                'created_at' => Carbon::now()->subDays(18),
            ],
            [
                'name' => 'Pro Player 3',
                'email' => 'pro3@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 3000,
                'steam_id' => '76561198000000005',
                'steam_username' => 'ProPlayer3',
                'steam_real_name' => 'Pro Player Three',
                'created_at' => Carbon::now()->subDays(15),
            ],
            
            // Medium ELO users (1500-2000)
            [
                'name' => 'Average Player 1',
                'email' => 'avg1@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 1800,
                'steam_id' => '76561198000000006',
                'steam_username' => 'AvgPlayer1',
                'steam_real_name' => 'Average Player One',
                'created_at' => Carbon::now()->subDays(12),
            ],
            [
                'name' => 'Average Player 2',
                'email' => 'avg2@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 1650,
                'steam_id' => '76561198000000007',
                'steam_username' => 'AvgPlayer2',
                'steam_real_name' => 'Average Player Two',
                'created_at' => Carbon::now()->subDays(10),
            ],
            [
                'name' => 'Average Player 3',
                'email' => 'avg3@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 1950,
                'steam_id' => '76561198000000008',
                'steam_username' => 'AvgPlayer3',
                'steam_real_name' => 'Average Player Three',
                'created_at' => Carbon::now()->subDays(8),
            ],
            [
                'name' => 'Average Player 4',
                'email' => 'avg4@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 1720,
                'steam_id' => '76561198000000009',
                'steam_username' => 'AvgPlayer4',
                'steam_real_name' => 'Average Player Four',
                'created_at' => Carbon::now()->subDays(6),
            ],
            [
                'name' => 'Average Player 5',
                'email' => 'avg5@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 1880,
                'steam_id' => '76561198000000010',
                'steam_username' => 'AvgPlayer5',
                'steam_real_name' => 'Average Player Five',
                'created_at' => Carbon::now()->subDays(4),
            ],
            
            // Low ELO users (500-1000)
            [
                'name' => 'Beginner Player 1',
                'email' => 'beginner1@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 800,
                'steam_id' => '76561198000000011',
                'steam_username' => 'Beginner1',
                'steam_real_name' => 'Beginner Player One',
                'created_at' => Carbon::now()->subDays(3),
            ],
            [
                'name' => 'Beginner Player 2',
                'email' => 'beginner2@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 650,
                'steam_id' => '76561198000000012',
                'steam_username' => 'Beginner2',
                'steam_real_name' => 'Beginner Player Two',
                'created_at' => Carbon::now()->subDays(2),
            ],
            [
                'name' => 'Beginner Player 3',
                'email' => 'beginner3@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 720,
                'steam_id' => '76561198000000013',
                'steam_username' => 'Beginner3',
                'steam_real_name' => 'Beginner Player Three',
                'created_at' => Carbon::now()->subDays(1),
            ],
            [
                'name' => 'Beginner Player 4',
                'email' => 'beginner4@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 950,
                'steam_id' => '76561198000000014',
                'steam_username' => 'Beginner4',
                'steam_real_name' => 'Beginner Player Four',
                'created_at' => Carbon::now()->subHours(12),
            ],
            
            // Very low ELO users (0-500)
            [
                'name' => 'New Player 1',
                'email' => 'new1@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 200,
                'steam_id' => '76561198000000015',
                'steam_username' => 'NewPlayer1',
                'steam_real_name' => 'New Player One',
                'created_at' => Carbon::now()->subHours(6),
            ],
            [
                'name' => 'New Player 2',
                'email' => 'new2@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 150,
                'steam_id' => '76561198000000016',
                'steam_username' => 'NewPlayer2',
                'steam_real_name' => 'New Player Two',
                'created_at' => Carbon::now()->subHours(3),
            ],
            [
                'name' => 'New Player 3',
                'email' => 'new3@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 300,
                'steam_id' => '76561198000000017',
                'steam_username' => 'NewPlayer3',
                'steam_real_name' => 'New Player Three',
                'created_at' => Carbon::now()->subHours(1),
            ],
            
            // Recent users for the 7-day chart
            [
                'name' => 'Today Player 1',
                'email' => 'today1@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 1200,
                'steam_id' => '76561198000000018',
                'steam_username' => 'TodayPlayer1',
                'steam_real_name' => 'Today Player One',
                'created_at' => Carbon::now()->subHours(2),
            ],
            [
                'name' => 'Today Player 2',
                'email' => 'today2@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'elo' => 1350,
                'steam_id' => '76561198000000019',
                'steam_username' => 'TodayPlayer2',
                'steam_real_name' => 'Today Player Two',
                'created_at' => Carbon::now()->subMinutes(30),
            ],
        ];

        foreach ($users as $userData) {
            User::create($userData);
        }

        $this->command->info('Created ' . count($users) . ' test users with various ELO ratings and roles!');
    }
}
