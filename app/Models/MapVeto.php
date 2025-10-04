<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MapVeto extends Model
{
    protected $table = 'map_vetoes';

    protected $fillable = [
        'challenge_id',
        'map_name',
        'banned_by_team_id',
        'veto_order',
    ];

    protected $casts = [
        'veto_order' => 'integer',
    ];

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(TeamChallengeRequest::class, 'challenge_id');
    }

    public function bannedByTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'banned_by_team_id');
    }
}
