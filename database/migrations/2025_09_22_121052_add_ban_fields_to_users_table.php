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
            $table->timestamp('banned_at')->nullable();
            $table->text('ban_reason')->nullable();
            $table->string('ban_duration')->nullable(); // 'permanent', '1_day', '1_week', '1_month', '3_months', '6_months', '1_year'
            $table->timestamp('banned_until')->nullable();
            $table->unsignedBigInteger('banned_by')->nullable(); // Admin who banned the user
            $table->foreign('banned_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['banned_by']);
            $table->dropColumn(['banned_at', 'ban_reason', 'ban_duration', 'banned_until', 'banned_by']);
        });
    }
};
