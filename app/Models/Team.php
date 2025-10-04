<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'name',
        'is_private',
        'status',
        'region',
        'max_players',
        'user_ids',
        'leader_id',
        'api_team_id'
    ];

    protected $appends = ['members'];

    protected $casts = [
        'user_ids' => 'array',
        'is_private' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($team) {
            if (empty($team->team_id)) {
                $team->team_id = Str::uuid();
            }
        });
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_user', 'team_id', 'user_id')
                    ->withPivot(['joined_at', 'role'])
                    ->withTimestamps();
    }

    public function getMembersAttribute()
    {
        if (empty($this->user_ids)) {
            return collect();
        }
        
        return User::whereIn('id', $this->user_ids)->get()->map(function($user) {
            $user->country_flag = $user->getCountryFlag();
            return $user;
        });
    }

    public function addMember(User $user): bool
    {
        if ($this->isFull()) {
            return false;
        }

        $userIds = $this->user_ids ?? [];
        
        if (!in_array($user->id, $userIds)) {
            $userIds[] = $user->id;
            $this->user_ids = $userIds;
            $this->save();
            
            // Also add to pivot table for relationships
            $this->users()->attach($user->id, [
                'joined_at' => now(),
                'role' => $user->id === $this->leader_id ? 'leader' : 'member'
            ]);
            
            return true;
        }
        
        return false;
    }

    public function removeMember(User $user): bool
    {
        $userIds = $this->user_ids ?? [];
        
        if (in_array($user->id, $userIds)) {
            $userIds = array_values(array_filter($userIds, fn($id) => $id !== $user->id));
            $this->user_ids = $userIds;
            $this->save();
            
            // Remove from pivot table
            $this->users()->detach($user->id);
            
            // If team becomes empty, delete it
            if (empty($userIds)) {
                $this->deleteTeamFromApi();
                $this->delete();
                return true;
            }
            
            // If leader left, assign new leader
            if ($user->id === $this->leader_id && !empty($userIds)) {
                $this->leader_id = $userIds[0];
                $this->save();
                
                // Update role in pivot table
                $this->users()->updateExistingPivot($this->leader_id, ['role' => 'leader']);
            }
            
            return true;
        }
        
        return false;
    }

    public function isFull(): bool
    {
        return count($this->user_ids ?? []) >= $this->max_players;
    }

    public function hasMember(User $user): bool
    {
        return in_array($user->id, $this->user_ids ?? []);
    }

    public function isLeader(User $user): bool
    {
        return $user->id === $this->leader_id;
    }

    public function getCurrentPlayersCount(): int
    {
        return count($this->user_ids ?? []);
    }

    public function cooldowns(): HasMany
    {
        return $this->hasMany(TeamCooldown::class);
    }

    public function challengesSent(): HasMany
    {
        return $this->hasMany(TeamChallengeRequest::class, 'challenger_team_id');
    }

    public function challengesReceived(): HasMany
    {
        return $this->hasMany(TeamChallengeRequest::class, 'challenged_team_id');
    }

    public function activeChallenges(): HasMany
    {
        return $this->hasMany(TeamChallengeRequest::class, 'challenger_team_id')
                    ->where('status', 'pending')
                    ->where('expires_at', '>', now());
    }

    public function pendingChallenges(): HasMany
    {
        return $this->hasMany(TeamChallengeRequest::class, 'challenged_team_id')
                    ->where('status', 'pending')
                    ->where('expires_at', '>', now());
    }

    public function acceptedChallenges(): HasMany
    {
        return $this->hasMany(TeamChallengeRequest::class, 'challenger_team_id')
                    ->where('status', 'accepted');
    }

    public function isInChallenge(): bool
    {
        return $this->challengesSent()->where('status', 'accepted')->exists() ||
               $this->challengesReceived()->where('status', 'accepted')->exists();
    }

    public function canBeChallenged(): bool
    {
        return !$this->isInChallenge() && 
               !$this->isInActiveMatch() &&
               $this->status === 'waiting' && 
               !$this->isFull();
    }

    public function isInActiveMatch(): bool
    {
        return \App\Models\GameMatch::where(function($query) {
                $query->where('team1_id', $this->id)
                      ->orWhere('team2_id', $this->id);
            })
            ->where('is_finished', false)
            ->where('is_cancelled', false)
            ->whereNotNull('started_at')
            ->exists();
    }

    public function kickMember(User $user, User $kicker, ?string $reason = null): bool
    {
        // Only leaders can kick members
        if (!$this->isLeader($kicker)) {
            return false;
        }

        // Cannot kick the leader
        if ($user->id === $this->leader_id) {
            return false;
        }

        // Check if user is actually a member
        if (!$this->hasMember($user)) {
            return false;
        }

        // Remove member from team
        $removed = $this->removeMember($user);
        
        if ($removed) {
            // Create cooldown to prevent user from joining this team for 120 seconds
            TeamCooldown::createCooldown($user->id, $this->id, $kicker->id, $reason);
        }

        return $removed;
    }

    public function canUserJoin(User $user): bool
    {
        // Check if user is on cooldown for this team
        if (TeamCooldown::isUserOnCooldown($user->id, $this->id)) {
            return false;
        }

        // Check if team is full
        if ($this->isFull()) {
            return false;
        }

        // Check if user is already in the team
        if ($this->hasMember($user)) {
            return false;
        }

        return true;
    }

    /**
     * Delete team from external API
     */
    public function deleteTeamFromApi(): bool
    {
        if (!$this->api_team_id) {
            return false;
        }

        try {
            $teamApiService = app(\App\Services\TeamApiService::class);
            return $teamApiService->deleteTeam($this->api_team_id);
        } catch (\Exception $e) {
            \Log::error('Failed to delete team from API', [
                'team_id' => $this->id,
                'api_team_id' => $this->api_team_id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Update ELO for all team members
     */
    public function updateMemberElo(int $eloChange): void
    {
        if (empty($this->user_ids)) {
            return;
        }

        $users = \App\Models\User::whereIn('id', $this->user_ids)->get();
        
        foreach ($users as $user) {
            $user->elo = max(0, ($user->elo ?? 0) + $eloChange);
            $user->save();
        }
    }

    /**
     * Award ELO to winning team
     */
    public function awardWinElo(): void
    {
        $this->updateMemberElo(25);
    }

    /**
     * Deduct ELO from losing team
     */
    public function deductLossElo(): void
    {
        $this->updateMemberElo(-25);
    }
}