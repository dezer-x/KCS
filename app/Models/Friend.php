<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Friend extends Model
{
    protected $fillable = [
        'user_id',
        'friend_id',
        'status',
        'accepted_at',
        'blocked_at',
        'report_reason',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
        'blocked_at' => 'datetime',
    ];

    /**
     * Get the user who initiated the friendship
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the friend user
     */
    public function friend(): BelongsTo
    {
        return $this->belongsTo(User::class, 'friend_id');
    }

    /**
     * Check if friendship is accepted
     */
    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }

    /**
     * Check if friendship is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if friendship is blocked
     */
    public function isBlocked(): bool
    {
        return $this->status === 'blocked';
    }
}
