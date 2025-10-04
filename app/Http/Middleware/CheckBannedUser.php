<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;

class CheckBannedUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip banned check for the banned page itself to prevent infinite redirects
        if ($request->routeIs('banned')) {
            return $next($request);
        }

        $user = auth()->user();
        
        // Check if user is banned by Steam ID
        if ($user->isBanned()) {
            // Redirect to banned page with ban details
            return redirect()->route('banned')->with('banDetails', [
                'reason' => $user->ban_reason,
                'duration' => $user->ban_duration,
                'banned_at' => $user->banned_at,
                'banned_until' => $user->banned_until,
                'is_permanent' => $user->isPermanentlyBanned(),
                'banned_by' => $user->bannedBy ? $user->bannedBy->name : 'System',
            ]);
        }

        return $next($request);
    }
}