<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    
    public function index(Request $request): Response
    {
        $user = $request->user();
        $leetifyData = null;
        $recentMatches = null;
        $steamFriends = null;

        file_put_contents(storage_path('logs/debug.log'), "Profile page accessed at " . now() . "\n", FILE_APPEND);
        if (!$user || !$user->steam_id) {
            Log::warning('User has no Steam ID', [
                'user_id' => $user->id ?? 'no_user',
                'steam_id' => $user->steam_id ?? 'no_steam_id',
                'steam_username' => $user->steam_username ?? 'no_username'
            ]);
        }

        if ($user && $user->steam_id) {
            try {
                $profileResponse = Http::timeout(10)->get('https://api-public.cs-prod.leetify.com/v3/profile', [
                    'steam64_id' => $user->steam_id
                ]);
                if ($profileResponse->successful()) {
                    $leetifyData = $profileResponse->json();
                } else {
                    Log::warning('Leetify profile API request failed', [
                        'status' => $profileResponse->status(),
                        'steam_id' => $user->steam_id
                    ]);
                }

                $matchesResponse = Http::timeout(10)->get('https://api-public.cs-prod.leetify.com/v3/profile/matches', [
                    'steam64_id' => $user->steam_id
                ]);

                if ($matchesResponse->successful()) {
                    $recentMatches = $matchesResponse->json();
                } else {
                    Log::warning('Leetify matches API request failed', [
                        'status' => $matchesResponse->status(),
                        'steam_id' => $user->steam_id
                    ]);
                }

                $apiKey = config('services.steam.api_key');
                if (empty($apiKey)) {
                    Log::error('Steam API key not configured');
                    $steamFriends = [];
                } else {
                    $steamFriends = $this->getSteamFriendsWithUsernames($user->steam_id);
                    if (empty($steamFriends) && $user->steam_friends) {
                        $steamFriends = $this->formatExistingSteamFriends($user->steam_friends);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Leetify API error', [
                    'message' => $e->getMessage(),
                    'steam_id' => $user->steam_id
                ]);
            }
        }

        return Inertia::render('profile', [
            'leetifyData' => $leetifyData,
            'recentMatches' => $recentMatches,
            'steamFriends' => $steamFriends,
            'userElo' => $user ? $user->elo : 1000
        ]);
    }

   
    private function getSteamFriendsWithUsernames($steamId)
    {
        try {
            $friendsList = $this->getSteamFriendsList($steamId);
            if (empty($friendsList)) {
                Log::warning('No friends found in friends list', ['steam_id' => $steamId]);
                return [];
            }
            $steamIds = array_column($friendsList, 'steamid');
            $friendsData = $this->getSteamUserSummaries($steamIds);
            $enrichedFriends = [];
            foreach ($friendsList as $friend) {
                $friendSteamId = $friend['steamid'];
                $userData = $friendsData[$friendSteamId] ?? null;
                $enrichedFriends[] = [
                    'steamid' => $friendSteamId,
                    'personaname' => $userData['personaname'] ?? 'Unknown',
                    'realname' => $userData['realname'] ?? null,
                    'avatar' => $userData['avatar'] ?? null,
                    'avatarfull' => $userData['avatarfull'] ?? null,
                    'personastate' => $userData['personastate'] ?? '0',
                    'profileurl' => $userData['profileurl'] ?? "https://steamcommunity.com/profiles/{$friendSteamId}",
                    'friend_since' => $friend['friend_since'] ?? null,
                ];
            }
            return $enrichedFriends;
        } catch (\Exception $e) {
            Log::error('Steam friends API error', [
                'message' => $e->getMessage(),
                'steam_id' => $steamId,
                'trace' => $e->getTraceAsString()
            ]);
            return [];
        }
    }

    private function getSteamFriendsList($steamId)
    {
        $apiKey = config('services.steam.api_key');
        $url = "https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key={$apiKey}&steamid={$steamId}&relationship=friend";
        try {
            $response = Http::timeout(10)->get($url);
            $data = $response->json();
            return $data['friendslist']['friends'] ?? [];
        } catch (\Exception $e) {
            Log::error('Steam friends list API error', [
                'message' => $e->getMessage(),
                'steam_id' => $steamId,
                'url' => $url
            ]);
            return [];
        }
    }

    private function getSteamUserSummaries($steamIds)
    {
        if (empty($steamIds)) {
            return [];
        }

        $apiKey = config('services.steam.api_key');
        $steamIdsString = implode(',', $steamIds);
        $url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={$apiKey}&steamids={$steamIdsString}";
        
        try {
            $response = Http::timeout(10)->get($url);
            $data = $response->json();
            
            $users = [];
            if (isset($data['response']['players'])) {
                foreach ($data['response']['players'] as $player) {
                    $users[$player['steamid']] = $player;
                }
            }
            
            return $users;
        } catch (\Exception $e) {
            Log::error('Steam user summaries API error', [
                'message' => $e->getMessage(),
                'steam_ids' => $steamIdsString
            ]);
            return [];
        }
    }

   
    private function formatExistingSteamFriends($steamFriends)
    {
        if (empty($steamFriends)) {
            return [];
        }

        $friends = is_string($steamFriends) ? json_decode($steamFriends, true) : $steamFriends;
        
        if (!is_array($friends)) {
            return [];
        }

        $formattedFriends = [];
        foreach ($friends as $friend) {
            $formattedFriends[] = [
                'steamid' => $friend['steamid'] ?? $friend['steam_id'] ?? 'Unknown',
                'personaname' => 'Unknown', 
                'realname' => null,
                'avatar' => null,
                'avatarfull' => null,
                'personastate' => '0',
                'profileurl' => "https://steamcommunity.com/profiles/" . ($friend['steamid'] ?? $friend['steam_id'] ?? 'Unknown'),
                'friend_since' => $friend['friend_since'] ?? null,
            ];
        }

        return $formattedFriends;
    }
}