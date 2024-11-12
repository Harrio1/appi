<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('field_id');
            $table->unsignedBigInteger('season_id');
            $table->string('field_type');
            $table->string('seed_color');
            $table->timestamps();

            $table->foreign('field_id')->references('id')->on('fields')->onDelete('cascade');
            $table->foreign('season_id')->references('id')->on('seasons')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
}; 