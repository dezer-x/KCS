<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamCooldown extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'team_id',
        'kicked_by',
        'expires_at',
        'reason',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function kickedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kicked_by');
    }

    public function isActive(): bool
    {
        return $this->expires_at > now();
    }

    public static function isUserOnCooldown(int $userId, int $teamId): bool
    {
        return self::where('user_id', $userId)
            ->where('team_id', $teamId)
            ->where('expires_at', '>', now())
            ->exists();
    }

    public static function createCooldown(int $userId, int $teamId, int $kickedBy, string $reason = null): self
    {
        return self::create([
            'user_id' => $userId,
            'team_id' => $teamId,
            'kicked_by' => $kickedBy,
            'expires_at' => now()->addSeconds(120), // 120 seconds cooldown
            'reason' => $reason,
        ]);
    }
}