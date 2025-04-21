<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('properties')) {
            Schema::create('properties', function (Blueprint $table) {
                $table->id();
                $table->foreignId('field_id')->constrained()->onDelete('cascade');
                $table->foreignId('season_id')->constrained()->onDelete('cascade');
                $table->foreignId('seed_id')->constrained()->onDelete('cascade');
                $table->string('seed_color');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
}; 