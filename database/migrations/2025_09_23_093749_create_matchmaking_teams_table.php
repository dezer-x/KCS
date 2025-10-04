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
        Schema::create('matchmaking_teams', function (Blueprint $table) {
            $table->id();
            $table->string('team_id')->unique(); // UUID for team identification
            $table->foreignId('leader_id')->constrained('users')->onDelete('cascade');
            $table->string('name')->nullable(); // Optional team name
            $table->boolean('is_private')->default(false);
            $table->enum('status', ['waiting', 'full', 'in_match', 'disbanded'])->default('waiting');
            $table->integer('max_players')->default(5);
            $table->integer('current_players')->default(1);
            $table->string('region')->default('US');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matchmaking_teams');
    }
};