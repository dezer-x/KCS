<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('team_challenge_requests', function (Blueprint $table) {
            // Drop the problematic unique constraint that includes status
            $table->dropUnique('unique_active_challenge');

            // Add a unique constraint only for active challenges (pending/accepted/started)
            // This allows multiple expired/declined/completed challenges between the same teams
            $table->index(['challenger_team_id', 'challenged_team_id', 'status'], 'idx_challenge_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_challenge_requests', function (Blueprint $table) {
            $table->dropIndex('idx_challenge_status');
            $table->unique(['challenger_team_id', 'challenged_team_id', 'status'], 'unique_active_challenge');
        });
    }
};
