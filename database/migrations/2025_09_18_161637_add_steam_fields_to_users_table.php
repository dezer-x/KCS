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
        Schema::table('users', function (Blueprint $table) {
            // Steam OpenID fields
            $table->string('steam_id')->unique()->nullable();
            $table->string('steam_username')->nullable();
            $table->string('steam_avatar')->nullable();
            $table->string('steam_avatar_medium')->nullable();
            $table->string('steam_avatar_full')->nullable();
            $table->string('steam_profile_background')->nullable();
            $table->string('steam_profile_url')->nullable();
            $table->string('steam_real_name')->nullable();
            $table->string('steam_persona_state')->nullable(); // 0=Offline, 1=Online, 2=Busy, 3=Away, 4=Snooze, 5=Looking to trade, 6=Looking to play
            $table->string('steam_community_visibility_state')->nullable(); // 1=Private, 2=Friends only, 3=Public
            $table->string('steam_profile_state')->nullable(); // 0=Not set, 1=Set
            $table->timestamp('steam_last_logoff')->nullable();
            $table->string('steam_comment_permission')->nullable(); // 0=No one, 1=Friends only, 2=Public
            $table->string('steam_country_code')->nullable();
            $table->string('steam_state_code')->nullable();
            $table->string('steam_city_id')->nullable();
            $table->json('steam_games')->nullable(); // Store user's games as JSON
            $table->json('steam_friends')->nullable(); // Store friends list as JSON
            $table->timestamp('steam_authenticated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'steam_id',
                'steam_username',
                'steam_avatar',
                'steam_avatar_medium',
                'steam_avatar_full',
                'steam_profile_background',
                'steam_profile_url',
                'steam_real_name',
                'steam_persona_state',
                'steam_community_visibility_state',
                'steam_profile_state',
                'steam_last_logoff',
                'steam_comment_permission',
                'steam_country_code',
                'steam_state_code',
                'steam_city_id',
                'steam_games',
                'steam_friends',
                'steam_authenticated_at',
            ]);
        });
    }
};
