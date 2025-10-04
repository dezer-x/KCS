<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\User;
use App\Models\MatchmakingInvitation;
use App\Models\TeamCooldown;
use App\Models\TeamChallengeRequest;
use App\Services\TeamApiService;
use App\Services\ServerConnectionService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MatchmakingController extends Controller
{
    protected TeamApiService $teamApiService;
    protected ServerConnectionService $serverConnectionService;

    public function __construct(TeamApiService $teamApiService, ServerConnectionService $serverConnectionService)
    {
        $this->teamApiService = $teamApiService;
        $this->serverConnectionService = $serverConnectionService;
    }
    public function index()
    {
        $user = Auth::user();
        $teams = Team::with(['leader'])
            ->where('status', 'waiting')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($team) {
                $team->members = $team->getMembersAttribute();
                $team->is_in_active_match = $team->isInActiveMatch();
                $team->can_be_challenged = $team->canBeChallenged();
                return $team;
            });
        $userTeam = Team::whereJsonContains('user_ids', $user->id)
            ->with(['leader'])
            ->first();
        if ($userTeam) {
            $userTeam->members = $userTeam->getMembersAttribute();
        }
        $pendingInvitations = MatchmakingInvitation::with(['team', 'inviter'])
            ->where('invited_user_id', $user->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->get();

        $pendingChallenges = collect();
        $acceptedChallenges = collect();
        if ($userTeam) {
            $pendingChallenges = TeamChallengeRequest::getPendingChallengesForTeam($userTeam->id);
            $acceptedChallenges = TeamChallengeRequest::getAcceptedChallengesForTeam($userTeam->id);
        }

        return Inertia::render('Matchmaking', [
            'teams' => $teams,
            'userTeam' => $userTeam,
            'pendingInvitations' => $pendingInvitations,
            'pendingChallenges' => $pendingChallenges,
            'acceptedChallenges' => $acceptedChallenges,
            'authUserId' => $user?->id,
        ]);
    }
    public function createTeam(Request $request)
    {
        $user = Auth::user();
        $existingTeam = Team::whereJsonContains('user_ids', $user->id)->first();
        
        if ($existingTeam) {
            $existingTeam->load(['leader']);
            $existingTeam->members = $existingTeam->getMembersAttribute();
            
            return response()->json([
                'success' => true,
                'team' => $existingTeam,
                'message' => 'You are already in a team. Here is your current team.',
                'already_in_team' => true
            ]);
        }
        
        $team = Team::create([
            'name' => $request->input('name'),
            'is_private' => $request->boolean('is_private', false),
            'region' => $request->input('region', 'US'),
            'leader_id' => $user->id,
            'user_ids' => [$user->id],
        ]);
        $team->users()->attach($user->id, [
            'joined_at' => now(),
            'role' => 'leader'
        ]);
        $team->load(['leader']);
        $team->members = $team->getMembersAttribute();

        return response()->json([
            'success' => true,
            'team' => $team,
            'message' => 'Team created successfully!',
            'already_in_team' => false
        ]);
    }

    public function inviteFriends(Request $request)
    {
        $user = Auth::user();
        $teamId = $request->input('team_id');
        $friendIds = $request->input('friend_ids', []);

        $team = Team::find($teamId);
        if (!$team || !$team->isLeader($user)) {
            return response()->json(['error' => 'Team not found or you are not the leader'], 404);
        }
        $invitations = [];
        foreach ($friendIds as $friendId) {
            $existingTeam = Team::whereJsonContains('user_ids', $friendId)->first();
            if ($existingTeam) {
                continue;
            }
            $existingInvitation = MatchmakingInvitation::where('team_id', $teamId)
                ->where('invited_user_id', $friendId)
                ->where('status', 'pending')
                ->first();
            if (!$existingInvitation) {
                $invitation = MatchmakingInvitation::create([
                    'team_id' => $teamId,
                    'inviter_id' => $user->id,
                    'invited_user_id' => $friendId,
                    'expires_at' => now()->addHours(24),
                ]);
                $invitation->load(['team', 'inviter']);
                $invitations[] = $invitation;
            }
        }
        return response()->json([
            'success' => true,
            'invitations' => $invitations
        ]);
    }

    public function acceptInvitation(Request $request)
    {
        $user = Auth::user();
        $invitationId = $request->input('invitation_id');

        $invitation = MatchmakingInvitation::with(['team'])
            ->where('id', $invitationId)
            ->where('invited_user_id', $user->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if (!$invitation) {
            return response()->json(['error' => 'Invitation not found or expired'], 404);
        }
        $team = $invitation->team;
        if ($team->isFull()) {
            return response()->json(['error' => 'Team is full'], 400);
        }
        $existingTeam = Team::whereJsonContains('user_ids', $user->id)->first();
        if ($existingTeam) {
            return response()->json(['error' => 'You are already in a team'], 400);
        }
        $team->addMember($user);
        $invitation->accept();
        $team->load(['leader']);
        $team->members = $team->getMembersAttribute();
        $this->syncQueueOnMemberJoin($team, $user->id);

        return response()->json([
            'success' => true,
            'team' => $team
        ]);
    }

    public function declineInvitation(Request $request)
    {
        $user = Auth::user();
        $invitationId = $request->input('invitation_id');
        $invitation = MatchmakingInvitation::where('id', $invitationId)
            ->where('invited_user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$invitation) {
            return response()->json(['error' => 'Invitation not found'], 404);
        }

        $invitation->decline();

        return response()->json(['success' => true]);
    }

    public function joinRandomTeam(Request $request)
    {
        $user = Auth::user();
        $existingTeam = Team::whereJsonContains('user_ids', $user->id)->first();
        if ($existingTeam) {
            $existingTeam->load(['leader']);
            $existingTeam->members = $existingTeam->getMembersAttribute();
            
            return response()->json([
                'success' => true,
                'team' => $existingTeam,
                'message' => 'You are already in a team. Here is your current team.',
                'already_in_team' => true
            ]);
        }
        $teams = Team::where('status', 'waiting')
            ->where('is_private', false)
            ->whereRaw('JSON_LENGTH(user_ids) < max_players')
            ->whereDoesntHave('challengesSent', function($query) {
                $query->where('status', 'accepted');
            })
            ->whereDoesntHave('challengesReceived', function($query) {
                $query->where('status', 'accepted');
            })
            ->orderBy('created_at', 'asc')
            ->get();

        $team = null;
        foreach ($teams as $candidateTeam) {
            if ($candidateTeam->canUserJoin($user)) {
                $team = $candidateTeam;
                break;
            }
        }

        if (!$team) {
            return response()->json(['error' => 'No available teams found'], 404);
        }

        $team->addMember($user);
        $team->load(['leader']);
        $team->members = $team->getMembersAttribute();
        $this->syncQueueOnMemberJoin($team, $user->id);

        return response()->json([
            'success' => true,
            'team' => $team
        ]);
    }

    public function leaveTeam(Request $request)
    {
        $user = Auth::user();
        
        $team = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$team) {
            return response()->json(['error' => 'You are not in a team'], 404);
        }
        $this->removeUserFromAnyQueue($user->id);

        $team->removeMember($user);

        return response()->json(['success' => true]);
    }

    public function getTeams()
    {
        $teams = Team::with(['leader'])
            ->where('status', 'waiting')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($team) {
                $team->members = $team->getMembersAttribute();
                $team->is_in_active_match = $team->isInActiveMatch();
                $team->can_be_challenged = $team->canBeChallenged();
                return $team;
            });

        return response()->json(['teams' => $teams]);
    }

    public function getPendingInvitations()
    {
        $user = Auth::user();
        
        $invitations = MatchmakingInvitation::with(['team', 'inviter'])
            ->where('invited_user_id', $user->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->get();

        return response()->json(['invitations' => $invitations]);
    }

    public function getUserTeam()
    {
        $user = Auth::user();
        $userTeam = Team::whereJsonContains('user_ids', $user->id)
            ->with(['leader'])
            ->first();
        if ($userTeam) {
            $userTeam->members = $userTeam->getMembersAttribute();
        }
        return response()->json(['team' => $userTeam]);
    }

    public function kickMember(Request $request)
    {
        $user = Auth::user();
        $memberId = $request->input('member_id');
        $reason = $request->input('reason');
        $team = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$team) {
            return response()->json(['error' => 'You are not in a team'], 404);
        }
        if (!$team->isLeader($user)) {
            return response()->json(['error' => 'Only team leaders can kick members'], 403);
        }
        $memberToKick = User::find($memberId);
        if (!$memberToKick) {
            return response()->json(['error' => 'Member not found'], 404);
        }
        if (!$team->hasMember($memberToKick)) {
            return response()->json(['error' => 'User is not a member of this team'], 400);
        }
        $this->removeUserFromAnyQueue($memberToKick->id);

        $kicked = $team->kickMember($memberToKick, $user, $reason);
        
        if (!$kicked) {
            return response()->json(['error' => 'Failed to kick member'], 400);
        }
        $team->load(['leader']);
        $team->members = $team->getMembersAttribute();

        return response()->json([
            'success' => true,
            'team' => $team,
            'message' => 'Member has been kicked from the team'
        ]);
    }

    public function challengeTeam(Request $request)
    {
        $user = Auth::user();
        $challengedTeamId = $request->input('challenged_team_id');
        $message = $request->input('message');

        $userTeam = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$userTeam) {
            return response()->json(['error' => 'You are not in a team'], 404);
        }

        if (!$userTeam->isLeader($user)) {
            return response()->json(['error' => 'Only team leaders can challenge other teams'], 403);
        }

        $challengedTeam = Team::find($challengedTeamId);
        if (!$challengedTeam) {
            return response()->json(['error' => 'Team not found'], 404);
        }

        if ($userTeam->id === $challengedTeam->id) {
            return response()->json(['error' => 'Cannot challenge your own team'], 400);
        }

        if (!$challengedTeam->canBeChallenged()) {
            return response()->json(['error' => 'This team cannot be challenged'], 400);
        }

        $userTeamInAcceptedChallenge = TeamChallengeRequest::where(function($query) use ($userTeam) {
                $query->where('challenger_team_id', $userTeam->id)
                      ->orWhere('challenged_team_id', $userTeam->id);
            })
            ->where('status', 'accepted')
            ->first();

        if ($userTeamInAcceptedChallenge) {
            return response()->json(['error' => 'Your team is already in an accepted challenge'], 400);
        }

        $existingChallenge = TeamChallengeRequest::where('challenger_team_id', $userTeam->id)
            ->where('challenged_team_id', $challengedTeam->id)
            ->where('status', 'pending')
            ->first();

        if ($existingChallenge) {
            return response()->json(['error' => 'You have already challenged this team'], 400);
        }

        $challenge = TeamChallengeRequest::createChallenge($userTeam->id, $challengedTeam->id, $message);

        $challenge = $challenge->load(['challengerTeam.leader', 'challengedTeam.leader']);
        if ($challenge->challenger_team) {
            $challenge->challenger_team->members = $challenge->challenger_team->getMembersAttribute();
        }
        if ($challenge->challenged_team) {
            $challenge->challenged_team->members = $challenge->challenged_team->getMembersAttribute();
        }

        return response()->json([
            'success' => true,
            'challenge' => $challenge,
            'message' => 'Challenge sent successfully'
        ]);
    }

    public function acceptChallenge(Request $request)
    {
        $user = Auth::user();
        $challengeId = $request->input('challenge_id');

        $userTeam = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$userTeam) {
            return response()->json(['error' => 'You are not in a team'], 404);
        }

        if (!$userTeam->isLeader($user)) {
            return response()->json(['error' => 'Only team leaders can accept challenges'], 403);
        }

        $challenge = TeamChallengeRequest::with(['challengerTeam', 'challengedTeam'])
            ->where('id', $challengeId)
            ->where('challenged_team_id', $userTeam->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if (!$challenge) {
            return response()->json(['error' => 'Challenge not found or expired'], 404);
        }

        if (!$challenge->accept()) {
            return response()->json(['error' => 'Failed to accept challenge'], 400);
        }

        $existingChallenges = TeamChallengeRequest::where('challenger_team_id', $userTeam->id)
            ->where('status', 'pending')
            ->get();

        foreach ($existingChallenges as $existingChallenge) {
            $existingChallenge->decline();
            \Log::info('Cancelled existing challenge due to accepting new one', [
                'cancelled_challenge_id' => $existingChallenge->id,
                'challenged_team_id' => $existingChallenge->challenged_team_id,
                'accepted_challenge_id' => $challenge->id
            ]);
        }

        $challenge = $challenge->load(['challengerTeam.leader', 'challengedTeam.leader']);
        if ($challenge->challenger_team) {
            $challenge->challenger_team->members = $challenge->challenger_team->getMembersAttribute();
        }
        if ($challenge->challenged_team) {
            $challenge->challenged_team->members = $challenge->challenged_team->getMembersAttribute();
        }

        return response()->json([
            'success' => true,
            'challenge' => $challenge,
            'message' => 'Challenge accepted successfully'
        ]);
    }

    public function declineChallenge(Request $request)
    {
        $user = Auth::user();
        $challengeId = $request->input('challenge_id');

        $userTeam = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$userTeam) {
            return response()->json(['error' => 'You are not in a team'], 404);
        }

        if (!$userTeam->isLeader($user)) {
            return response()->json(['error' => 'Only team leaders can decline challenges'], 403);
        }

        $challenge = TeamChallengeRequest::where('id', $challengeId)
            ->where('challenged_team_id', $userTeam->id)
            ->where('status', 'pending')
            ->first();

        if (!$challenge) {
            return response()->json(['error' => 'Challenge not found'], 404);
        }

        if (!$challenge->decline()) {
            return response()->json(['error' => 'Failed to decline challenge'], 400);
        }

        return response()->json(['success' => true]);
    }

    public function makeTeamLeader(Request $request)
    {
        $user = Auth::user();
        $memberId = $request->input('member_id');
        $team = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$team) {
            return response()->json(['error' => 'You are not in a team'], 404);
        }
        if (!$team->isLeader($user)) {
            return response()->json(['error' => 'Only team leaders can assign a new leader'], 403);
        }
        $newLeader = User::find($memberId);
        if (!$newLeader || !$team->hasMember($newLeader)) {
            return response()->json(['error' => 'Selected user is not a team member'], 404);
        }
        $service = app(\App\Services\MatchmakingTeamService::class);
        if (!$service->makeLeader($team, $newLeader, $user)) {
            return response()->json(['error' => 'Failed to assign new leader'], 400);
        }
        $team->load(['leader']);
        $team->members = $team->getMembersAttribute();
        return response()->json(['success' => true, 'team' => $team]);
    }

    public function blockAndKickMember(Request $request)
    {
        $user = Auth::user();
        $memberId = $request->input('member_id');
        $reason = $request->input('reason');
        $team = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$team) {
            return response()->json(['error' => 'You are not in a team'], 404);
        }
        if (!$team->isLeader($user)) {
            return response()->json(['error' => 'Only team leaders can block members'], 403);
        }
        $member = User::find($memberId);
        if (!$member || !$team->hasMember($member)) {
            return response()->json(['error' => 'User is not a member of this team'], 404);
        }
        $this->removeUserFromAnyQueue($member->id);

        $service = app(\App\Services\MatchmakingTeamService::class);
        if (!$service->blockAndKickMember($team, $member, $user, $reason)) {
            return response()->json(['error' => 'Failed to block and kick member'], 400);
        }
        $team->load(['leader']);
        $team->members = $team->getMembersAttribute();
        return response()->json(['success' => true, 'team' => $team]);
    }

    public function getChallenges()
    {
        $user = Auth::user();
        $userTeam = Team::whereJsonContains('user_ids', $user->id)->first();

        if (!$userTeam) {
            return response()->json([
                'pendingChallenges' => [],
                'acceptedChallenges' => []
            ]);
        }

        $pendingChallenges = TeamChallengeRequest::getPendingChallengesForTeam($userTeam->id);
        $acceptedChallenges = TeamChallengeRequest::getAcceptedChallengesForTeam($userTeam->id);

        $acceptedChallenges = $acceptedChallenges->map(function($challenge) {
            if ($challenge->status === 'started' && $challenge->match_id) {
                $gameMatch = \App\Models\GameMatch::where('match_id', $challenge->match_id)->first();
                if ($gameMatch) {
                    $challenge->server_info = [
                        'ip' => $gameMatch->server_ip,
                        'port' => $gameMatch->server_port,
                        'name' => $gameMatch->server_display_name,
                        'password' => $gameMatch->server_password
                    ];
                }
            }
            return $challenge;
        });

        return response()->json([
            'pendingChallenges' => $pendingChallenges->values(),
            'acceptedChallenges' => $acceptedChallenges->values()
        ]);
    }

    public function leaveChallenge(Request $request)
    {
        $user = Auth::user();
        $challengeId = $request->input('challenge_id');
        
        $challenge = TeamChallengeRequest::find($challengeId);
        if (!$challenge) {
            return response()->json(['error' => 'Challenge not found'], 404);
        }

        $userTeam = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$userTeam) {
            return response()->json(['error' => 'You are not in a team'], 404);
        }
        if ($challenge->challenger_team_id !== $userTeam->id && $challenge->challenged_team_id !== $userTeam->id) {
            return response()->json(['error' => 'Your team is not part of this challenge'], 403);
        }
        if ($challenge->match_started_at) {
            return response()->json(['error' => 'Cannot leave a challenge that has already started'], 403);
        }
        $challengerTeam = $challenge->challengerTeam;
        $challengedTeam = $challenge->challengedTeam;
        
        $apiTeamIds = [];
        if ($challengerTeam && $challengerTeam->api_team_id) {
            $apiTeamIds[] = $challengerTeam->api_team_id;
        }
        if ($challengedTeam && $challengedTeam->api_team_id) {
            $apiTeamIds[] = $challengedTeam->api_team_id;
        }
        if (!empty($apiTeamIds)) {
            $this->teamApiService->deleteTeams($apiTeamIds);
            if ($challengerTeam && $challengerTeam->api_team_id) {
                $challengerTeam->api_team_id = null;
                $challengerTeam->save();
            }
            if ($challengedTeam && $challengedTeam->api_team_id) {
                $challengedTeam->api_team_id = null;
                $challengedTeam->save();
            }
        }
        $challenge->delete();

        return response()->json(['success' => true, 'message' => 'Successfully left the challenge']);
    }

    public function updateTeamName(Request $request)
    {
        $user = Auth::user();
        $teamId = $request->input('team_id');
        $newName = $request->input('name');

        $team = Team::find($teamId);
        if (!$team) {
            return response()->json(['error' => 'Team not found'], 404);
        }

        if (!$team->isLeader($user)) {
            return response()->json(['error' => 'Only team leaders can change team name'], 403);
        }

        $team->name = $newName;
        $team->save();

        return response()->json([
            'success' => true,
            'team' => $team->load(['leader']),
            'message' => 'Team name updated successfully'
        ]);
    }

    public function markTeamReady(Request $request)
    {
        $user = Auth::user();
        $challengeId = $request->input('challenge_id');

        $userTeam = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$userTeam) {
            return response()->json(['error' => 'You are not in a team'], 404);
        }

        if (!$userTeam->isLeader($user)) {
            return response()->json(['error' => 'Only team leaders can mark team ready'], 403);
        }

        $challenge = TeamChallengeRequest::with(['challengerTeam', 'challengedTeam'])
            ->where('id', $challengeId)
            ->where(function($query) use ($userTeam) {
                $query->where('challenger_team_id', $userTeam->id)
                      ->orWhere('challenged_team_id', $userTeam->id);
            })
            ->where('status', 'accepted')
            ->first();

        if (!$challenge) {
            return response()->json(['error' => 'Challenge not found'], 404);
        }

        \Log::info('Challenge loaded for match start', [
            'challenge_id' => $challenge->id,
            'challenger_team' => $challenge->challenger_team ? $challenge->challenger_team->id : 'null',
            'challenged_team' => $challenge->challenged_team ? $challenge->challenged_team->id : 'null',
            'challenger_team_loaded' => $challenge->relationLoaded('challengerTeam'),
            'challenged_team_loaded' => $challenge->relationLoaded('challengedTeam')
        ]);

        if (!$challenge->markTeamReady($userTeam->id)) {
            return response()->json(['error' => 'Failed to mark team ready'], 400);
        }

        $otherChallenges = TeamChallengeRequest::where(function($query) use ($userTeam) {
                $query->where('challenger_team_id', $userTeam->id)
                      ->orWhere('challenged_team_id', $userTeam->id);
            })
            ->where('id', '!=', $challenge->id)
            ->where('status', 'pending')
            ->get();

        foreach ($otherChallenges as $otherChallenge) {
            $otherChallenge->decline();
            \Log::info('Cancelled other challenge due to team marking ready', [
                'cancelled_challenge_id' => $otherChallenge->id,
                'ready_challenge_id' => $challenge->id,
                'team_id' => $userTeam->id
            ]);
        }


        $challenge = $challenge->fresh(['challengerTeam.leader', 'challengedTeam.leader']);
        if ($challenge->challenger_team) {
            $challenge->challenger_team->members = $challenge->challenger_team->getMembersAttribute();
        }
        if ($challenge->challenged_team) {
            $challenge->challenged_team->members = $challenge->challenged_team->getMembersAttribute();
        }

        return response()->json([
            'success' => true,
            'challenge' => $challenge,
            'message' => 'Team marked as ready'
        ]);
    }

    private function startMatch(TeamChallengeRequest $challenge)
    {
        try {
            if (!$challenge->challengerTeam || !$challenge->challengedTeam) {
                \Log::error('Teams not loaded in startMatch', [
                    'challenge_id' => $challenge->id,
                    'challenger_team_id' => $challenge->challenger_team_id,
                    'challenged_team_id' => $challenge->challenged_team_id,
                    'challenger_team_loaded' => $challenge->challengerTeam ? 'yes' : 'no',
                    'challenged_team_loaded' => $challenge->challengedTeam ? 'yes' : 'no'
                ]);
                return response()->json(['error' => 'Teams not properly loaded'], 500);
            }

            $matchApiService = app(\App\Services\MatchApiService::class);
            $servers = $matchApiService->getAvailableServers();
            if (!$servers || empty($servers)) {
                return response()->json(['error' => 'No servers available'], 500);
            }
            $server = $servers[0];
            if (!isset($server['id']) || !isset($server['ip_string']) || !isset($server['port'])) {
                \Log::error('Invalid server data', ['server' => $server]);
                return response()->json(['error' => 'Invalid server data'], 500);
            }
            
            $teamsData = $this->teamApiService->createMatchTeams($challenge->challengerTeam, $challenge->challengedTeam);

            if (!$teamsData) {
                \Log::error('Failed to create teams via API', [
                    'challenge_id' => $challenge->id,
                    'challenger_team_id' => $challenge->challenger_team_id,
                    'challenged_team_id' => $challenge->challenged_team_id
                ]);
                return response()->json(['error' => 'Failed to create teams via API'], 500);
            }
            
            if (!isset($teamsData['challenger_team']) || !isset($teamsData['challenged_team'])) {
                \Log::error('Invalid teams_data structure', ['teams_data' => $teamsData]);
                return response()->json(['error' => 'Invalid teams data structure'], 500);
            }
            $matchData = $matchApiService->createMatch(
                $server['id'],
                $teamsData['challenger_team']['id'],
                $teamsData['challenged_team']['id'],
                'Team Match: ' . ($challenge->challengerTeam->name ?? 'Team 1') . ' vs ' . ($challenge->challengedTeam->name ?? 'Team 2'),
                $challenge->challengerTeam->name ?? "Team {$challenge->challengerTeam->id}",
                $challenge->challengedTeam->name ?? "Team {$challenge->challengedTeam->id}"
            );

            if (!$matchData) {
                return response()->json(['error' => 'Failed to create match via API'], 500);
            }
            \Log::info('Match data received from API', [
                'match_data' => $matchData,
                'is_array' => is_array($matchData),
                'has_id' => isset($matchData['id']) ? 'yes' : 'no',
                'json_encoded' => json_encode($matchData)
            ]);
            $apiMatchId = $matchData['id'] ?? null;
            if (!$apiMatchId) {
                \Log::error('Could not find API match ID in response', ['match_data' => $matchData]);
                return response()->json(['error' => 'Failed to extract match ID from API response'], 500);
            }
            \Log::info('Found API match ID', ['api_match_id' => $apiMatchId]);
            $challengerTeamId = $teamsData['challenger_team']['id'] ?? null;
            $challengedTeamId = $teamsData['challenged_team']['id'] ?? null;
            
            if (!$challengerTeamId || !$challengedTeamId) {
                \Log::error('Missing team IDs in teams_data', [
                    'challenger_team_id' => $challengerTeamId,
                    'challenged_team_id' => $challengedTeamId,
                    'teams_data' => $teamsData
                ]);
                return response()->json(['error' => 'Missing team IDs - cannot start match'], 500);
            }

            \Log::info('Creating GameMatch with team data', [
                'challenge_id' => $challenge->id,
                'challenger_team_id' => $challengerTeamId,
                'challenged_team_id' => $challengedTeamId,
                'teams_data' => $teamsData
            ]);

            $gameMatch = \App\Models\GameMatch::create([
                'match_id' => 'match_' . time() . '_' . $challenge->id,
                'api_match_id' => $apiMatchId,
                'server_id' => $server['id'],
                'server_ip' => $server['ip_string'],
                'server_port' => $server['port'],
                'server_display_name' => $server['display_name'],
                'team1_id' => $challenge->challenger_team_id,
                'team2_id' => $challenge->challenged_team_id,  
                'api_team1_id' => $challengerTeamId,
                'api_team2_id' => $challengedTeamId,
                'title' => 'Team Match: ' . ($challenge->challengerTeam->name ?? 'Team 1') . ' vs ' . ($challenge->challengedTeam->name ?? 'Team 2'),
                'started_at' => now(),
                'status' => 'active',
                'match_data' => $matchData
            ]);

            $challenge->startMatch($gameMatch->match_id);
            return response()->json([
                'success' => true,
                'match_id' => $gameMatch->match_id,
                'server_ip' => $server['ip_string'],
                'server_port' => $server['port'],
                'server_display_name' => $server['display_name'],
                'challenger_team_data' => $teamsData['challenger_team'],
                'challenged_team_data' => $teamsData['challenged_team'],
                'message' => 'Match started successfully!'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to start match', [
                'challenge_id' => $challenge->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to start match: ' . $e->getMessage()], 500);
        }
    }

  
    public function joinQueue(Request $request)
    {
        $user = Auth::user();
        $now = now()->timestamp;

        $queueKey = 'mm:queue_groups';
        $lock = Cache::lock('mm:queue_lock', 10);
        try {
            $lock->block(3);
            $groups = Cache::get($queueKey, []);

            foreach ($groups as $g) {
                if (($g['type'] === 'solo' && $g['user_id'] === $user->id) ||
                    ($g['type'] === 'team' && in_array($user->id, $g['user_ids'] ?? []))) {
                    return response()->json([
                        'success' => true,
                        'in_queue' => true,
                        'joined_at' => $g['joined_at'] ?? $now,
                        'queue_count' => $this->getQueueCountInternal($groups)
                    ]);
                }
            }

            $userTeam = Team::whereJsonContains('user_ids', $user->id)->first();
            if ($userTeam) {
                $memberIds = array_values($userTeam->user_ids ?? []);
                $memberIds = array_values(array_filter($memberIds, function($id) use ($groups) {
                    foreach ($groups as $g) {
                        if (($g['type'] === 'solo' && $g['user_id'] === $id) ||
                            ($g['type'] === 'team' && in_array($id, $g['user_ids'] ?? []))) {
                            return false;
                        }
                    }
                    return true;
                }));

                if (empty($memberIds)) {
                    return response()->json([
                        'success' => true,
                        'in_queue' => true,
                        'joined_at' => $now,
                        'queue_count' => $this->getQueueCountInternal($groups)
                    ]);
                }

                $groups[] = [
                    'type' => 'team',
                    'team_id' => $userTeam->id,
                    'user_ids' => $memberIds,
                    'joined_at' => $now
                ];
            } else {
                $groups[] = [
                    'type' => 'solo',
                    'user_id' => $user->id,
                    'joined_at' => $now
                ];
            }

            Cache::put($queueKey, $groups, now()->addHours(6));
            $this->processQueueInternal(true);

            return response()->json([
                'success' => true,
                'in_queue' => true,
                'joined_at' => $now,
                'queue_count' => $this->getQueueCountInternal($groups)
            ]);
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            \Log::warning('Matchmaking queue lock timeout on join', ['user_id' => $user->id]);
            return response()->json([
                'success' => true,
                'in_queue' => false,
                'joined_at' => null,
                'queue_count' => $this->getQueueCountInternal(Cache::get($queueKey, []))
            ]);
        } finally {
            optional($lock)->release();
        }
    }


    public function leaveQueue(Request $request)
    {
        $user = Auth::user();
        $queueKey = 'mm:queue_groups';
        $lock = Cache::lock('mm:queue_lock', 5);
        try {
            $lock->block(5);
            $groups = Cache::get($queueKey, []);
            $groups = array_values(array_filter($groups, function($g) use ($user) {
                if ($g['type'] === 'solo') {
                    return $g['user_id'] !== $user->id;
                }
                if ($g['type'] === 'team') {
                    return !in_array($user->id, $g['user_ids'] ?? []);
                }
                return true;
            }));
            Cache::put($queueKey, $groups, now()->addHours(6));

            return response()->json([
                'success' => true,
                'in_queue' => false,
                'queue_count' => $this->getQueueCountInternal($groups)
            ]);
        } finally {
            optional($lock)->release();
        }
    }

  
    public function queueStatus()
    {
        $user = Auth::user();
        $groups = Cache::get('mm:queue_groups', []);
        $inQueue = false;
        $joinedAt = null;
        foreach ($groups as $g) {
            if (($g['type'] === 'solo' && $g['user_id'] === $user->id) ||
                ($g['type'] === 'team' && in_array($user->id, $g['user_ids'] ?? []))) {
                $inQueue = true;
                $joinedAt = $g['joined_at'] ?? null;
                break;
            }
        }
        return response()->json([
            'success' => true,
            'in_queue' => $inQueue,
            'joined_at' => $joinedAt,
            'queue_count' => $this->getQueueCountInternal($groups)
        ]);
    }

    private function getQueueCountInternal(array $groups): array
    {
        $players = 0;
        $teams = 0;
        $solos = 0;
        foreach ($groups as $g) {
            if ($g['type'] === 'team') {
                $teams++;
                $players += count($g['user_ids'] ?? []);
            } elseif ($g['type'] === 'solo') {
                $solos++;
                $players++;
            }
        }
        return [
            'players' => $players,
            'teams' => $teams,
            'solos' => $solos
        ];
    }

    
    private function processQueueInternal(bool $alreadyLocked = false): void
    {
        $queueKey = 'mm:queue_groups';
        $groups = [];
        $lock = null;
        try {
            if (!$alreadyLocked) {
                $lock = Cache::lock('mm:queue_lock', 10);
                $lock->block(3);
            }
            $groups = Cache::get($queueKey, []);
            if (empty($groups)) {
                return;
            }

            $teamGroups = [];
            $soloUsers = [];
            foreach ($groups as $g) {
                if ($g['type'] === 'team') {
                    $teamGroups[] = $g;
                } elseif ($g['type'] === 'solo') {
                    $soloUsers[] = $g['user_id'];
                }
            }

            $popAny = function() use (&$groups) {
                Cache::put('mm:queue_groups', $groups, now()->addHours(6));
            };

            $changed = false;
            $removeUsers = function(array $usedUserIds) use (&$groups) {
                $used = array_flip($usedUserIds);
                $new = [];
                foreach ($groups as $g) {
                    if ($g['type'] === 'solo') {
                        if (!isset($used[$g['user_id']])) {
                            $new[] = $g;
                        }
                    } elseif ($g['type'] === 'team') {
                        $remaining = array_values(array_filter($g['user_ids'] ?? [], function($id) use ($used) { return !isset($used[$id]); }));
                        if (!empty($remaining)) {
                            $g['user_ids'] = $remaining;
                            $new[] = $g;
                        }
                    }
                }
                $groups = $new;
            };

            while (true) {
                $currentCount = $this->getQueueCountInternal($groups);
                if (($currentCount['players'] ?? 0) < 10) {
                    break;
                }

                $teamAUsers = null;
                $teamBUsers = null;

                $fullTeamGroups = array_values(array_filter($groups, function($g) { return $g['type'] === 'team' && count($g['user_ids'] ?? []) === 5; }));
                if (count($fullTeamGroups) >= 2) {
                    $teamAUsers = $fullTeamGroups[0]['user_ids'];
                    $teamBUsers = $fullTeamGroups[1]['user_ids'];
                }

                if (!$teamAUsers) {
                    if (count($fullTeamGroups) >= 1) {
                        $soloPool = [];
                        foreach ($groups as $g) {
                            if ($g['type'] === 'solo') { $soloPool[] = $g['user_id']; }
                        }
                        if (count($soloPool) >= 5) {
                            $teamAUsers = $fullTeamGroups[0]['user_ids'];
                            $teamBUsers = array_slice($soloPool, 0, 5);
                        }
                    }
                }

                if (!$teamAUsers) {
                    $soloPool = [];
                    foreach ($groups as $g) {
                        if ($g['type'] === 'solo') { $soloPool[] = $g['user_id']; }
                    }
                    if (count($soloPool) >= 10) {
                        $teamAUsers = array_slice($soloPool, 0, 5);
                        $teamBUsers = array_slice($soloPool, 5, 5);
                    }
                }

                if ($teamAUsers && $teamBUsers) {
                    if (count($teamAUsers) !== 5 || count($teamBUsers) !== 5) {
                        Log::warning('Skipping match formation due to non-5 team sizes', [
                            'teamA_count' => count($teamAUsers),
                            'teamB_count' => count($teamBUsers)
                        ]);
                        break;
                    }
                    $team1 = Team::create([
                        'name' => null,
                        'is_private' => true,
                        'status' => 'waiting',
                        'region' => 'US',
                        'leader_id' => $teamAUsers[0],
                        'user_ids' => $teamAUsers,
                        'max_players' => 5
                    ]);
                    foreach ($teamAUsers as $uid) {
                        $team1->users()->attach($uid, [ 'joined_at' => now(), 'role' => $uid === $team1->leader_id ? 'leader' : 'member' ]);
                    }
                    $team2 = Team::create([
                        'name' => null,
                        'is_private' => true,
                        'status' => 'waiting',
                        'region' => 'US',
                        'leader_id' => $teamBUsers[0],
                        'user_ids' => $teamBUsers,
                        'max_players' => 5
                    ]);
                    foreach ($teamBUsers as $uid) {
                        $team2->users()->attach($uid, [ 'joined_at' => now(), 'role' => $uid === $team2->leader_id ? 'leader' : 'member' ]);
                    }
                    $challenge = TeamChallengeRequest::createChallenge($team1->id, $team2->id, '[Auto Matchmaking]');
                    $challenge->accept();
                    $challenge->challenger_ready = true;
                    $challenge->challenged_ready = true;
                    $challenge->save();
                    try {
                        $this->startMatch($challenge->fresh(['challengerTeam', 'challengedTeam']));
                    } catch (\Exception $e) {
                        Log::error('Failed to auto start matchmaking challenge', ['error' => $e->getMessage(), 'challenge_id' => $challenge->id]);
                    }
                    $removeUsers(array_merge($teamAUsers, $teamBUsers));
                    $changed = true;
                    continue; 
                }
                break;
            }

            if ($changed) {
                $popAny();
            }
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            \Log::warning('Matchmaking queue lock timeout on process');
        } finally {
            if (!$alreadyLocked) {
                optional($lock)->release();
            }
        }
    }

    
    private function syncQueueOnMemberJoin(\App\Models\Team $team, int $userId): void
    {
        $queueKey = 'mm:queue_groups';
        $lock = Cache::lock('mm:queue_lock', 10);
        try {
            $lock->block(3);
            $groups = Cache::get($queueKey, []);
            $teamQueued = false;
            foreach ($groups as &$g) {
                if (($g['type'] === 'team') && ($g['team_id'] ?? null) === $team->id) {
                    $teamQueued = true;
                    $g['user_ids'] = $g['user_ids'] ?? [];
                    if (!in_array($userId, $g['user_ids']) && count($g['user_ids']) < 5) {
                        $g['user_ids'][] = $userId;
                    }
                }
            }
            unset($g);
            if ($teamQueued) {
                $groups = array_values(array_filter($groups, function($g) use ($userId) {
                    if ($g['type'] === 'solo' && ($g['user_id'] ?? null) === $userId) {
                        return false;
                    }
                    return true;
                }));
                Cache::put($queueKey, $groups, now()->addHours(6));
            }
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
        } finally {
            optional($lock)->release();
        }
    }

   
    private function removeUserFromAnyQueue(int $userId): void
    {
        $queueKey = 'mm:queue_groups';
        $lock = Cache::lock('mm:queue_lock', 10);
        try {
            $lock->block(3);
            $groups = Cache::get($queueKey, []);
            $new = [];
            foreach ($groups as $g) {
                if ($g['type'] === 'solo') {
                    if (($g['user_id'] ?? null) !== $userId) {
                        $new[] = $g;
                    }
                } elseif ($g['type'] === 'team') {
                    $ids = array_values(array_filter($g['user_ids'] ?? [], function($id) use ($userId) { return $id !== $userId; }));
                    $g['user_ids'] = $ids;
                    $new[] = $g;
                }
            }
            Cache::put($queueKey, $new, now()->addHours(6));
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
        } finally {
            optional($lock)->release();
        }
    }

  
    public function checkMatchResults()
    {
        try {
            $activeMatches = \App\Models\GameMatch::where('is_finished', false)
                ->where('is_cancelled', false)
                ->where('api_match_id', '!=', null)
                ->get();

            $matchApiService = app(\App\Services\MatchApiService::class);
            $updatedMatches = [];

            foreach ($activeMatches as $match) {
                $matchInfo = $matchApiService->getMatch($match->api_match_id);
                
                if ($matchInfo && isset($matchInfo['match'])) {
                    $apiMatch = $matchInfo['match'];
                    if ($apiMatch['cancelled'] || $apiMatch['forfeit'] || $apiMatch['end_time']) {
                        $match->is_finished = true;
                        $match->is_cancelled = $apiMatch['cancelled'] || $apiMatch['forfeit'];
                        $match->ended_at = $apiMatch['end_time'] ? \Carbon\Carbon::parse($apiMatch['end_time']) : now();
                        $match->team1_score = json_encode($apiMatch['team1_score'] ?? 0);
                        $match->team2_score = json_encode($apiMatch['team2_score'] ?? 0);
                        
                        if (!$match->is_cancelled && $apiMatch['winner']) {
                            $winnerApiTeamId = $apiMatch['winner'];
                            $winnerTeam = $winnerApiTeamId === $match->api_team1_id ? $match->team1 : $match->team2;
                            $loserTeam = $winnerApiTeamId === $match->api_team1_id ? $match->team2 : $match->team1;
                            
                            if ($winnerTeam && $loserTeam) {
                                $match->winner_team_id = $winnerTeam->id;
                                $winnerTeam->awardWinElo();
                                $loserTeam->deductLossElo();
                                
                                \Log::info('Match completed with winner - ELO updated', [
                                    'match_id' => $match->id,
                                    'winner_team_id' => $winnerTeam->id,
                                    'loser_team_id' => $loserTeam->id,
                                    'final_score' => json_decode($match->team1_score) . '-' . json_decode($match->team2_score)
                                ]);
                            }
                        } else {
                            \Log::info('Match completed without winner - no ELO changes', [
                                'match_id' => $match->id,
                                'cancelled' => $apiMatch['cancelled'] ?? false,
                                'forfeit' => $apiMatch['forfeit'] ?? false,
                                'has_winner' => isset($apiMatch['winner']) && $apiMatch['winner'],
                                'final_score' => json_decode($match->team1_score) . '-' . json_decode($match->team2_score)
                            ]);
                        }
                        
                        $match->save();
                        $updatedMatches[] = $match;
                        $challenge = TeamChallengeRequest::where('match_id', $match->match_id)->first();
                        if ($challenge) {
                            $challenge->markMatchCompleted();
                        }
                    }
                } else {
                    \Log::warning('Match not found in API - marking as finished', [
                        'match_id' => $match->id,
                        'api_match_id' => $match->api_match_id
                    ]);
                    
                    $match->is_finished = true;
                    $match->is_cancelled = true;
                    $match->ended_at = now();
                    $match->save();
                    $updatedMatches[] = $match;
                    $challenge = TeamChallengeRequest::where('match_id', $match->match_id)->first();
                    if ($challenge) {
                        $challenge->markMatchCompleted();
                    }
                }
            }

            return response()->json([
                'success' => true,
                'updated_matches' => count($updatedMatches),
                'matches' => $updatedMatches
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to check match results', [
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to check match results'], 500);
        }
    }

    public function checkConnectionTimeouts()
    {
        try {
            $matchApiService = app(\App\Services\MatchApiService::class);
            $cancelledMatches = [];
            $activeMatches = \App\Models\GameMatch::where('is_finished', false)
                ->where('is_cancelled', false)
                ->where('api_match_id', '!=', null)
                ->where('started_at', '<', now()->subMinutes(4))
                ->whereNull('connection_validated_at')
                ->get();

            foreach ($activeMatches as $match) {
                $team1MemberCount = count($match->team1->user_ids ?? []);
                $team2MemberCount = count($match->team2->user_ids ?? []);
                $expectedPlayerCount = $team1MemberCount + $team2MemberCount;
                $allPlayersConnected = false;
                if ($match->server_ip && $match->server_port) {
                    $allPlayersConnected = $this->serverConnectionService->areAllPlayersConnected(
                        $match->server_ip, 
                        $match->server_port, 
                        $expectedPlayerCount
                    );
                }
                
                if ($allPlayersConnected) {
                    $match->connection_validated_at = now();
                    $match->save();

                    \Log::info('Match connection validated - all players connected', [
                        'match_id' => $match->id,
                        'api_match_id' => $match->api_match_id,
                        'expected_players' => $expectedPlayerCount,
                        'team1_members' => $team1MemberCount,
                        'team2_members' => $team2MemberCount,
                        'server_ip' => $match->server_ip,
                        'server_port' => $match->server_port
                    ]);
                } else {
                    \Log::info('Cancelling match due to connection timeout', [
                        'match_id' => $match->id,
                        'api_match_id' => $match->api_match_id,
                        'started_at' => $match->started_at,
                        'duration_minutes' => $match->started_at->diffInMinutes(now()),
                        'expected_players' => $expectedPlayerCount,
                        'team1_members' => $team1MemberCount,
                        'team2_members' => $team2MemberCount,
                        'server_ip' => $match->server_ip,
                        'server_port' => $match->server_port
                    ]);
                    
                    $cancelResult = $matchApiService->cancelMatch($match->api_match_id);
                    
                    if (!$cancelResult) {
                        \Log::warning('Failed to cancel match via API, but marking as cancelled locally', [
                            'match_id' => $match->id,
                            'api_match_id' => $match->api_match_id
                        ]);
                    }
                    
                    $match->is_finished = true;
                    $match->is_cancelled = true;
                    $match->ended_at = now();
                    $match->save();
                    
                    $challenge = TeamChallengeRequest::where('match_id', $match->match_id)->first();
                    if ($challenge) {
                        $challenge->markMatchCompleted();
                    }
                    
                    $cancelledMatches[] = $match;
                }
            }

            return response()->json([
                'success' => true,
                'cancelled_matches' => count($cancelledMatches),
                'matches' => $cancelledMatches
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to check connection timeouts', [
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to check connection timeouts'], 500);
        }
    }

 
    public function getVetoStatus($challengeId)
    {
        $user = Auth::user();

        $challenge = TeamChallengeRequest::with(['challengerTeam', 'challengedTeam'])->find($challengeId);
        if (!$challenge) {
            return response()->json(['error' => 'Challenge not found'], 404);
        }

        $userTeam = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$userTeam || ($challenge->challenger_team_id !== $userTeam->id && $challenge->challenged_team_id !== $userTeam->id)) {
            return response()->json(['error' => 'Not part of this challenge'], 403);
        }

        $availableMaps = ['de_ancient', 'de_anubis', 'de_dust2', 'de_inferno', 'de_mirage', 'de_nuke', 'de_vertigo'];
        $bannedMaps = \App\Models\MapVeto::where('challenge_id', $challengeId)
            ->orderBy('veto_order')
            ->get();

        $remainingMaps = array_values(array_diff($availableMaps, $bannedMaps->pluck('map_name')->toArray()));
        $vetoCount = $bannedMaps->count();
        $isChallenger = $challenge->challenger_team_id === $userTeam->id;
        $isCurrentTurn = false;
        if ($vetoCount < 6) {
            $isCurrentTurn = ($vetoCount % 2 === 0 && $isChallenger) || ($vetoCount % 2 === 1 && !$isChallenger);
        }
        $turnCacheKey = "veto_turn_start_{$challengeId}_{$vetoCount}";
        if (!Cache::has($turnCacheKey)) {
            Cache::put($turnCacheKey, now(), now()->addMinutes(3));
        }
        $turnStartedAt = Cache::get($turnCacheKey);
        $vetoStartCacheKey = "veto_overall_start_{$challengeId}";
        if (!Cache::has($vetoStartCacheKey)) {
            Cache::put($vetoStartCacheKey, now(), now()->addMinutes(15));
        }
        $vetoOverallStart = Cache::get($vetoStartCacheKey);
        if ($vetoOverallStart && now()->diffInMinutes($vetoOverallStart) >= 10) {
            $challenge->update(['status' => 'cancelled']);
            \App\Models\MapVeto::where('challenge_id', $challengeId)->delete();
            Cache::forget($turnCacheKey);
            Cache::forget($vetoStartCacheKey);

            return response()->json([
                'error' => 'Veto timed out - challenge cancelled',
                'veto_cancelled' => true,
            ], 408);
        }

        return response()->json([
            'success' => true,
            'available_maps' => $availableMaps,
            'banned_maps' => $bannedMaps,
            'remaining_maps' => $remainingMaps,
            'is_current_turn' => $isCurrentTurn,
            'veto_complete' => count($remainingMaps) === 1,
            'final_map' => count($remainingMaps) === 1 ? $remainingMaps[0] : null,
            'turn_started_at' => $turnStartedAt,
        ]);
    }

   
    public function banMap(Request $request)
    {
        $user = Auth::user();
        $challengeId = $request->input('challenge_id');
        $mapName = $request->input('map_name');

        $challenge = TeamChallengeRequest::with(['challengerTeam', 'challengedTeam'])->find($challengeId);
        if (!$challenge) {
            return response()->json(['error' => 'Challenge not found'], 404);
        }

        $userTeam = Team::whereJsonContains('user_ids', $user->id)->first();
        if (!$userTeam) {
            return response()->json(['error' => 'You are not in a team'], 404);
        }

        if (!$userTeam->isLeader($user)) {
            return response()->json(['error' => 'Only team leaders can ban maps'], 403);
        }

        if ($challenge->challenger_team_id !== $userTeam->id && $challenge->challenged_team_id !== $userTeam->id) {
            return response()->json(['error' => 'Not part of this challenge'], 403);
        }

        $availableMaps = ['de_ancient', 'de_anubis', 'de_dust2', 'de_inferno', 'de_mirage', 'de_nuke', 'de_vertigo'];
        if (!in_array($mapName, $availableMaps)) {
            return response()->json(['error' => 'Invalid map name'], 400);
        }
        $existingBan = \App\Models\MapVeto::where('challenge_id', $challengeId)
            ->where('map_name', $mapName)
            ->exists();
        if ($existingBan) {
            return response()->json(['error' => 'Map already banned'], 400);
        }
        $vetoCount = \App\Models\MapVeto::where('challenge_id', $challengeId)->count();
        $isChallenger = $challenge->challenger_team_id === $userTeam->id;
        $isCurrentTurn = ($vetoCount % 2 === 0 && $isChallenger) || ($vetoCount % 2 === 1 && !$isChallenger);
        $turnCacheKey = "veto_turn_start_{$challengeId}_{$vetoCount}";
        $turnStartedAt = Cache::get($turnCacheKey);
        $timeoutPassed = false;

        if ($turnStartedAt) {
            $secondsElapsed = now()->diffInSeconds($turnStartedAt);
            $timeoutPassed = $secondsElapsed >= 120; 
        }

        if (!$isCurrentTurn && !$timeoutPassed) {
            return response()->json(['error' => 'Not your turn to ban'], 403);
        }
        \App\Models\MapVeto::create([
            'challenge_id' => $challengeId,
            'map_name' => $mapName,
            'banned_by_team_id' => $userTeam->id,
            'veto_order' => $vetoCount,
        ]);
        $newVetoCount = $vetoCount + 1;
        if ($newVetoCount === 6) {
            $bannedMapNames = \App\Models\MapVeto::where('challenge_id', $challengeId)
                ->pluck('map_name')
                ->toArray();
            $finalMap = array_values(array_diff($availableMaps, $bannedMapNames))[0];
            return $this->startMatchWithMap($challenge, $finalMap);
        }

        return response()->json([
            'success' => true,
            'message' => 'Map banned successfully',
            'veto_complete' => false,
        ]);
    }

    private function startMatchWithMap(TeamChallengeRequest $challenge, string $mapName)
    {
        try {
            $matchApiService = app(\App\Services\MatchApiService::class);
            $servers = $matchApiService->getAvailableServers();
            if (!$servers || empty($servers)) {
                return response()->json(['error' => 'No servers available'], 500);
            }
            $server = $servers[0];

            if (!isset($server['id']) || !isset($server['ip_string']) || !isset($server['port'])) {
                \Log::error('Invalid server data', ['server' => $server]);
                return response()->json(['error' => 'Invalid server data'], 500);
            }

            $teamsData = $this->teamApiService->createMatchTeams($challenge->challengerTeam, $challenge->challengedTeam);

            if (!$teamsData || !isset($teamsData['challenger_team']) || !isset($teamsData['challenged_team'])) {
                \Log::error('Failed to create teams via API', ['challenge_id' => $challenge->id]);
                return response()->json(['error' => 'Failed to create teams via API'], 500);
            }

            $matchData = $matchApiService->createMatch(
                $server['id'],
                $teamsData['challenger_team']['id'],
                $teamsData['challenged_team']['id'],
                'Team Match: ' . ($challenge->challengerTeam->name ?? 'Team 1') . ' vs ' . ($challenge->challengedTeam->name ?? 'Team 2'),
                $mapName
            );

            if (!$matchData || !isset($matchData['id'])) {
                return response()->json(['error' => 'Failed to create match via API'], 500);
            }

            $apiMatchId = $matchData['id'];
            $challengerTeamId = $teamsData['challenger_team']['id'];
            $challengedTeamId = $teamsData['challenged_team']['id'];
            $serverPassword = bin2hex(random_bytes(8)); 

            $gameMatch = \App\Models\GameMatch::create([
                'match_id' => 'match_' . time() . '_' . $challenge->id,
                'api_match_id' => $apiMatchId,
                'server_id' => $server['id'],
                'server_ip' => $server['ip_string'],
                'server_port' => $server['port'],
                'server_display_name' => $server['display_name'],
                'server_password' => $serverPassword,
                'team1_id' => $challenge->challenger_team_id,
                'team2_id' => $challenge->challenged_team_id,
                'api_team1_id' => $challengerTeamId,
                'api_team2_id' => $challengedTeamId,
                'title' => 'Team Match: ' . ($challenge->challengerTeam->name ?? 'Team 1') . ' vs ' . ($challenge->challengedTeam->name ?? 'Team 2'),
                'started_at' => now(),
                'status' => 'active',
                'match_data' => $matchData
            ]);

            $challenge->startMatch($gameMatch->match_id);
            $passwordResult = $matchApiService->sendRconCommand($apiMatchId, "sv_password {$serverPassword}");
            if (!$passwordResult) {
                \Log::warning('Failed to send RCON sv_password command', [
                    'match_id' => $apiMatchId,
                    'password' => $serverPassword
                ]);
            }
            $rconResult = $matchApiService->sendRconCommand($apiMatchId, "changelevel {$mapName}");
            if (!$rconResult) {
                \Log::warning('Failed to send RCON changelevel command', [
                    'match_id' => $apiMatchId,
                    'map_name' => $mapName
                ]);
            }

            return response()->json([
                'success' => true,
                'veto_complete' => true,
                'final_map' => $mapName,
                'match_id' => $gameMatch->match_id,
                'server_ip' => $server['ip_string'],
                'server_port' => $server['port'],
                'server_display_name' => $server['display_name'],
                'server_password' => $serverPassword,
                'message' => 'Veto complete! Match starting with ' . $mapName
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to start match after veto', [
                'challenge_id' => $challenge->id,
                'map_name' => $mapName,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to start match: ' . $e->getMessage()], 500);
        }
    }


}