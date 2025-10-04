<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class ServerConnectionService
{
  
    public function checkServerConnection(string $host, int $port): ?array
    {
        try {
            $command = "gamedig --type csgo --host {$host} --port {$port}";
            
            $result = Process::run($command);
            
            if ($result->successful()) {
                $output = $result->output();
                $data = json_decode($output, true);
                
                if ($data) {
                    Log::info('Server connection check successful', [
                        'host' => $host,
                        'port' => $port,
                        'numplayers' => $data['numplayers'] ?? 0,
                        'maxplayers' => $data['maxplayers'] ?? 0,
                        'players' => $data['players'] ?? []
                    ]);
                    
                    return $data;
                }
            } else {
                Log::error('Server connection check failed', [
                    'host' => $host,
                    'port' => $port,
                    'error' => $result->errorOutput(),
                    'exit_code' => $result->exitCode()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Exception during server connection check', [
                'host' => $host,
                'port' => $port,
                'error' => $e->getMessage()
            ]);
        }
        
        return null;
    }
    
  
    public function areAllPlayersConnected(string $host, int $port, int $expectedPlayerCount): bool
    {
        $serverData = $this->checkServerConnection($host, $port);
        
        if (!$serverData) {
            Log::warning('Server connection check failed, assuming players are connected to prevent false cancellation', [
                'host' => $host,
                'port' => $port,
                'expected_players' => $expectedPlayerCount
            ]);
            return true;
        }
        
        $connectedPlayers = $serverData['numplayers'] ?? 0;
        
        Log::info('Player connection validation', [
            'host' => $host,
            'port' => $port,
            'expected_players' => $expectedPlayerCount,
            'connected_players' => $connectedPlayers,
            'all_connected' => $connectedPlayers >= $expectedPlayerCount
        ]);
        
        return $connectedPlayers >= $expectedPlayerCount;
    }
    
 
    public function getServerInfo(string $host, int $port): ?array
    {
        return $this->checkServerConnection($host, $port);
    }
}
