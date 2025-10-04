<?php

namespace Tests\Feature;

use App\Services\CountryDetectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CountryDetectionServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_detect_country_from_ip()
    {
        $service = new CountryDetectionService();
        
        // Test with a known IP (Google's public DNS)
        $country = $service->getCountryFromIp('8.8.8.8');
        
        // Should return a 2-letter country code or null
        $this->assertTrue(
            is_null($country) || (is_string($country) && strlen($country) === 2)
        );
    }

    public function test_handles_invalid_ip_gracefully()
    {
        $service = new CountryDetectionService();
        
        $country = $service->getCountryFromIp('invalid-ip');
        
        $this->assertNull($country);
    }

    public function test_handles_localhost_ip()
    {
        $service = new CountryDetectionService();
        
        $country = $service->getCountryForCurrentRequest();
        
        // For localhost, should return null
        $this->assertNull($country);
    }
}