<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seed_colors', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('seed_id');
            $table->string('color'); // Цвет семени
            $table->timestamps();

            $table->foreign('seed_id')->references('id')->on('seeds')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seed_colors');
    }
}; 