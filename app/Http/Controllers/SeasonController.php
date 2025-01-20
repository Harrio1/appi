<?php

namespace App\Http\Controllers;

use App\Models\Season;
use App\Models\Field;
use App\Models\Property;
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
            'name' => 'required|string|unique:seasons,name',
        ]);

        Log::info('Создание нового сезона с данными:', $validatedData);

        $season = Season::create(['name' => $validatedData['name']]);

        Log::info('Созданный сезон:', ['season' => $season]);

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
            $properties = Property::where('season_id', $seasonId)->with('field')->get();

            $formattedFields = $properties->map(function($property) {
                $field = $property->field;
                return [
                    'id' => $field->id,
                    'name' => $field->name,
                    'coordinates' => json_decode($field->coordinates, true),
                    'field_type' => $property->field_type,
                    'color' => $field->color,
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
