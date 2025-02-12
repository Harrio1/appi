<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SeedInitialDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Начальные данные для таблиц seeds и seed_colors
        $initialData = [
            ['name' => 'Пшеница', 'color' => 'gold'],
            ['name' => 'Кукуруза', 'color' => 'yellow'],
            ['name' => 'Соя', 'color' => 'green'],
            ['name' => 'Подсолнечник', 'color' => 'orange'],
            ['name' => 'Рапс', 'color' => 'lightgreen'],
            ['name' => 'Ячмень', 'color' => 'beige'],
            ['name' => 'Овес', 'color' => 'lightyellow'],
            ['name' => 'Рис', 'color' => 'lightblue'],
            ['name' => 'Гречиха', 'color' => 'brown'],
        ];

        // Добавляем начальные данные
        foreach ($initialData as $data) {
            // Добавляем культуру в таблицу seeds
            $seedId = DB::table('seeds')->insertGetId([
                'name' => $data['name'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Добавляем цвет культуры в таблицу seed_colors
            DB::table('seed_colors')->insert([
                'seed_id' => $seedId,
                'color' => $data['color'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Начальные данные успешно добавлены в seeds и seed_colors.');
    }
}
