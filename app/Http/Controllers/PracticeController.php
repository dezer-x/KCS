<?php

namespace App\Http\Controllers;

use App\Models\PracticeServer;
use Inertia\Inertia;
use Inertia\Response;

class PracticeController extends Controller
{

    public function index(): Response
    {
        $servers = PracticeServer::where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Practice', [
            'servers' => $servers,
        ]);
    }
}



