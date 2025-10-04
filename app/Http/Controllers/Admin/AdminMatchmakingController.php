<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MatchmakingServer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AdminMatchmakingController extends Controller
{
    private function getMapImages()
    {
        $mapsPath = public_path('maps');
        $mapImages = collect();
        
        if (is_dir($mapsPath)) {
            $mapImages = collect(scandir($mapsPath))
                ->filter(function ($file) {
                    return !in_array($file, ['.', '..']) && is_file(public_path("maps/{$file}"));
                })
                ->filter(function ($file) {
                    return in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['png', 'jpg', 'jpeg', 'webp']);
                })
                ->filter(function ($file) {
                    $excludePatterns = [
                        'soldier',
                        'character',
                        'player',
                        'avatar',
                        'portrait',
                        'person',
                        'face',
                        'head',
                        'body',
                        'placeholder',
                        'txt'
                    ];
                    
                    $fileName = strtolower(pathinfo($file, PATHINFO_FILENAME));
                    $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                    
                    // Exclude text files
                    if ($extension === 'txt') {
                        return false;
                    }
                    
                    // Exclude files with non-map patterns
                    foreach ($excludePatterns as $pattern) {
                        if (strpos($fileName, $pattern) !== false) {
                            return false;
                        }
                    }
                    
                    // Only include files that look like map names (CS:GO/CS2 maps)
                    $mapPatterns = [
                        'dust', 'mirage', 'inferno', 'nuke', 'overpass', 'train', 'vertigo', 'ancient', 'anubis',
                        'cache', 'cobblestone', 'overpass', 'cobble', 'canals', 'zoo', 'biome', 'subzero',
                        'de_', 'cs_', 'ar_', 'fy_', 'awp_', 'aim_', 'surf_', 'kz_', 'bhop_'
                    ];
                    
                    $isMap = false;
                    foreach ($mapPatterns as $pattern) {
                        if (strpos($fileName, $pattern) !== false) {
                            $isMap = true;
                            break;
                        }
                    }
                    
                    return $isMap;
                })
                ->values();
        }
        
        return $mapImages;
    }

    /**
     * Display a listing of matchmaking servers
     */
    public function index()
    {
        \Log::info('Loading matchmaking servers index');
        
        $servers = MatchmakingServer::orderBy('created_at', 'desc')->get();
        
        \Log::info('Found servers', ['count' => $servers->count()]);

        return Inertia::render('Admin/Matchmaking/Index', [
            'servers' => $servers,
        ]);
    }

    /**
     * Show the form for creating a new matchmaking server
     */
    public function create()
    {
        \Log::info('Loading matchmaking server create form');

        return Inertia::render('Admin/Matchmaking/Create');
    }

    /**
     * Store a newly created matchmaking server
     */
    public function store(Request $request)
    {
        \Log::info('Creating matchmaking server', ['request_data' => $request->all()]);

        $request->validate([
            'ip_address' => 'required|ip',
            'port' => 'required|integer|min:1|max:65535',
            'max_players' => 'required|integer|min:2|max:20',
            'is_active' => 'boolean',
            'server_password' => 'nullable|string|max:255',
            'rcon_password' => 'required|string|max:255',
            'region' => 'required|string|in:US,EU,AS,SA',
            'tickrate' => 'required|integer|in:64,128',
        ]);

        try {
            $server = MatchmakingServer::create([
                'ip_address' => $request->ip_address,
                'port' => $request->port,
                'max_players' => $request->max_players,
                'is_active' => $request->boolean('is_active', true),
                'current_players' => 0,
                'is_occupied' => false,
                'server_password' => $request->server_password,
                'rcon_password' => $request->rcon_password,
                'region' => $request->region,
                'tickrate' => $request->tickrate,
            ]);

            \Log::info('Matchmaking server created successfully', ['server_id' => $server->id]);
            
            return redirect()->route('admin.matchmaking.index')
                ->with('success', 'MatchyZ server created successfully.');
        } catch (\Exception $e) {
            \Log::error('Error creating matchmaking server', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            return back()->withErrors(['error' => 'Failed to create server. Please try again.']);
        }
    }

    /**
     * Display the specified matchmaking server
     */
    public function show(MatchmakingServer $matchmaking)
    {
        return Inertia::render('Admin/Matchmaking/Show', [
            'server' => $matchmaking,
        ]);
    }

    /**
     * Show the form for editing the specified matchmaking server
     */
    public function edit(MatchmakingServer $matchmaking)
    {
        \Log::info('Loading matchmaking server edit form', ['server_id' => $matchmaking->id]);

        return Inertia::render('Admin/Matchmaking/Edit', [
            'server' => $matchmaking,
        ]);
    }

    /**
     * Update the specified matchmaking server
     */
    public function update(Request $request, MatchmakingServer $matchmaking)
    {
        \Log::info('Updating matchmaking server', ['server_id' => $matchmaking->id, 'request_data' => $request->all()]);

        $request->validate([
            'ip_address' => 'required|ip',
            'port' => 'required|integer|min:1|max:65535',
            'max_players' => 'required|integer|min:2|max:20',
            'is_active' => 'boolean',
            'server_password' => 'nullable|string|max:255',
            'rcon_password' => 'required|string|max:255',
            'region' => 'required|string|in:US,EU,AS,SA',
            'tickrate' => 'required|integer|in:64,128',
        ]);

        try {
            $matchmaking->update([
                'ip_address' => $request->ip_address,
                'port' => $request->port,
                'max_players' => $request->max_players,
                'is_active' => $request->boolean('is_active', $matchmaking->is_active),
                'server_password' => $request->server_password,
                'rcon_password' => $request->rcon_password,
                'region' => $request->region,
                'tickrate' => $request->tickrate,
            ]);

            \Log::info('Matchmaking server updated successfully', ['server_id' => $matchmaking->id]);
            
            return redirect()->route('admin.matchmaking.index')
                ->with('success', 'MatchyZ server updated successfully.');
        } catch (\Exception $e) {
            \Log::error('Error updating matchmaking server', ['server_id' => $matchmaking->id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            return back()->withErrors(['error' => 'Failed to update server. Please try again.']);
        }
    }

    /**
     * Remove the specified matchmaking server
     */
    public function destroy(MatchmakingServer $matchmaking)
    {
        \Log::info('Deleting matchmaking server', ['server_id' => $matchmaking->id, 'is_occupied' => $matchmaking->is_occupied]);

        if ($matchmaking->is_occupied) {
            \Log::warning('Cannot delete occupied server', ['server_id' => $matchmaking->id]);
            return redirect()->route('admin.matchmaking.index')
                ->with('error', 'Cannot delete server that is currently in a match.');
        }

        try {
            $matchmaking->delete();
            \Log::info('Matchmaking server deleted successfully', ['server_id' => $matchmaking->id]);
            
            return redirect()->route('admin.matchmaking.index')
                ->with('success', 'MatchyZ server deleted successfully.');
        } catch (\Exception $e) {
            \Log::error('Error deleting matchmaking server', ['server_id' => $matchmaking->id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            return redirect()->route('admin.matchmaking.index')
                ->with('error', 'Failed to delete server. Please try again.');
        }
    }

    /**
     * Toggle server active status
     */
    public function toggleStatus(Request $request, MatchmakingServer $matchmaking)
    {
        \Log::info('Toggling server status', ['server_id' => $matchmaking->id, 'current_status' => $matchmaking->is_active, 'is_occupied' => $matchmaking->is_occupied]);

        if ($matchmaking->is_occupied) {
            \Log::warning('Cannot toggle occupied server', ['server_id' => $matchmaking->id]);
            return redirect()->route('admin.matchmaking.index')
                ->with('error', 'Cannot deactivate server that is currently in a match.');
        }

        try {
            $newStatus = $request->boolean('is_active', !$matchmaking->is_active);
            $matchmaking->update(['is_active' => $newStatus]);
            
            \Log::info('Server status toggled successfully', ['server_id' => $matchmaking->id, 'new_status' => $newStatus]);
            
            return redirect()->route('admin.matchmaking.index')
                ->with('success', 'Server status updated successfully.');
        } catch (\Exception $e) {
            \Log::error('Error toggling server status', ['server_id' => $matchmaking->id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            return redirect()->route('admin.matchmaking.index')
                ->with('error', 'Failed to update server status. Please try again.');
        }
    }

    /**
     * End a match on the server
     */
    public function endMatch(MatchmakingServer $matchmaking)
    {
        \Log::info('Ending match on server', ['server_id' => $matchmaking->id, 'is_occupied' => $matchmaking->is_occupied]);

        if (!$matchmaking->is_occupied) {
            \Log::warning('Cannot end match on non-occupied server', ['server_id' => $matchmaking->id]);
            return redirect()->route('admin.matchmaking.index')
                ->with('error', 'Server is not currently in a match.');
        }

        try {
            $matchmaking->endMatch();
            \Log::info('Match ended successfully', ['server_id' => $matchmaking->id]);
            
            return redirect()->route('admin.matchmaking.index')
                ->with('success', 'Match ended successfully.');
        } catch (\Exception $e) {
            \Log::error('Error ending match', ['server_id' => $matchmaking->id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            return redirect()->route('admin.matchmaking.index')
                ->with('error', 'Failed to end match. Please try again.');
        }
    }
}
