<?php

namespace App\Services;

use App\Models\Team;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TeamApiService
{
    private string $apiUrl;
    private string $apiToken;

    public function __construct()
    {
        $this->apiUrl = env('TEAM_API_URL');
        $this->apiToken = env('TEAM_API_TOKEN');
    }

  
    public function createTeam(Team $team, string $role = 'challenger'): ?array
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('API configuration missing');
            }

            $teamData = $this->prepareTeamData($team, $role);
            
            $response = $this->makeApiRequest('/teams', [$teamData]);

            if ($response->successful()) {
                $responseData = $response->json();
                if (isset($responseData['id'])) {
                    $team->api_team_id = $responseData['id'];
                    $team->save();
                }
                
                Log::info("Successfully created team via API", [
                    'team_id' => $team->id,
                    'api_team_id' => $responseData['id'] ?? null,
                    'role' => $role,
                    'response' => $responseData
                ]);
                return $responseData;
            } else {
                throw new \Exception('API request failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to create team via API', [
                'team_id' => $team->id,
                'role' => $role,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

  
    public function createMatchTeams(Team $challengerTeam, Team $challengedTeam): ?array
    {
        try {
            $challengerData = $this->createTeam($challengerTeam, 'challenger');
            $challengedData = $this->createTeam($challengedTeam, 'challenged');

            if ($challengerData && $challengedData) {
                $result = [
                    'challenger_team' => $challengerData,
                    'challenged_team' => $challengedData
                ];

                return $result;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Failed to create match teams via API', [
                'challenger_team_id' => $challengerTeam->id,
                'challenged_team_id' => $challengedTeam->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

  
    private function prepareTeamData(Team $team, string $role): array
    {
        return [
            'name' => $this->truncateTeamName($team->name ?: "Team {$team->team_id}"),
            'flag' => $this->getTeamFlag($team),
            'auth_name' => $this->getTeamAuthNames($team),
            'tag' => $this->getTeamTag($team),
            'public_team' => !$team->is_private
        ];
    }

       private function truncateTeamName(string $name, int $maxLength = 30): string
    {
        return strlen($name) > $maxLength ? substr($name, 0, $maxLength) : $name;
    }

   
    private function getTeamFlag(Team $team): string
    {
        $flags = $team->members->map(function($member) {
            return $member->getCountryFlag();
        })->filter()->values();

        if ($flags->isEmpty()) {
            return 'US'; 
        }
        
        return $flags->countBy()->sortDesc()->keys()->first() ?: 'US';
    }

   
    private function getTeamTag(Team $team): string
    {
        $name = $team->name ?: $team->team_id;
        return strtoupper(substr($name, 0, 3));
    }

    private function getTeamAuthNames(Team $team): array
    {
        $authNames = [];
        
        foreach ($team->members as $member) {
            $steamId = $member->steam_id ?: '76561198000000001';
            $authNames[$steamId] = [
                'name' => $this->truncatePlayerName($member->steam_username ?: $member->name),
                'captain' => $member->id === $team->leader_id,
                'coach' => $member->id === $team->leader_id
            ];
        }

        return $authNames;
    }

   
    private function truncatePlayerName(string $name, int $maxLength = 30): string
    {
        return strlen($name) > $maxLength ? substr($name, 0, $maxLength) : $name;
    }

 
    private function makeApiRequest(string $endpoint, array $data = [])
    {
        return Http::withHeaders([
            'accept' => 'application/json',
            'Content-Type' => 'application/json',
            'user-api' => $this->apiToken
        ])->post($this->apiUrl . $endpoint, $data);
    }

  
    private function isConfigured(): bool
    {
        return !empty($this->apiUrl) && !empty($this->apiToken);
    }

  
    public function deleteTeam(int $apiTeamId): bool
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('API configuration missing');
            }

            $response = $this->makeDeleteRequest('/teams/', [
                'team_id' => $apiTeamId
            ]);

            if ($response->successful()) {
                Log::info("Successfully deleted team via API", [
                    'api_team_id' => $apiTeamId,
                    'response' => $response->json()
                ]);
                return true;
            } else {
                throw new \Exception('API request failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to delete team via API', [
                'api_team_id' => $apiTeamId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

   
    private function makeDeleteRequest(string $endpoint, array $data = [])
    {
        return Http::withHeaders([
            'accept' => 'application/json',
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $this->apiToken
        ])->delete($this->apiUrl . $endpoint, $data);
    }

  
    public function deleteTeams(array $apiTeamIds): bool
    {
        $success = true;
        
        foreach ($apiTeamIds as $apiTeamId) {
            if (!$this->deleteTeam($apiTeamId)) {
                $success = false;
            }
        }
        
        return $success;
    }

   
    public function testConnection(): bool
    {
        try {
            if (!$this->isConfigured()) {
                return false;
            }

            $response = Http::withHeaders([
                'accept' => 'application/json',
                'user-api' => $this->apiToken
            ])->get($this->apiUrl . '/health');

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('API connection test failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
