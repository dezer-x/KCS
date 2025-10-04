<?php

namespace App\Services;

use App\Models\Team;
use App\Models\TeamCooldown;
use App\Models\User;

class MatchmakingTeamService
{
    public function makeLeader(Team $team, User $newLeader, User $actor): bool
    {
        if (!$team->isLeader($actor)) {
            return false;
        }
        if (!$team->hasMember($newLeader)) {
            return false;
        }
        if ($newLeader->id === $team->leader_id) {
            return true;
        }

        $team->leader_id = $newLeader->id;
        $team->save();
        $team->users()->updateExistingPivot($newLeader->id, ['role' => 'leader']);
        return true;
    }

    public function kickMember(Team $team, User $member, User $actor, ?string $reason = null): bool
    {
        return $team->kickMember($member, $actor, $reason);
    }

    public function blockAndKickMember(Team $team, User $member, User $actor, ?string $reason = null): bool
    {
        $kicked = $team->kickMember($member, $actor, $reason);
        if (!$kicked) {
            return false;
        }
        TeamCooldown::updateOrCreate(
            [
                'user_id' => $member->id,
                'team_id' => $team->id,
            ],
            [
                'kicked_by' => $actor->id,
                'expires_at' => now()->addHours(24),
                'reason' => $reason ?? 'Blocked by team leader',
            ]
        );

        return true;
    }
}


