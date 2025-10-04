<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class MatchmakingTeam extends Model
{
    protected $fillable = [
        'team_id',
        'leader_id',
        'name',
        'is_private',
        'status',
        'max_players',
        'current_players',
        'region',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'max_players' => 'integer',
        'current_players' => 'integer',
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

    /**
     * Get the team leader
     */
    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    /**
     * Get all team members
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'matchmaking_team_members', 'team_id', 'user_id')
                    ->withPivot(['role', 'joined_at', 'created_at', 'updated_at']);
    }

    /**
     * Get all invitations for this team
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(MatchmakingInvitation::class, 'team_id');
    }

    /**
     * Get pending invitations for this team
     */
    public function pendingInvitations(): HasMany
    {
        return $this->hasMany(MatchmakingInvitation::class, 'team_id')
                    ->where('status', 'pending')
                    ->where('expires_at', '>', now());
    }

    /**
     * Check if team is full
     */
    public function isFull(): bool
    {
        return $this->current_players >= $this->max_players;
    }

    /**
     * Check if team is waiting for more players
     */
    public function isWaiting(): bool
    {
        return $this->status === 'waiting' && !$this->isFull();
    }

    /**
     * Check if team is private
     */
    public function isPrivate(): bool
    {
        return $this->is_private;
    }

    /**
     * Check if team is public
     */
    public function isPublic(): bool
    {
        return !$this->is_private;
    }

    /**
     * Add a member to the team
     */
    public function addMember(User $user, string $role = 'member'): void
    {
        $this->members()->attach($user->id, [
            'role' => $role,
            'joined_at' => now(),
        ]);
        
        $this->increment('current_players');
    }

    /**
     * Remove a member from the team
     */
    public function removeMember(User $user): void
    {
        $this->members()->detach($user->id);
        $this->decrement('current_players');
        
        // If no members left, disband the team
        if ($this->current_players <= 0) {
            $this->update(['status' => 'disbanded']);
        }
    }

    /**
     * Check if user is a member of this team
     */
    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Check if user is the leader of this team
     */
    public function isLeader(User $user): bool
    {
        return $this->leader_id === $user->id;
    }

    /**
     * Get available slots
     */
    public function getAvailableSlots(): int
    {
        return max(0, $this->max_players - $this->current_players);
    }

    /**
     * Scope for public teams
     */
    public function scopePublic($query)
    {
        return $query->where('is_private', false);
    }

    /**
     * Scope for waiting teams
     */
    public function scopeWaiting($query)
    {
        return $query->where('status', 'waiting');
    }

    /**
     * Scope for teams with available slots
     */
    public function scopeWithAvailableSlots($query)
    {
        return $query->whereRaw('current_players < max_players');
    }
}