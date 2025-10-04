<?php

namespace App\Http\Socialite\Providers;

use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\ProviderInterface;
use Laravel\Socialite\Two\User;

class SteamProvider extends AbstractProvider implements ProviderInterface
{
    protected $scopes = ['openid'];

    protected function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase('https://steamcommunity.com/openid/login', $state);
    }

    protected function getTokenUrl()
    {
        return 'https://steamcommunity.com/openid/login';
    }

    protected function getUserByToken($token)
    {
        // Steam OpenID doesn't use traditional tokens
        // We'll handle this in the callback
        return [];
    }

    protected function mapUserToObject(array $user)
    {
        return (new User)->setRaw($user)->map([
            'id' => $user['steamid'],
            'nickname' => $user['personaname'],
            'name' => $user['realname'] ?? $user['personaname'],
            'email' => null, // Steam doesn't provide email
            'avatar' => $user['avatar'],
            'avatar_original' => $user['avatarfull'],
        ]);
    }

    public function getSteamUser($steamId)
    {
        $apiKey = config('services.steam.api_key');
        $url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={$apiKey}&steamids={$steamId}";
        
        $response = $this->getHttpClient()->get($url);
        $data = json_decode($response->getBody(), true);
        
        if (isset($data['response']['players'][0])) {
            return $data['response']['players'][0];
        }
        
        return null;
    }

    public function getSteamUserGames($steamId)
    {
        $apiKey = config('services.steam.api_key');
        $url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={$apiKey}&steamid={$steamId}&format=json&include_appinfo=true";
        
        $response = $this->getHttpClient()->get($url);
        $data = json_decode($response->getBody(), true);
        
        return $data['response']['games'] ?? [];
    }

    public function getSteamUserFriends($steamId)
    {
        $apiKey = config('services.steam.api_key');
        $url = "https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key={$apiKey}&steamid={$steamId}&relationship=friend";
        
        $response = $this->getHttpClient()->get($url);
        $data = json_decode($response->getBody(), true);
        
        return $data['friendslist']['friends'] ?? [];
    }
}
