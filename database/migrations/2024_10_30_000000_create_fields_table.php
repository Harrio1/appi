<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('fields')) {
            Schema::create('fields', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('name');
                $table->json('coordinates');
                $table->integer('area')->unsigned();
                $table->unsignedBigInteger('season_id')->nullable(); // Сделать nullable, если это допустимо
                $table->timestamps();
            });

            // Добавляем ограничение после создания таблицы
            DB::statement('ALTER TABLE fields ADD CONSTRAINT chk_area_length CHECK (area <= 999999999)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fields');
    }
}; 