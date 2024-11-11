<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\SeedColor;
use App\Models\Season;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PropertyController extends Controller
{
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'field_id' => 'required|exists:fields,id', 
            'season_name' => 'required|string|exists:seasons,name',
            'field_type' => 'required|string'
        ]);

        try {
            $season = Season::where('name', $validatedData['season_name'])->first();

            if (!$season) {
                return response()->json(['success' => false, 'error' => 'Сезон не найден'], 404);
            }

            $seedColor = SeedColor::whereHas('seed', function ($query) use ($validatedData) {
                $query->where('name', $validatedData['field_type']);
            })->first();

            if (!$seedColor) {
                return response()->json(['success' => false, 'error' => 'Цвет для выбранной культуры не найден'], 404)
                                 ->header('Content-Type', 'application/json; charset=UTF-8');
            }

            Property::create([
                'field_id' => $validatedData['field_id'],
                'season_id' => $season->id,
                'field_type' => $validatedData['field_type']
            ]);

            return response()->json(['success' => true, 'color' => $seedColor->color]);
        } catch (\Exception $e) {
            Log::error('Ошибка при сохранении данных: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function index()
    {
        try {
            $properties = Property::all();
            return response()->json($properties);
        } catch (\Exception $e) {
            Log::error('Ошибка при получении свойств: ' . $e->getMessage());
            return response()->json(['error' => 'Ошибка при получении данных'], 500);
        }
    }
} 