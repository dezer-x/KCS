<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'country',
        'role',
        'email',
        'password',
        'steam_id',
        'steam_username',
        'steam_avatar',
        'steam_avatar_medium',
        'steam_avatar_full',
        'steam_profile_background',
        'steam_profile_url',
        'steam_real_name',
        'steam_persona_state',
        'steam_community_visibility_state',
        'steam_profile_state',
        'steam_last_logoff',
        'steam_comment_permission',
        'steam_country_code',
        'steam_state_code',
        'steam_city_id',
        'steam_games',
        'steam_friends',
        'steam_authenticated_at',
        'elo',
        'banned_at',
        'ban_reason',
        'ban_duration',
        'banned_until',
        'banned_by',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'steam_last_logoff' => 'datetime',
            'steam_authenticated_at' => 'datetime',
            'steam_games' => 'array',
            'steam_friends' => 'array',
            'elo' => 'integer',
            'banned_at' => 'datetime',
            'banned_until' => 'datetime',
        ];
    }

    /**
     * Check if user has Steam account linked
     */
    public function hasSteamAccount(): bool
    {
        return !is_null($this->steam_id);
    }

    /**
     * Get Steam profile URL
     */
    public function getSteamProfileUrl(): ?string
    {
        return $this->steam_profile_url;
    }

    /**
     * Get Steam avatar URL (prefer medium size)
     */
    public function getSteamAvatarUrl(): ?string
    {
        return $this->steam_avatar_medium ?? $this->steam_avatar;
    }

    /**
     * Get Steam display name
     */
    public function getSteamDisplayName(): ?string
    {
        return $this->steam_real_name ?? $this->steam_username;
    }

    /**
     * Get all friendships initiated by this user
     */
    public function friendships()
    {
        return $this->hasMany(Friend::class, 'user_id');
    }

    /**
     * Get all friendships where this user is the friend
     */
    public function friendOf()
    {
        return $this->hasMany(Friend::class, 'friend_id');
    }

    /**
     * Get all accepted friends
     */
    public function friends()
    {
        return $this->belongsToMany(User::class, 'friends', 'user_id', 'friend_id')
                    ->wherePivot('status', 'accepted')
                    ->withPivot(['accepted_at', 'created_at'])
                    ->withTimestamps();
    }

    /**
     * Get all pending friend requests sent by this user
     */
    public function pendingFriends()
    {
        return $this->belongsToMany(User::class, 'friends', 'user_id', 'friend_id')
                    ->wherePivot('status', 'pending')
                    ->withPivot(['created_at'])
                    ->withTimestamps();
    }

    /**
     * Get all pending friend requests received by this user
     */
    public function pendingFriendRequests()
    {
        return $this->belongsToMany(User::class, 'friends', 'friend_id', 'user_id')
                    ->wherePivot('status', 'pending')
                    ->withPivot(['created_at'])
                    ->withTimestamps();
    }

    /**
     * Get all blocked friends
     */
    public function blockedFriends()
    {
        return $this->belongsToMany(User::class, 'friends', 'user_id', 'friend_id')
                    ->wherePivot('status', 'blocked')
                    ->withPivot(['blocked_at', 'created_at', 'report_reason'])
                    ->withTimestamps();
    }

    /**
     * Check if this user is friends with another user
     */
    public function isFriendsWith(User $user): bool
    {
        return $this->friends()->where('friend_id', $user->id)->exists();
    }

    /**
     * Check if this user has a pending friend request from another user
     */
    public function hasPendingRequestFrom(User $user): bool
    {
        return $this->pendingFriendRequests()->where('user_id', $user->id)->exists();
    }

    /**
     * Check if this user has sent a pending friend request to another user
     */
    public function hasPendingRequestTo(User $user): bool
    {
        return $this->pendingFriends()->where('friend_id', $user->id)->exists();
    }

    /**
     * Check if this user has blocked another user
     */
    public function hasBlocked(User $user): bool
    {
        return Friend::where('user_id', $this->id)
                    ->where('friend_id', $user->id)
                    ->where('status', 'blocked')
                    ->exists();
    }

    /**
     * Get all friends (both directions) with their relationship data
     */
    public function allFriends()
    {
        return Friend::where(function($query) {
            $query->where('user_id', $this->id)
                  ->orWhere('friend_id', $this->id);
        })->where('status', 'accepted')
          ->with(['user', 'friend'])
          ->get()
          ->map(function($friendship) {
              return $friendship->user_id === $this->id ? $friendship->friend : $friendship->user;
          });
    }

    /**
     * Get friendship relationship between this user and another user
     */
    public function friendshipWith(User $user)
    {
        return Friend::where(function($query) use ($user) {
            $query->where('user_id', $this->id)->where('friend_id', $user->id)
                  ->orWhere('user_id', $user->id)->where('friend_id', $this->id);
        })->first();
    }

    /**
     * Check if there's any relationship between this user and another user
     */
    public function hasRelationshipWith(User $user): bool
    {
        return $this->friendshipWith($user) !== null;
    }

    /**
     * Check if user can change their country
     */
    public function canChangeCountry(): bool
    {
        return is_null($this->country);
    }

    /**
     * Get country flag code from country name
     */
    public function getCountryFlag(): ?string
    {
        if (!$this->country) {
            return null;
        }

        $countryFlags = [
            'germany' => 'DE',
            'lebanon' => 'LB',
            'united states' => 'US',
            'united kingdom' => 'GB',
            'france' => 'FR',
            'spain' => 'ES',
            'italy' => 'IT',
            'russia' => 'RU',
            'china' => 'CN',
            'japan' => 'JP',
            'south korea' => 'KR',
            'brazil' => 'BR',
            'canada' => 'CA',
            'australia' => 'AU',
            'netherlands' => 'NL',
            'sweden' => 'SE',
            'norway' => 'NO',
            'denmark' => 'DK',
            'finland' => 'FI',
            'poland' => 'PL',
            'ukraine' => 'UA',
            'turkey' => 'TR',
            'india' => 'IN',
            'thailand' => 'TH',
            'singapore' => 'SG',
            'malaysia' => 'MY',
            'indonesia' => 'ID',
            'philippines' => 'PH',
            'vietnam' => 'VN',
            'south africa' => 'ZA',
            'egypt' => 'EG',
            'saudi arabia' => 'SA',
            'israel' => 'IL',
            'mexico' => 'MX',
            'argentina' => 'AR',
            'chile' => 'CL',
            'colombia' => 'CO',
            'peru' => 'PE',
            'venezuela' => 'VE',
            'ecuador' => 'EC',
            'uruguay' => 'UY',
            'paraguay' => 'PY',
            'bolivia' => 'BO',
            'guyana' => 'GY',
            'suriname' => 'SR',
            'french guiana' => 'GF',
        ];

        $countryKey = strtolower(trim($this->country));
        return $countryFlags[$countryKey] ?? null;
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is regular user
     */
    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    /**
     * Check if user is banned
     */
    public function isBanned(): bool
    {
        if (!$this->banned_at) {
            return false;
        }

        // If banned_until is null, it's a permanent ban
        if (!$this->banned_until) {
            return true;
        }

        // Check if ban has expired
        return $this->banned_until->isFuture();
    }

    /**
     * Check if user has a permanent ban
     */
    public function isPermanentlyBanned(): bool
    {
        return $this->banned_at && !$this->banned_until;
    }

    /**
     * Get the admin who banned this user
     */
    public function bannedBy()
    {
        return $this->belongsTo(User::class, 'banned_by');
    }

    /**
     * Get users banned by this admin
     */
    public function bannedUsers()
    {
        return $this->hasMany(User::class, 'banned_by');
    }

    /**
     * Ban a user
     */
    public function banUser(User $user, string $reason, string $duration = 'permanent', ?int $bannedBy = null): void
    {
        $bannedUntil = null;
        
        if ($duration !== 'permanent') {
            $bannedUntil = now()->add($this->getDurationInCarbon($duration));
        }

        $user->update([
            'banned_at' => now(),
            'ban_reason' => $reason,
            'ban_duration' => $duration,
            'banned_until' => $bannedUntil,
            'banned_by' => $bannedBy,
        ]);
    }

    /**
     * Unban a user
     */
    public function unbanUser(User $user): void
    {
        $user->update([
            'banned_at' => null,
            'ban_reason' => null,
            'ban_duration' => null,
            'banned_until' => null,
            'banned_by' => null,
        ]);
    }

    /**
     * Convert duration string to Carbon interval
     */
    private function getDurationInCarbon(string $duration): string
    {
        return match($duration) {
            '1_day' => '1 day',
            '1_week' => '1 week',
            '1_month' => '1 month',
            '3_months' => '3 months',
            '6_months' => '6 months',
            '1_year' => '1 year',
            default => '1 day',
        };
    }

    /**
     * Boot method to add model events
     */
    protected static function boot()
    {
        parent::boot();

        // Prevent country changes after initial selection
        static::updating(function ($user) {
            if ($user->isDirty('country') && !is_null($user->getOriginal('country'))) {
                throw new \Exception('Country cannot be changed after initial selection.');
            }
        });
    }
}
