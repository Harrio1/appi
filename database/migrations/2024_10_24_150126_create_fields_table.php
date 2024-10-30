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
        Schema::create('fields', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('coordinates'); // Храните координаты в виде строки или JSON
            $table->string('color');
            $table->timestamps();
        });

        Schema::table('fields', function (Blueprint $table) {
            $table->unsignedBigInteger('season_id')->nullable();

            // Если у вас есть таблица seasons, добавьте внешний ключ
            $table->foreign('season_id')->references('id')->on('seasons')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fields');
    }
};
