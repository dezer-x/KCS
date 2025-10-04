<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PracticeServer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PracticeServerController extends Controller
{
    /**
     * Get available map images from public/maps directory
     */
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
                    // Exclude non-image files and files that are clearly not maps
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
     * Display a listing of the resource.
     */
    public function index()
    {
        $servers = PracticeServer::orderBy('created_at', 'desc')->get();
        
        // Get available map images from public/maps directory
        $mapImages = $this->getMapImages();

        return Inertia::render('Admin/Practice/Index', [
            'servers' => $servers,
            'mapImages' => $mapImages,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Get available map images from public/maps directory
        $mapImages = $this->getMapImages();

        return Inertia::render('Admin/Practice/Create', [
            'mapImages' => $mapImages,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'map_name' => 'required|string|max:255',
            'map_image' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'ip_address' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        PracticeServer::create($request->all());

        return redirect()->route('admin.practice.index')
            ->with('success', 'Practice server created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(PracticeServer $practice)
    {
        return Inertia::render('Admin/Practice/Show', [
            'server' => $practice,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PracticeServer $practice)
    {
        // Get available map images from public/maps directory
        $mapImages = $this->getMapImages();

        return Inertia::render('Admin/Practice/Edit', [
            'server' => $practice,
            'mapImages' => $mapImages,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PracticeServer $practice)
    {
        Log::info('Practice Server Update Request', [
            'server_id' => $practice->id,
            'request_data' => $request->all(),
            'user_id' => auth()->id(),
            'ip' => $request->ip()
        ]);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'map_name' => 'required|string|max:255',
            'map_image' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'ip_address' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            Log::warning('Practice Server Update Validation Failed', [
                'server_id' => $practice->id,
                'errors' => $validator->errors()->toArray(),
                'request_data' => $request->all()
            ]);
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $oldData = $practice->toArray();
            $practice->update($request->all());
            
            Log::info('Practice Server Updated Successfully', [
                'server_id' => $practice->id,
                'old_data' => $oldData,
                'new_data' => $practice->fresh()->toArray()
            ]);

            return redirect()->route('admin.practice.index')
                ->with('success', 'Practice server updated successfully!');
        } catch (\Exception $e) {
            Log::error('Practice Server Update Failed', [
                'server_id' => $practice->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return redirect()->back()
                ->with('error', 'Failed to update practice server. Please try again.')
                ->withInput();
        }
    }

    /**
     * Toggle server status
     */
    public function toggleStatus(Request $request, PracticeServer $practiceServer)
    {
        Log::info('Practice Server Toggle Status Request', [
            'server_id' => $practiceServer->id,
            'current_status' => $practiceServer->is_active,
            'new_status' => $request->boolean('is_active', !$practiceServer->is_active),
            'user_id' => auth()->id(),
            'ip' => $request->ip()
        ]);

        try {
            $oldStatus = $practiceServer->is_active;
            $practiceServer->update([
                'is_active' => $request->boolean('is_active', !$practiceServer->is_active)
            ]);
            
            Log::info('Practice Server Status Toggled Successfully', [
                'server_id' => $practiceServer->id,
                'old_status' => $oldStatus,
                'new_status' => $practiceServer->is_active
            ]);

            return redirect()->back()
                ->with('success', 'Server status updated successfully!');
        } catch (\Exception $e) {
            Log::error('Practice Server Status Toggle Failed', [
                'server_id' => $practiceServer->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()
                ->with('error', 'Failed to update server status. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PracticeServer $practice)
    {
        Log::info('Practice Server Delete Request', [
            'server_id' => $practice->id,
            'server_name' => $practice->name,
            'user_id' => auth()->id(),
            'ip' => request()->ip()
        ]);

        try {
            $serverData = $practice->toArray();
            $practice->delete();
            
            Log::info('Practice Server Deleted Successfully', [
                'server_id' => $practice->id,
                'deleted_data' => $serverData
            ]);

            return redirect()->route('admin.practice.index')
                ->with('success', 'Practice server deleted successfully!');
        } catch (\Exception $e) {
            Log::error('Practice Server Delete Failed', [
                'server_id' => $practice->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()
                ->with('error', 'Failed to delete practice server. Please try again.');
        }
    }
}
