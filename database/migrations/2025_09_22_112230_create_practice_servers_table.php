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
        Schema::create('practice_servers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('map_name');
            $table->string('map_image')->nullable();
            $table->text('description')->nullable();
            $table->string('ip_address');
            $table->integer('port');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practice_servers');
    }
};
