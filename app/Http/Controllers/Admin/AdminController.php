<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Http\Controllers\Controller;

class AdminController extends Controller
{
    public function dashboard(Request $request)
    {
        $totalUsers = User::count();
        $usersLast24Hours = User::where('created_at', '>=', Carbon::now()->subDay())->count();
        $totalElo = User::sum('elo');
        $usersByRole = User::selectRaw('role, COUNT(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role')
            ->toArray();
        $usersLast7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $count = User::whereDate('created_at', $date)->count();
            $usersLast7Days[] = [
                'date' => $date->format('M d'),
                'count' => $count
            ];
        }
        $eloDistribution = [
            '0-200' => User::whereBetween('elo', [0, 200])->count(),
            '201-400' => User::whereBetween('elo', [201, 400])->count(),
            '401-600' => User::whereBetween('elo', [401, 600])->count(),
            '601-800' => User::whereBetween('elo', [601, 800])->count(),
            '801-1000' => User::whereBetween('elo', [801, 1000])->count(),
            '1001-1200' => User::whereBetween('elo', [1001, 1200])->count(),
            '1201-1400' => User::whereBetween('elo', [1201, 1400])->count(),
            '1401-1600' => User::whereBetween('elo', [1401, 1600])->count(),
            '1601-1800' => User::whereBetween('elo', [1601, 1800])->count(),
            '1801-2000' => User::whereBetween('elo', [1801, 2000])->count(),
            '2001-2200' => User::whereBetween('elo', [2001, 2200])->count(),
            '2201-2400' => User::whereBetween('elo', [2201, 2400])->count(),
            '2401-2600' => User::whereBetween('elo', [2401, 2600])->count(),
            '2601-2800' => User::whereBetween('elo', [2601, 2800])->count(),
            '2801-3000' => User::whereBetween('elo', [2801, 3000])->count(),
            '3000+' => User::where('elo', '>', 3000)->count(),
        ];
        $usersQuery = User::with(['friends', 'bannedBy'])
            ->where('role', '!=', 'admin') 
            ->orderBy('created_at', 'desc');
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $usersQuery->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('steam_username', 'like', "%{$search}%")
                  ->orWhere('steam_real_name', 'like', "%{$search}%")
                  ->orWhere('steam_id', 'like', "%{$search}%");
            });
        }
        $recentUsers = $usersQuery->paginate(6)->through(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->steam_real_name ?? $user->steam_username ?? $user->name,
                'steam_id' => $user->steam_id,
                'elo' => $user->elo,
                'role' => $user->role,
                'created_at' => $user->created_at->format('M d, Y'),
                'steam_avatar_medium' => $user->steam_avatar_medium,
                'is_banned' => $user->isBanned(),
                'banned_at' => $user->banned_at ? $user->banned_at->format('M d, Y') : null,
                'ban_reason' => $user->ban_reason,
                'ban_duration' => $user->ban_duration,
                'banned_until' => $user->banned_until ? $user->banned_until->format('M d, Y') : null,
                'banned_by' => $user->bannedBy ? $user->bannedBy->name : null,
            ];
        });
        $bannedUsersCount = User::whereNotNull('banned_at')->count();
        $bannedUsersQuery = User::whereNotNull('banned_at')
            ->with('bannedBy')
            ->orderBy('banned_at', 'desc');
        if ($request->has('banned_search') && $request->banned_search) {
            $search = $request->banned_search;
            $bannedUsersQuery->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('steam_username', 'like', "%{$search}%")
                  ->orWhere('steam_real_name', 'like', "%{$search}%")
                  ->orWhere('steam_id', 'like', "%{$search}%");
            });
        }
        $bannedUsers = $bannedUsersQuery->paginate(6)->through(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->steam_real_name ?? $user->steam_username ?? $user->name,
                'steam_id' => $user->steam_id,
                'elo' => $user->elo,
                'role' => $user->role,
                'created_at' => $user->created_at->format('M d, Y'),
                'steam_avatar_medium' => $user->steam_avatar_medium,
                'is_banned' => true,
                'banned_at' => $user->banned_at ? $user->banned_at->format('M d, Y') : null,
                'ban_reason' => $user->ban_reason,
                'ban_duration' => $user->ban_duration,
                'banned_until' => $user->banned_until ? $user->banned_until->format('M d, Y') : null,
                'banned_by' => $user->bannedBy ? $user->bannedBy->name : null,
            ];
        });

        return Inertia::render('Admin/Dashboard', [
            'metrics' => [
                'totalUsers' => $totalUsers,
                'usersLast24Hours' => $usersLast24Hours,
                'totalElo' => $totalElo,
                'usersByRole' => $usersByRole,
                'bannedUsers' => $bannedUsersCount,
            ],
            'charts' => [
                'usersLast7Days' => $usersLast7Days,
                'eloDistribution' => $eloDistribution,
            ],
            'recentUsers' => $recentUsers,
            'bannedUsers' => $bannedUsers,
        ]);
    }
}
