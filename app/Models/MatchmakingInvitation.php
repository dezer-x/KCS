<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class MatchmakingInvitation extends Model
{
    protected $fillable = [
        'team_id',
        'inviter_id',
        'invited_user_id',
        'status',
        'expires_at',
        'responded_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    /**
     * Get the team this invitation is for
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(MatchmakingTeam::class, 'team_id');
    }

    /**
     * Get the user who sent the invitation
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inviter_id');
    }

    /**
     * Get the user who was invited
     */
    public function invitedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_user_id');
    }

    /**
     * Check if invitation is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if invitation is accepted
     */
    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }

    /**
     * Check if invitation is declined
     */
    public function isDeclined(): bool
    {
        return $this->status === 'declined';
    }

    /**
     * Check if invitation is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if invitation is valid (pending and not expired)
     */
    public function isValid(): bool
    {
        return $this->isPending() && !$this->isExpired();
    }

    /**
     * Accept the invitation
     */
    public function accept(): bool
    {
        if (!$this->isValid()) {
            return false;
        }

        $this->update([
            'status' => 'accepted',
            'responded_at' => now(),
        ]);

        // Add user to team
        $this->team->addMember($this->invitedUser);

        return true;
    }

    /**
     * Decline the invitation
     */
    public function decline(): bool
    {
        if (!$this->isValid()) {
            return false;
        }

        $this->update([
            'status' => 'declined',
            'responded_at' => now(),
        ]);

        return true;
    }

    /**
     * Mark invitation as expired
     */
    public function markAsExpired(): void
    {
        $this->update([
            'status' => 'expired',
            'responded_at' => now(),
        ]);
    }

    /**
     * Scope for pending invitations
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for valid invitations (pending and not expired)
     */
    public function scopeValid($query)
    {
        return $query->where('status', 'pending')
                    ->where('expires_at', '>', now());
    }

    /**
     * Scope for expired invitations
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'pending')
                    ->where('expires_at', '<=', now());
    }
}