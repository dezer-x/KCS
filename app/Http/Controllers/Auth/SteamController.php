<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CountryDetectionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SteamController extends Controller
{
    public function redirectToSteam()
    {
        $params = [
            'openid.ns' => 'http://specs.openid.net/auth/2.0',
            'openid.mode' => 'checkid_setup',
            'openid.return_to' => route('steam.callback'),
            'openid.realm' => config('app.url'),
            'openid.identity' => 'http://specs.openid.net/auth/2.0/identifier_select',
            'openid.claimed_id' => 'http://specs.openid.net/auth/2.0/identifier_select',
        ];

        $steamUrl = 'https://steamcommunity.com/openid/login?' . http_build_query($params);
        return redirect($steamUrl);
    }

    public function handleSteamCallback(Request $request)
    {
        $claimedId = $request->get('openid_claimed_id');
        if (!$claimedId) {
            return redirect()->route('welcome')->with('error', 'Steam authentication failed.');
        }
        $steamId = $this->extractSteamId($claimedId);
        if (!$steamId) {
            return redirect()->route('welcome')->with('error', 'Invalid Steam ID.');
        }
        $steamUser = $this->getSteamUserData($steamId);
        
        if (!$steamUser) {
            return redirect()->route('welcome')->with('error', 'Could not retrieve Steam user data.');
        }
        $user = $this->findOrCreateUser($steamUser);
        if (is_null($user->country)) {
            $countryDetectionService = new CountryDetectionService();
            $detectedCountry = $countryDetectionService->getCountryForCurrentRequest();
            session(['pending_country_selection' => $user->id]);
            return redirect()->route('country.selection', [
                'default_country' => $detectedCountry
            ]);
        }
        Auth::login($user, true);
        return redirect()->intended(route('home'));
    }

    private function extractSteamId($claimedId)
    {
        if (preg_match('/\/openid\/id\/(\d+)$/', $claimedId, $matches)) {
            return $matches[1];
        }
        return null;
    }

    private function getSteamUserData($steamId)
    {
        $apiKey = config('services.steam.api_key');
        $url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={$apiKey}&steamids={$steamId}";
        try {
            $response = Http::get($url);
            $data = $response->json();
            
            if (isset($data['response']['players'][0])) {
                return $data['response']['players'][0];
            }
        } catch (\Exception $e) {
            \Log::error('Steam API Error: ' . $e->getMessage());
        }
        
        return null;
    }

    private function getSteamUserGames($steamId)
    {
        $apiKey = config('services.steam.api_key');
        $url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={$apiKey}&steamid={$steamId}&format=json&include_appinfo=true";
        
        try {
            $response = Http::get($url);
            $data = $response->json();
            
            return $data['response']['games'] ?? [];
        } catch (\Exception $e) {
            \Log::error('Steam Games API Error: ' . $e->getMessage());
            return [];
        }
    }

    private function getSteamUserFriends($steamId)
    {
        $apiKey = config('services.steam.api_key');
        $url = "https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key={$apiKey}&steamid={$steamId}&relationship=friend";
        
        try {
            $response = Http::get($url);
            $data = $response->json();
            
            return $data['friendslist']['friends'] ?? [];
        } catch (\Exception $e) {
            \Log::error('Steam Friends API Error: ' . $e->getMessage());
            return [];
        }
    }

    private function findOrCreateUser($steamUser)
    {
        $user = User::where('steam_id', $steamUser['steamid'])->first();
        
        if ($user) {
            $this->updateUserSteamData($user, $steamUser);
            $this->updateUserAdditionalData($user, $steamUser['steamid']);
            return $user;
        }
        $user = User::where('steam_username', $steamUser['personaname'])->first();
        if ($user) {
            $this->updateUserSteamData($user, $steamUser);
            $this->updateUserAdditionalData($user, $steamUser['steamid']);
            return $user;
        }

        $isFirstUser = User::count() === 0;

        $user = User::create([
            'name' => $steamUser['realname'] ?? $steamUser['personaname'],
            'email' => $steamUser['steamid'] . '@steam.local',
            'password' => bcrypt(Str::random(32)),
            'steam_id' => $steamUser['steamid'],
            'steam_username' => $steamUser['personaname'],
            'steam_avatar' => $steamUser['avatar'] ?? null,
            'steam_avatar_medium' => $steamUser['avatarmedium'] ?? null,
            'steam_avatar_full' => $steamUser['avatarfull'] ?? null,
            'steam_profile_background' => $this->getSteamProfileBackground($steamUser['steamid']),
            'steam_profile_url' => $steamUser['profileurl'] ?? null,
            'steam_real_name' => $steamUser['realname'] ?? null,
            'steam_persona_state' => $steamUser['personastate'] ?? null,
            'steam_community_visibility_state' => $steamUser['communityvisibilitystate'] ?? null,
            'steam_profile_state' => $steamUser['profilestate'] ?? null,
            'steam_last_logoff' => isset($steamUser['lastlogoff']) ? now()->createFromTimestamp($steamUser['lastlogoff']) : null,
            'steam_comment_permission' => $steamUser['commentpermission'] ?? null,
            'steam_country_code' => $steamUser['loccountrycode'] ?? null,
            'steam_state_code' => $steamUser['locstatecode'] ?? null,
            'steam_city_id' => $steamUser['loccityid'] ?? null,
            'steam_authenticated_at' => now(),
            'role' => $isFirstUser ? 'admin' : 'user',
        ]);
        $this->updateUserAdditionalData($user, $steamUser['steamid']);
        return $user;
    }

    private function updateUserSteamData($user, $steamUser)
    {
        $user->update([
            'steam_username' => $steamUser['personaname'],
            'steam_avatar' => $steamUser['avatar'] ?? $user->steam_avatar,
            'steam_avatar_medium' => $steamUser['avatarmedium'] ?? $user->steam_avatar_medium,
            'steam_avatar_full' => $steamUser['avatarfull'] ?? $user->steam_avatar_full,
            'steam_profile_background' => $this->getSteamProfileBackground($steamUser['steamid']) ?? $user->steam_profile_background,
            'steam_profile_url' => $steamUser['profileurl'] ?? $user->steam_profile_url,
            'steam_real_name' => $steamUser['realname'] ?? $user->steam_real_name,
            'steam_persona_state' => $steamUser['personastate'] ?? $user->steam_persona_state,
            'steam_community_visibility_state' => $steamUser['communityvisibilitystate'] ?? $user->steam_community_visibility_state,
            'steam_profile_state' => $steamUser['profilestate'] ?? $user->steam_profile_state,
            'steam_last_logoff' => isset($steamUser['lastlogoff']) ? now()->createFromTimestamp($steamUser['lastlogoff']) : $user->steam_last_logoff,
            'steam_comment_permission' => $steamUser['commentpermission'] ?? $user->steam_comment_permission,
            'steam_country_code' => $steamUser['loccountrycode'] ?? $user->steam_country_code,
            'steam_state_code' => $steamUser['locstatecode'] ?? $user->steam_state_code,
            'steam_city_id' => $steamUser['loccityid'] ?? $user->steam_city_id,
            'steam_authenticated_at' => now(),
        ]);
    }

    private function updateUserAdditionalData($user, $steamId)
    {
        $games = $this->getSteamUserGames($steamId);
        $friends = $this->getSteamUserFriends($steamId);
        $user->update([
            'steam_games' => $games,
            'steam_friends' => $friends,
        ]);
    }

    private function getSteamProfileBackground($steamId)
    {
        try {
            $apiKey = config('services.steam.api_key');
            $url = "https://api.steampowered.com/IPlayerService/GetProfileBackground/v0001/?key={$apiKey}&steamid={$steamId}";
            $response = Http::get($url);
            $data = $response->json();
            if (isset($data['response']['backgrounds'][0]['url'])) {
                return $data['response']['backgrounds'][0]['url'];
            }
        } catch (\Exception $e) {
            \Log::error('Steam Background API Error: ' . $e->getMessage());
        }
        return "https://steamcommunity.com/profiles/{$steamId}/background/";
    }
}