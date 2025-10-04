<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameMatch extends Model
{
    protected $fillable = [
        'match_id',
        'api_match_id',
        'server_id',
        'server_ip',
        'server_port',
        'server_display_name',
        'team1_id',
        'team2_id',
        'api_team1_id',
        'api_team2_id',
        'status',
        'map',
        'server_password',
        'title',
        'started_at',
        'connection_validated_at',
        'ended_at',
        'winner_team_id',
        'team1_score',
        'team2_score',
        'is_finished',
        'is_cancelled',
        'match_data'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'connection_validated_at' => 'datetime',
        'ended_at' => 'datetime',
        'is_finished' => 'boolean',
        'is_cancelled' => 'boolean',
        'match_data' => 'array',
        'team1_score' => 'integer',
        'team2_score' => 'integer',
    ];

    public function team1(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'team1_id');
    }

    public function team2(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'team2_id');
    }

    public function winnerTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'winner_team_id');
    }

    /**
     * Check if match is active (started but not finished)
     */
    public function isActive(): bool
    {
        return !$this->is_finished && !$this->is_cancelled && $this->started_at <= now();
    }

    /**
     * Get the winning team
     */
    public function getWinningTeam(): ?Team
    {
        if (!$this->is_finished || !$this->winner_team_id) {
            return null;
        }

        return $this->winner_team_id === $this->team1_id ? $this->team1 : $this->team2;
    }

    /**
     * Get the losing team
     */
    public function getLosingTeam(): ?Team
    {
        if (!$this->is_finished || !$this->winner_team_id) {
            return null;
        }

        return $this->winner_team_id === $this->team1_id ? $this->team2 : $this->team1;
    }
}
