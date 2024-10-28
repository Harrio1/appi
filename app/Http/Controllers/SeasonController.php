<?php

namespace App\Http\Controllers;

use App\Models\Season;
use Illuminate\Http\Request;

class SeasonController extends Controller
{
    public function index()
    {
        $seasons = Season::all();
        return response()->json($seasons);
    }

    public function createNewSeason(Request $request)
    {
        // Валидация входящих данных
        $validatedData = $request->validate([
            'name' => 'required|string',
            'seeds' => 'required|array|min:1', // Убедитесь, что массив не пустой
        ]);

        // Создание нового сезона
        $season = new Season();
        $season->name = $validatedData['name'];
        $season->save();

        // Логика для обработки seeds, если необходимо
        foreach ($validatedData['seeds'] as $seed) {
            // Пример обработки каждого элемента seeds
            // $seed['id'] и $seed['field_type'] могут быть использованы здесь
        }

        return response()->json($season);
    }
}
