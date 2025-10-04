<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class TeamChallengeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'challenger_team_id',
        'challenged_team_id',
        'status',
        'expires_at',
        'message',
        'challenger_ready',
        'challenged_ready',
        'match_started_at',
        'match_id'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'challenger_ready' => 'boolean',
        'challenged_ready' => 'boolean',
        'match_started_at' => 'datetime',
    ];

    public function challengerTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'challenger_team_id');
    }

    public function challengedTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'challenged_team_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function accept(): bool
    {
        if ($this->status !== 'pending' || $this->isExpired()) {
            return false;
        }

        $this->status = 'accepted';
        return $this->save();
    }

    public function decline(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->status = 'declined';
        return $this->save();
    }

    public function expire(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->status = 'expired';
        return $this->save();
    }

    public static function createChallenge(int $challengerTeamId, int $challengedTeamId, ?string $message = null): self
    {
        return self::create([
            'challenger_team_id' => $challengerTeamId,
            'challenged_team_id' => $challengedTeamId,
            'status' => 'pending',
            'expires_at' => now()->addHours(24),
            'message' => $message
        ]);
    }

    public static function getActiveChallengesForTeam(int $teamId): \Illuminate\Database\Eloquent\Collection
    {
        return self::with(['challengerTeam.leader', 'challengedTeam.leader'])
            ->where(function($query) use ($teamId) {
                $query->where('challenger_team_id', $teamId)
                      ->orWhere('challenged_team_id', $teamId);
            })
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->get();
    }

    public static function getPendingChallengesForTeam(int $teamId): \Illuminate\Database\Eloquent\Collection
    {
        return self::with(['challengerTeam.leader'])
            ->where('challenged_team_id', $teamId)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->get()
            ->map(function($challenge) {
                if ($challenge->challenger_team) {
                    $challenge->challenger_team->members = $challenge->challenger_team->getMembersAttribute();
                }
                return $challenge;
            });
    }

    public static function getAcceptedChallengesForTeam(int $teamId): \Illuminate\Database\Eloquent\Collection
    {
        $challenges = self::where(function($query) use ($teamId) {
                $query->where('challenger_team_id', $teamId)
                      ->orWhere('challenged_team_id', $teamId);
            })
            ->whereIn('status', ['accepted', 'started'])
            ->get();

        // Load the teams separately to ensure they're loaded
        $challenges->load(['challengerTeam.leader', 'challengedTeam.leader']);

        return $challenges->filter(function($challenge) {
            // Filter out challenges where the match is finished
            if ($challenge->match_id) {
                $gameMatch = \App\Models\GameMatch::where('match_id', $challenge->match_id)->first();
                return !$gameMatch || !$gameMatch->is_finished;
            }
            return true; // Keep challenges without matches
        })->values()->map(function($challenge) {
            if ($challenge->challenger_team) {
                $members = $challenge->challenger_team->getMembersAttribute();
                $challenge->challenger_team->members = $members;
                // Force the members to be included in JSON serialization
                $challenge->challenger_team->setAttribute('members', $members);
            }
            if ($challenge->challenged_team) {
                $members = $challenge->challenged_team->getMembersAttribute();
                $challenge->challenged_team->members = $members;
                // Force the members to be included in JSON serialization
                $challenge->challenged_team->setAttribute('members', $members);
            }
            return $challenge;
        });
    }

    public function isReadyToStart(): bool
    {
        return $this->challenger_ready && $this->challenged_ready && $this->status === 'accepted';
    }

    public function markTeamReady(int $teamId): bool
    {
        if ($this->challenger_team_id === $teamId) {
            $this->challenger_ready = true;
        } elseif ($this->challenged_team_id === $teamId) {
            $this->challenged_ready = true;
        } else {
            return false;
        }

        return $this->save();
    }

    public function startMatch(string $matchId): bool
    {
        if (!$this->isReadyToStart()) {
            return false;
        }

        $this->match_started_at = now();
        $this->match_id = $matchId;
        $this->status = 'started';

        return $this->save();
    }

    public function isMatchStarted(): bool
    {
        return !is_null($this->match_started_at);
    }

    public function isMatchFinished(): bool
    {
        if (!$this->match_id) {
            return false;
        }
        
        $gameMatch = \App\Models\GameMatch::where('match_id', $this->match_id)->first();
        return $gameMatch ? $gameMatch->is_finished : false;
    }

    public function markMatchCompleted(): bool
    {
        if (!$this->match_id) {
            return false;
        }
        
        $gameMatch = \App\Models\GameMatch::where('match_id', $this->match_id)->first();
        if ($gameMatch && $gameMatch->is_finished) {
            // Update challenge status based on match result
            if ($gameMatch->is_cancelled) {
                $this->status = 'expired'; // Treat cancelled matches as expired
            } else {
                $this->status = 'completed'; // We'll need to add this to the enum
            }
            return $this->save();
        }
        
        return false;
    }
}