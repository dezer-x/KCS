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
        Schema::create('matchmaking_servers', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address');
            $table->integer('port');
            $table->boolean('is_active')->default(true);
            $table->integer('max_players')->default(10); // 5v5
            $table->integer('current_players')->default(0);
            $table->boolean('is_occupied')->default(false);
            $table->string('occupied_by_team_1')->nullable();
            $table->string('occupied_by_team_2')->nullable();
            $table->string('match_id')->nullable();
            $table->timestamp('match_started_at')->nullable();
            $table->timestamp('match_ended_at')->nullable();
            $table->string('server_password')->nullable();
            $table->string('rcon_password');
            $table->string('region')->default('US');
            $table->integer('tickrate')->default(128);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matchmaking_servers');
    }
};
