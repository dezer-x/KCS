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
        Schema::create('team_challenge_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenger_team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('challenged_team_id')->constrained('teams')->onDelete('cascade');
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired'])->default('pending');
            $table->timestamp('expires_at');
            $table->text('message')->nullable();
            $table->timestamps();
            
            $table->index(['challenger_team_id', 'status']);
            $table->index(['challenged_team_id', 'status']);
            $table->unique(['challenger_team_id', 'challenged_team_id', 'status'], 'unique_active_challenge');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_challenge_requests');
    }
};
