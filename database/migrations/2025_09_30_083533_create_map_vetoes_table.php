<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('map_vetoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenge_id')->constrained('team_challenge_requests')->onDelete('cascade');
            $table->string('map_name');
            $table->foreignId('banned_by_team_id')->constrained('teams')->onDelete('cascade');
            $table->integer('veto_order');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('map_vetoes');
    }
};