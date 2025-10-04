<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameMatch;
use App\Services\MatchApiService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class AdminMatchesController extends Controller
{
    public function __construct(
        private MatchApiService $matchApiService
    ) {}

    /**
     * Display all matches with filtering and tabs
     */
    public function index(Request $request)
    {
        Log::info('Loading matches index', ['request' => $request->all()]);

        $tab = $request->get('tab', 'all');
        $search = $request->get('search', '');
        $perPage = 10;

        $query = GameMatch::with(['team1', 'team2', 'winnerTeam'])
            ->orderBy('created_at', 'desc');

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('match_id', 'like', "%{$search}%")
                    ->orWhere('api_match_id', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('map', 'like', "%{$search}%")
                    ->orWhere('server_ip', 'like', "%{$search}%")
                    ->orWhereHas('team1', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('team2', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Apply tab filters
        switch ($tab) {
            case 'active':
                $query->where('is_finished', false)
                    ->where('is_cancelled', false)
                    ->whereNotNull('started_at');
                break;
            case 'pending':
                $query->where('is_finished', false)
                    ->where('is_cancelled', false)
                    ->whereNull('started_at');
                break;
            case 'finished':
                $query->where('is_finished', true)
                    ->where('is_cancelled', false);
                break;
            case 'cancelled':
                $query->where('is_cancelled', true);
                break;
            // 'all' tab - no additional filters
        }

        $matches = $query->paginate($perPage)->withQueryString();

        // Get counts for each tab
        $counts = [
            'all' => GameMatch::count(),
            'active' => GameMatch::where('is_finished', false)
                ->where('is_cancelled', false)
                ->whereNotNull('started_at')
                ->count(),
            'pending' => GameMatch::where('is_finished', false)
                ->where('is_cancelled', false)
                ->whereNull('started_at')
                ->count(),
            'finished' => GameMatch::where('is_finished', true)
                ->where('is_cancelled', false)
                ->count(),
            'cancelled' => GameMatch::where('is_cancelled', true)->count(),
        ];

        Log::info('Loaded matches', [
            'count' => $matches->count(),
            'tab' => $tab,
            'search' => $search
        ]);

        return Inertia::render('Admin/Matches', [
            'matches' => $matches,
            'counts' => $counts,
            'currentTab' => $tab,
            'searchQuery' => $search,
        ]);
    }

    /**
     * Download demo file for a match
     */
    public function downloadDemo(Request $request, GameMatch $match)
    {
        try {
            Log::info('Downloading demo for match', [
                'match_id' => $match->id,
                'api_match_id' => $match->api_match_id
            ]);

            // Validate that the match is finished
            if (!$match->is_finished) {
                return back()->with('error', 'Cannot download demo for an unfinished match.');
            }

            // Get match details from API if needed
            $matchData = $match->match_data;

            // Generate demo filename (you may need to adjust this based on your actual format)
            // Default format might be something like: match{matchId}_map{mapNumber}.dem
            $fileName = $request->get('file_name', "match{$match->api_match_id}_map0.dem");
            $mapNumber = $request->get('map_number', 0);

            $response = $this->matchApiService->downloadDemo(
                $match->api_match_id,
                $fileName,
                $mapNumber
            );

            if (!$response) {
                return back()->with('error', 'Failed to download demo file. Please try again.');
            }

            // Return the file as a download
            return response($response->body(), 200, [
                'Content-Type' => 'application/octet-stream',
                'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
                'Content-Length' => strlen($response->body()),
            ]);

        } catch (\Exception $e) {
            Log::error('Error downloading demo', [
                'match_id' => $match->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with('error', 'Failed to download demo file. Please try again.');
        }
    }

    /**
     * Cancel a match
     */
    public function cancel(GameMatch $match)
    {
        try {
            Log::info('Cancelling match', ['match_id' => $match->id]);

            if ($match->is_finished) {
                return back()->with('error', 'Cannot cancel a finished match.');
            }

            if ($match->is_cancelled) {
                return back()->with('error', 'Match is already cancelled.');
            }

            // Cancel via API
            $result = $this->matchApiService->cancelMatch($match->api_match_id);

            if (!$result) {
                return back()->with('error', 'Failed to cancel match via API.');
            }

            // Update local database
            $match->update([
                'is_cancelled' => true,
                'is_finished' => true,
                'ended_at' => now(),
            ]);

            // Mark the associated challenge as completed
            $challenge = \App\Models\TeamChallengeRequest::where('match_id', $match->match_id)->first();
            if ($challenge) {
                $challenge->markMatchCompleted();
                Log::info('Challenge marked as completed', ['challenge_id' => $challenge->id]);
            }

            Log::info('Match cancelled successfully', ['match_id' => $match->id]);

            return back()->with('success', 'Match cancelled successfully.');

        } catch (\Exception $e) {
            Log::error('Error cancelling match', [
                'match_id' => $match->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Failed to cancel match. Please try again.');
        }
    }
}