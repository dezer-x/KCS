<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\PracticeServerController;
use App\Http\Controllers\Admin\UserBanController;
use App\Http\Controllers\Admin\AdminMatchmakingController;
use App\Http\Controllers\Admin\AdminMatchesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'admin', 'banned'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    Route::resource('practice', PracticeServerController::class)->names([
        'index' => 'admin.practice.index',
        'create' => 'admin.practice.create',
        'store' => 'admin.practice.store',
        'show' => 'admin.practice.show',
        'edit' => 'admin.practice.edit',
        'update' => 'admin.practice.update',
        'destroy' => 'admin.practice.destroy',
    ]);
    Route::patch('practice/{practiceServer}/toggle', [PracticeServerController::class, 'toggleStatus'])->name('admin.practice.toggle');
    Route::get('users/ban/{user}', [UserBanController::class, 'showBanForm'])->name('admin.users.ban.show');
    Route::post('users/ban', [UserBanController::class, 'banUser'])->name('admin.users.ban');
    Route::post('users/unban', [UserBanController::class, 'unbanUser'])->name('admin.users.unban');
    Route::get('users/banned', [UserBanController::class, 'getBannedUsers'])->name('admin.users.banned');
    Route::get('users/ban-durations', [UserBanController::class, 'getBanDurations'])->name('admin.users.ban-durations');
    Route::post('users/toggle-role', [AdminController::class, 'toggleUserRole'])->name('admin.users.toggle-role');
    Route::resource('matchmaking', AdminMatchmakingController::class)->names([
        'index' => 'admin.matchmaking.index',
        'create' => 'admin.matchmaking.create',
        'store' => 'admin.matchmaking.store',
        'show' => 'admin.matchmaking.show',
        'edit' => 'admin.matchmaking.edit',
        'update' => 'admin.matchmaking.update',
        'destroy' => 'admin.matchmaking.destroy',
    ]);
    Route::patch('matchmaking/{matchmaking}/toggle', [AdminMatchmakingController::class, 'toggleStatus'])->name('admin.matchmaking.toggle');
    Route::patch('matchmaking/{matchmaking}/end-match', [AdminMatchmakingController::class, 'endMatch'])->name('admin.matchmaking.end-match');
    Route::get('matches', [AdminMatchesController::class, 'index'])->name('admin.matches.index');
    Route::get('matches/{match}/download-demo', [AdminMatchesController::class, 'downloadDemo'])->name('admin.matches.download-demo');
    Route::post('matches/{match}/cancel', [AdminMatchesController::class, 'cancel'])->name('admin.matches.cancel');
});
