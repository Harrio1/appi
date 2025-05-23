<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('seeds')) {
            Schema::create('seeds', function (Blueprint $table) {
                $table->id();
                $table->string('name'); // Название семени
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('seeds');
    }
}; 