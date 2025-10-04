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
        Schema::table('game_matches', function (Blueprint $table) {
            $table->string('server_display_name')->nullable();
            $table->integer('api_team1_id')->nullable(); // External API team ID
            $table->integer('api_team2_id')->nullable(); // External API team ID
            $table->string('title')->nullable();
            $table->boolean('is_finished')->default(false);
            $table->boolean('is_cancelled')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_matches', function (Blueprint $table) {
            $table->dropColumn([
                'server_display_name',
                'api_team1_id',
                'api_team2_id',
                'title',
                'is_finished',
                'is_cancelled'
            ]);
        });
    }
};
