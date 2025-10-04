<?php

use App\Http\Controllers\Auth\SteamController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\FriendsController;
use App\Http\Controllers\CountrySelectionController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\PracticeController;
use App\Http\Controllers\MatchmakingController;
use App\Models\Team;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


     Route::get('/country-selection', [CountrySelectionController::class, 'show'])->name('country.selection');
     Route::post('/country-selection', [CountrySelectionController::class, 'store'])->name('country.selection.store');
     Route::get('/', [WelcomeController::class, 'index'])->name('home');
     Route::get('/banned', fn() => (!auth()->user() || !auth()->user()->isBanned()) ? redirect()->route('home') : Inertia::render('BannedError'))->name('banned');
     Route::get('/login', fn() => redirect()->route('steam.login'))->name('login');
     Route::get('/dashboard', fn() => redirect()->route('steam.login'))->name('dashboard');

     // Auth routes
     Route::group(['prefix' => 'auth'], function () {
     Route::get('/steam', [SteamController::class, 'redirectToSteam'])->name('steam.login');
     Route::get('/steam/callback', [SteamController::class, 'handleSteamCallback'])->name('steam.callback');
     });


    Route::middleware(['auth', 'verified', 'banned'])->group(function () {

    // Get Routes
     Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard');
     Route::get('/practice', [PracticeController::class, 'index'])->name('practice');
     Route::get('/matchmaking', [MatchmakingController::class, 'index'])->name('matchmaking');
     Route::get('/profile', [ProfileController::class, 'index'])->name('profile');

     // Friends Routes
     Route::get('friends', [FriendsController::class, 'index'])->name('friends');
     Route::get('friends/matchmaking', [FriendsController::class, 'getFriendsForMatchmaking'])->name('friends.matchmaking');
     Route::post('friends/search', [FriendsController::class, 'search'])->name('friends.search');
     Route::post('friends/add', [FriendsController::class, 'addFriend'])->name('friends.add');
     Route::post('friends/accept', [FriendsController::class, 'acceptFriend'])->name('friends.accept');
     Route::post('friends/reject', [FriendsController::class, 'rejectFriend'])->name('friends.reject');
     Route::post('friends/cancel', [FriendsController::class, 'cancelPendingRequest'])->name('friends.cancel');
     Route::post('friends/remove', [FriendsController::class, 'removeFriend'])->name('friends.remove');
     Route::post('friends/block', [FriendsController::class, 'blockFriend'])->name('friends.block');
     Route::post('friends/unblock', [FriendsController::class, 'unblockFriend'])->name('friends.unblock');

     // Matchmaking Routes
     Route::post('matchmaking/teams/create', [MatchmakingController::class, 'createTeam'])->name('matchmaking.teams.create');
     Route::post('matchmaking/teams/invite', [MatchmakingController::class, 'inviteFriends'])->name('matchmaking.teams.invite');
     Route::post('matchmaking/invitations/accept', [MatchmakingController::class, 'acceptInvitation'])->name('matchmaking.invitations.accept');
     Route::post('matchmaking/invitations/decline', [MatchmakingController::class, 'declineInvitation'])->name('matchmaking.invitations.decline');
     Route::post('matchmaking/join-random', [MatchmakingController::class, 'joinRandomTeam'])->name('matchmaking.join-random');
     Route::post('matchmaking/leave-team', [MatchmakingController::class, 'leaveTeam'])->name('matchmaking.leave-team');
     Route::post('matchmaking/kick-member', [MatchmakingController::class, 'kickMember'])->name('matchmaking.kick-member');
     Route::post('matchmaking/block-kick-member', [MatchmakingController::class, 'blockAndKickMember'])->name('matchmaking.block-kick-member');
     Route::post('matchmaking/make-leader', [MatchmakingController::class, 'makeTeamLeader'])->name('matchmaking.make-leader');
     Route::get('matchmaking/teams', [MatchmakingController::class, 'getTeams'])->name('matchmaking.teams');
     Route::get('matchmaking/user-team', [MatchmakingController::class, 'getUserTeam'])->name('matchmaking.user-team');
     Route::get('matchmaking/invitations', [MatchmakingController::class, 'getPendingInvitations'])->name('matchmaking.invitations');
    // Queue Routes
    Route::post('matchmaking/queue/join', [MatchmakingController::class, 'joinQueue'])->name('matchmaking.queue.join');
    Route::post('matchmaking/queue/leave', [MatchmakingController::class, 'leaveQueue'])->name('matchmaking.queue.leave');
    Route::get('matchmaking/queue/status', [MatchmakingController::class, 'queueStatus'])->name('matchmaking.queue.status');
     
     // Challenge Routes
     Route::post('matchmaking/challenge', [MatchmakingController::class, 'challengeTeam'])->name('matchmaking.challenge');
     Route::post('matchmaking/challenge/accept', [MatchmakingController::class, 'acceptChallenge'])->name('matchmaking.challenge.accept');
     Route::post('matchmaking/challenge/decline', [MatchmakingController::class, 'declineChallenge'])->name('matchmaking.challenge.decline');
     Route::get('matchmaking/challenges', [MatchmakingController::class, 'getChallenges'])->name('matchmaking.challenges');
     Route::post('matchmaking/team/update-name', [MatchmakingController::class, 'updateTeamName'])->name('matchmaking.team.update-name');
     Route::post('matchmaking/challenge/ready', [MatchmakingController::class, 'markTeamReady'])->name('matchmaking.challenge.ready');
     Route::post('matchmaking/challenge/leave', [MatchmakingController::class, 'leaveChallenge'])->name('matchmaking.challenge.leave');
    Route::get('matchmaking/check-results', [MatchmakingController::class, 'checkMatchResults'])->name('matchmaking.check-results');
    Route::post('matchmaking/check-connection-timeouts', [MatchmakingController::class, 'checkConnectionTimeouts'])->name('matchmaking.check-connection-timeouts');

    // Map Veto Routes
    Route::get('matchmaking/veto/status/{challengeId}', [MatchmakingController::class, 'getVetoStatus'])->name('matchmaking.veto.status');
    Route::post('matchmaking/veto/ban', [MatchmakingController::class, 'banMap'])->name('matchmaking.veto.ban');
    });


require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
