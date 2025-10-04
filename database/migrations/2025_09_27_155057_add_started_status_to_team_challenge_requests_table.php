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
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired', 'started'])->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_challenge_requests', function (Blueprint $table) {
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired'])->default('pending')->change();
        });
    }
};
