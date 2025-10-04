<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MatchApiService
{
    private string $apiUrl;
    private string $apiToken;

    public function __construct()
    {
        $this->apiUrl = env('TEAM_API_URL');
        $this->apiToken = env('TEAM_API_TOKEN');
    }

    public function getAvailableServers(): ?array
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('API configuration missing');
            }
            $response = Http::withHeaders([
                'accept' => 'application/json',
                'user-api' => $this->apiToken
            ])->get($this->apiUrl . '/servers/available');
            if ($response->successful()) {
                $data = $response->json();
                return $data['servers'] ?? $data;
            } else {
                throw new \Exception('API request failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to fetch available servers', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }


    public function createMatch(int $serverId, int $team1Id, int $team2Id, string $title = 'Team Match', ?string $mapName = null): ?array
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('API configuration missing');
            }
            $matchData = [
                'server_id' => $serverId,
                'team1_id' => $team1Id,
                'team2_id' => $team2Id,
                'season_id' => 1,
                'title' => $title,
                'start_time' => now()->format('Y-m-d H:i:s'),
                'max_maps' => 1,
                'skip_veto' => true,
                'private_match' => true,
                'enforce_teams' => true,
            ];

            Log::info('Sending match data to API', [
                'match_data' => $matchData,
                'json_payload' => [$matchData]
            ]);
            $response = $this->makeApiRequest('/matches', $matchData);
            if ($response->successful()) {
                $responseData = $response->json();
                Log::info("Successfully created match via API", [
                    'server_id' => $serverId,
                    'team1_id' => $team1Id,
                    'team2_id' => $team2Id,
                    'response' => $responseData,
                    'response_type' => gettype($responseData),
                    'is_array' => is_array($responseData)
                ]);

                // Return the raw response object
                return $responseData;
            } else {
                throw new \Exception('API request failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to create match via API', [
                'server_id' => $serverId,
                'team1_id' => $team1Id,
                'team2_id' => $team2Id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    
    public function getMatch(int $matchId): ?array
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('API configuration missing');
            }
            $response = Http::withHeaders([
                'accept' => 'application/json',
                'user-api' => $this->apiToken
            ])->get($this->apiUrl . '/matches/' . $matchId);

            if ($response->successful()) {
                Log::info("Successfully fetched match info", [
                    'match_id' => $matchId,
                    'response' => $response->json()
                ]);
                return $response->json();
            } else {
                throw new \Exception('API request failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to fetch match info', [
                'match_id' => $matchId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    public function cancelMatch(int $matchId): ?array
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('API configuration missing');
            }
            
            $response = Http::withHeaders([
                'accept' => 'application/json',
                'user-api' => $this->apiToken
            ])->get($this->apiUrl . '/matches/' . $matchId . '/cancel');

            if ($response->successful()) {
                Log::info("Successfully cancelled match", [
                    'match_id' => $matchId,
                    'response' => $response->json()
                ]);
                return $response->json();
            } else {
                throw new \Exception('API request failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to cancel match', [
                'match_id' => $matchId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    public function deleteMatch(int $matchId): ?array
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('API configuration missing');
            }
            
            $deleteData = [
                [
                    'match_id' => $matchId,
                    'all_cancelled' => false
                ]
            ];
            
            $response = Http::withHeaders([
                'accept' => 'application/json',
                'Content-Type' => 'application/json',
                'user-api' => $this->apiToken
            ])->delete($this->apiUrl . '/matches', $deleteData);

            if ($response->successful()) {
                Log::info("Successfully deleted match", [
                    'match_id' => $matchId,
                    'response' => $response->json()
                ]);
                return $response->json();
            } else {
                throw new \Exception('API request failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to delete match', [
                'match_id' => $matchId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

   
    public function sendRconCommand(int $matchId, string $command): ?array
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('API configuration missing');
            }

            $payload = [
                ['rcon_command' => $command]
            ];

            $response = Http::withHeaders([
                'accept' => 'application/json',
                'Content-Type' => 'application/json',
                'user-api' => $this->apiToken
            ])->put($this->apiUrl . '/matches/' . $matchId . '/rcon', $payload);

            if ($response->successful()) {
                Log::info("Successfully sent RCON command", [
                    'match_id' => $matchId,
                    'command' => $command,
                    'response' => $response->json()
                ]);
                return $response->json();
            } else {
                throw new \Exception('API request failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to send RCON command', [
                'match_id' => $matchId,
                'command' => $command,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    public function downloadDemo(int $matchId, string $fileName, int $mapNumber): ?\Illuminate\Http\Client\Response
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('API configuration missing');
            }

            $response = Http::withHeaders([
                'Get5-FileName' => $fileName,
                'Get5-MapNumber' => (string) $mapNumber,
                'Authorization' => $this->apiToken,
                'Get5-MatchId' => (string) $matchId,
            ])->timeout(300) 
            ->get($this->apiUrl . '/v2/demo');

            if ($response->successful()) {
                Log::info("Successfully downloaded demo", [
                    'match_id' => $matchId,
                    'file_name' => $fileName,
                    'map_number' => $mapNumber
                ]);
                return $response;
            } else {
                throw new \Exception('API request failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to download demo', [
                'match_id' => $matchId,
                'file_name' => $fileName,
                'map_number' => $mapNumber,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }


    private function makeApiRequest(string $endpoint, $data = [])
    {
        if (!is_array($data) || !isset($data[0])) {
            $data = [$data];
        }
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        Log::debug('Payload being sent to API', [
            'endpoint' => $endpoint,
            'payload' => $json
        ]);
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
}
