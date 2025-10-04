<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserBanController extends Controller
{
    /**
     * Show the ban user form
     */
    public function showBanForm(User $user)
    {
        // Prevent banning admins
        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard', ['tab' => 'users'])->with('error', 'Cannot ban admin users');
        }

        // Prevent self-banning
        if ($user->id === Auth::id()) {
            return redirect()->route('admin.dashboard', ['tab' => 'users'])->with('error', 'Cannot ban yourself');
        }

        // Check if user is already banned
        if ($user->isBanned()) {
            return redirect()->route('admin.dashboard', ['tab' => 'users'])->with('error', 'This user is already banned');
        }

        return Inertia::render('Admin/BanUser', [
            'user' => $user
        ]);
    }

    /**
     * Ban a user by Steam ID
     */
    public function banUser(Request $request)
    {
        $request->validate([
            'steam_id' => 'required|string',
            'reason' => 'required|string|max:1000',
            'duration' => 'required|in:permanent,1_day,1_week,1_month,3_months,6_months,1_year',
        ]);

        $user = User::where('steam_id', $request->steam_id)->first();
        
        if (!$user) {
            return redirect()->back()->with('error', 'User not found');
        }

        $admin = Auth::user();

        // Prevent banning admins
        if ($user->isAdmin()) {
            return redirect()->back()->with('error', 'Cannot ban admin users');
        }

        // Prevent self-banning
        if ($user->id === $admin->id) {
            return redirect()->back()->with('error', 'Cannot ban yourself');
        }

        // Check if user is already banned
        if ($user->isBanned()) {
            return redirect()->back()->with('error', 'This user is already banned');
        }

        $admin->banUser($user, $request->reason, $request->duration, $admin->id);

        return redirect()->route('admin.dashboard', ['tab' => 'users'])->with('success', 'User has been banned successfully');
    }

    /**
     * Unban a user by Steam ID
     */
    public function unbanUser(Request $request)
    {
        $request->validate([
            'steam_id' => 'required|string',
        ]);

        $user = User::where('steam_id', $request->steam_id)->first();
        
        if (!$user) {
            return redirect()->back()->with('error', 'User not found');
        }

        $admin = Auth::user();

        if (!$user->isBanned()) {
            return redirect()->back()->with('error', 'User is not banned');
        }

        $admin->unbanUser($user);

        return redirect()->back()->with('success', 'User has been unbanned successfully');
    }

    /**
     * Get banned users for admin dashboard
     */
    public function getBannedUsers(Request $request)
    {
        $query = User::whereNotNull('banned_at')
            ->with('bannedBy')
            ->orderBy('banned_at', 'desc');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('steam_username', 'like', "%{$search}%")
                  ->orWhere('steam_real_name', 'like', "%{$search}%")
                  ->orWhere('steam_id', 'like', "%{$search}%");
            });
        }

        $bannedUsers = $query->paginate(6);

        return response()->json($bannedUsers);
    }

    /**
     * Get ban duration options
     */
    public function getBanDurations()
    {
        return response()->json([
            'permanent' => 'Permanent',
            '1_day' => '1 Day',
            '1_week' => '1 Week',
            '1_month' => '1 Month',
            '3_months' => '3 Months',
            '6_months' => '6 Months',
            '1_year' => '1 Year',
        ]);
    }
}