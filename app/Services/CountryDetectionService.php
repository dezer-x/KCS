<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CountryDetectionService
{
    /**
     * Get country code from IP address
     */
    public function getCountryFromIp(string $ip): ?string
    {
        try {
            // Using ipapi.co for country detection (free tier available)
            $response = Http::timeout(5)->get("http://ipapi.co/{$ip}/country/");
            
            if ($response->successful()) {
                $countryCode = trim($response->body());
                
                // Validate that we got a proper country code (2 letters)
                if (strlen($countryCode) === 2 && ctype_alpha($countryCode)) {
                    return strtoupper($countryCode);
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to detect country from IP: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Get client IP address
     */
    public function getClientIp(): string
    {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];

        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                $ip = $_SERVER[$key];
                
                if (strpos($ip, ',') !== false) {
                    $ip = explode(',', $ip)[0];
                }
                
                $ip = trim($ip);
                
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        return request()->ip() ?? '127.0.0.1';
    }

    /**
     * Get country code for current request
     */
    public function getCountryForCurrentRequest(): ?string
    {
        $ip = $this->getClientIp();
        
        // Skip detection for localhost/private IPs
        if (in_array($ip, ['127.0.0.1', '::1']) || !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return null;
        }

        return $this->getCountryFromIp($ip);
    }
}
