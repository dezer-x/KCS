<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $userCountry = $user?->country;
        $activeTab = $request->get('tab', 'global');
        $page = $request->get('page', 1);
        $perPage = 30;
        $search = $request->get('search', '');
        $globalQuery = User::whereNotNull('elo');
        if ($search) {
            $globalQuery->where(function($query) use ($search) {
                $query->where('steam_username', 'like', "%{$search}%")
                      ->orWhere('steam_real_name', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%")
                      ->orWhere('country', 'like', "%{$search}%");
            });
        }
        $globalLeaderboard = $globalQuery->orderBy('elo', 'desc')
            ->paginate($perPage, ['*'], 'global_page', $page)
            ->through(function ($user, $index) use ($page, $perPage) {
                return [
                    'rank' => (($page - 1) * $perPage) + $index + 1,
                    'id' => $user->id,
                    'name' => $user->steam_real_name ?? $user->steam_username ?? $user->name,
                    'steam_username' => $user->steam_username,
                    'steam_avatar_medium' => $user->steam_avatar_medium,
                    'country' => $user->country,
                    'elo' => $user->elo ?? 0,
                ];
            });
        $localLeaderboard = collect();
        if ($userCountry) {
            $localQuery = User::where('country', $userCountry)->whereNotNull('elo');
            
            if ($search) {
                $localQuery->where(function($query) use ($search) {
                    $query->where('steam_username', 'like', "%{$search}%")
                          ->orWhere('steam_real_name', 'like', "%{$search}%")
                          ->orWhere('name', 'like', "%{$search}%");
                });
            }
            $localLeaderboard = $localQuery->orderBy('elo', 'desc')
                ->paginate($perPage, ['*'], 'local_page', $page)
                ->through(function ($user, $index) use ($page, $perPage) {
                    return [
                        'rank' => (($page - 1) * $perPage) + $index + 1,
                        'id' => $user->id,
                        'name' => $user->steam_real_name ?? $user->steam_username ?? $user->name,
                        'steam_username' => $user->steam_username,
                        'steam_avatar_medium' => $user->steam_avatar_medium,
                        'country' => $user->country,
                        'elo' => $user->elo ?? 0,
                    ];
                });
        }
        $userGlobalRank = null;
        $userLocalRank = null;
        if ($user && $user->elo !== null) {
            $globalRank = User::whereNotNull('elo')
                ->where('elo', '>', $user->elo)
                ->count() + 1;
            $userGlobalRank = $globalRank;
            if ($userCountry) {
                $localRank = User::where('country', $userCountry)
                    ->whereNotNull('elo')
                    ->where('elo', '>', $user->elo)
                    ->count() + 1;
                $userLocalRank = $localRank;
            }
        }

        return Inertia::render('leaderboard', [
            'globalLeaderboard' => $globalLeaderboard,
            'localLeaderboard' => $localLeaderboard,
            'userCountry' => $userCountry,
            'userGlobalRank' => $userGlobalRank,
            'userLocalRank' => $userLocalRank,
            'userElo' => $user?->elo ?? 0,
            'activeTab' => $activeTab,
            'search' => $search,
        ]);
    }
}
