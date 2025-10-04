<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchmakingServer extends Model
{
    protected $fillable = [
        'ip_address',
        'port',
        'is_active',
        'max_players',
        'current_players',
        'is_occupied',
        'occupied_by_team_1',
        'occupied_by_team_2',
        'match_id',
        'match_started_at',
        'match_ended_at',
        'server_password',
        'rcon_password',
        'region',
        'tickrate',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_occupied' => 'boolean',
        'port' => 'integer',
        'max_players' => 'integer',
        'current_players' => 'integer',
        'tickrate' => 'integer',
        'match_started_at' => 'datetime',
        'match_ended_at' => 'datetime',
    ];


    /**
     * Get the server connection string
     */
    public function getConnectionString(): string
    {
        return "{$this->ip_address}:{$this->port}";
    }

    /**
     * Check if server is available for new matches
     */
    public function isAvailable(): bool
    {
        return $this->is_active && !$this->is_occupied;
    }

    /**
     * Check if server is full
     */
    public function isFull(): bool
    {
        return $this->current_players >= $this->max_players;
    }

    /**
     * Get available slots
     */
    public function getAvailableSlots(): int
    {
        return max(0, $this->max_players - $this->current_players);
    }

    /**
     * Start a match on this server
     */
    public function startMatch(string $team1Id, string $team2Id, string $matchId): void
    {
        $this->update([
            'is_occupied' => true,
            'occupied_by_team_1' => $team1Id,
            'occupied_by_team_2' => $team2Id,
            'match_id' => $matchId,
            'match_started_at' => now(),
            'current_players' => 10, // 5v5
        ]);
    }

    /**
     * End a match on this server
     */
    public function endMatch(): void
    {
        $this->update([
            'is_occupied' => false,
            'occupied_by_team_1' => null,
            'occupied_by_team_2' => null,
            'match_id' => null,
            'match_ended_at' => now(),
            'current_players' => 0,
        ]);
    }
}
