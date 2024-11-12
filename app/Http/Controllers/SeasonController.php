<?php

namespace App\Http\Controllers;

use App\Models\Season;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SeasonController extends Controller
{
    public function index()
    {
        $seasons = Season::all();
        return response()->json($seasons);
    }

    public function createNewSeason(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string',
        ]);

        $season = Season::create(['name' => $validatedData['name']]);

        return response()->json($season, 201);
    }

    public function someMethod(Request $request)
    {
        $validatedData = $request->validate([
            'season_name' => 'required|string|exists:seasons,name',
        ]);

        $season = Season::where('name', $validatedData['season_name'])->firstOrFail();

        // Дальнейшая обработка
    }

    public function getFieldsForSeason($seasonId)
    {
        try {
            $season = Season::findOrFail($seasonId);
            $fields = $season->fields; // Убедитесь, что связь настроена правильно

            $formattedFields = $fields->map(function($field) {
                return [
                    'id' => $field->id,
                    'coordinates' => json_decode($field->coordinates, true),
                    'color' => $field->color,
                    'name' => $field->name,
                    'area' => $field->area
                ];
            });

            return response()->json($formattedFields);
        } catch (\Exception $e) {
            Log::error('Ошибка при получении полей для сезона: ' . $e->getMessage());
            return response()->json(['error' => 'Ошибка при получении данных'], 500);
        }
    }
}
