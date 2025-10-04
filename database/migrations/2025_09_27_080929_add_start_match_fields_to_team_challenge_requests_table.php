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
            $table->boolean('challenger_ready')->default(false);
            $table->boolean('challenged_ready')->default(false);
            $table->timestamp('match_started_at')->nullable();
            $table->string('match_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_challenge_requests', function (Blueprint $table) {
            $table->dropColumn(['challenger_ready', 'challenged_ready', 'match_started_at', 'match_id']);
        });
    }
};
