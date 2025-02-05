<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('fields')) {
            // Проверяем, существует ли уже ограничение
            $constraintExists = DB::select("
                SELECT COUNT(*) as count
                FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE()
                AND TABLE_NAME = 'fields'
                AND CONSTRAINT_NAME = 'chk_area_length'
            ")[0]->count > 0;

            if (!$constraintExists) {
                DB::statement('ALTER TABLE fields ADD CONSTRAINT chk_area_length CHECK (area <= 999999999)');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('fields')) {
            // Проверяем, существует ли ограничение перед удалением
            $constraintExists = DB::select("
                SELECT COUNT(*) as count
                FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE()
                AND TABLE_NAME = 'fields'
                AND CONSTRAINT_NAME = 'chk_area_length'
            ")[0]->count > 0;

            if ($constraintExists) {
                DB::statement('ALTER TABLE fields DROP CONSTRAINT chk_area_length');
            }
        }
    }
};
