<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSeasonPolygonSeedsTable extends Migration
{
    public function up()
    {
        Schema::create('season_polygon_seeds', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('polygon_id');
            $table->foreign('polygon_id')->references('id')->on('fields')->onDelete('cascade');
            $table->string('seed_type');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('season_polygon_seeds');
    }
}