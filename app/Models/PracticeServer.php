<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PracticeServer extends Model
{
    protected $fillable = [
        'name',
        'map_name',
        'map_image',
        'description',
        'ip_address',
        'port',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'port' => 'integer',
    ];

    /**
     * Get the map image URL
     */
    public function getMapImageUrl(): string
    {
        return $this->map_image ? asset("maps/{$this->map_image}") : asset('images/default-map.png');
    }

    /**
     * Get the server connection string
     */
    public function getConnectionString(): string
    {
        return "{$this->ip_address}:{$this->port}";
    }
}
