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
            $table->unsignedBigInteger('field_type_id');
            $table->string('color');
            $table->timestamps();

            $table->foreign('field_type_id')->references('id')->on('field_types')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seed_colors');
    }
}; 