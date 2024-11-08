<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\SeedColor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PropertyController extends Controller
{
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'field_id' => 'required|exists:fields,id',
            'season_id' => 'required|exists:seasons,id',
            'field_type' => 'required|string'
        ]);

        try {
            $seedColor = SeedColor::whereHas('seed', function ($query) use ($validatedData) {
                $query->where('name', $validatedData['field_type']);
            })->first();

            if (!$seedColor) {
                return response()->json(['success' => false, 'error' => 'Цвет для выбранной культуры не найден'], 404);
            }

            Property::create([
                'field_id' => $validatedData['field_id'],
                'season_id' => $validatedData['season_id'],
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