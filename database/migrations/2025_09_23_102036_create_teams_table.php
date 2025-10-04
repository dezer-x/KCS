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
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('team_id')->unique(); // UUID for public reference
            $table->string('name')->nullable();
            $table->boolean('is_private')->default(false);
            $table->enum('status', ['waiting', 'in_match', 'completed'])->default('waiting');
            $table->string('region', 10)->default('US');
            $table->integer('max_players')->default(5);
            $table->json('user_ids'); // Array of user IDs in the team
            $table->foreignId('leader_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->index(['status', 'region']);
            $table->index('leader_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};