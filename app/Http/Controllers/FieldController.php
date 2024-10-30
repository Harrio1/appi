<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Field;
use Illuminate\Support\Facades\Log;

class FieldController extends Controller
{
    public function index($seasonId = null)
    {
        try {
            $polygonsData = Field::where('season_id', $seasonId)->get();

            $formattedPolygons = $polygonsData->map(function($polygon) {
                $coordinates = array_map(function($coord) {
                    $coords = explode(' ', $coord);
                    if (count($coords) == 2) {
                        return array_map('floatval', $coords);
                    } else {
                        Log::error('Некорректные координаты: ' . $coord);
                        return null;
                    }
                }, explode(',', $polygon->coordinates));

                return [
                    'id' => $polygon->id,
                    'coordinates' => array_filter($coordinates),
                    'color' => $polygon->color,
                    'name' => $polygon->name,
                    'field_type' => $polygon->field_type
                ];
            })->filter(function($polygon) {
                return !empty($polygon['coordinates']);
            });

            return response()->json($formattedPolygons);
        } catch (\Exception $e) {
            Log::error('Ошибка при получении полей: ' . $e->getMessage());
            return response()->json(['error' => 'Ошибка при получении данных'], 500);
        }
    }

    public function storeField(Request $request, $seasonId)
    {
        try {
            $validatedData = $request->validate([
                'coordinates' => 'required|array',
                'color' => 'required|string',
                'name' => 'required|string',
                'field_type' => 'nullable|string'
            ]);

            if (is_null($seasonId)) {
                return response()->json(['success' => false, 'error' => 'Season ID is required'], 400);
            }

            $field = new Field();
            $field->season_id = $seasonId;
            $field->coordinates = json_encode($validatedData['coordinates']);
            $field->color = $validatedData['color'];
            $field->name = $validatedData['name'];
            $field->field_type = $validatedData['field_type'] ?? null;
            $field->save();

            return response()->json(['success' => true, 'id' => $field->id, 'name' => $field->name]);
        } catch (\Exception $e) {
            Log::error('Ошибка при сохранении поля: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function updateFieldType(Request $request, $fieldId)
    {
        try {
            $validatedData = $request->validate([
                'field_type' => 'nullable|string'
            ]);

            $field = Field::findOrFail($fieldId);
            $field->field_type = $validatedData['field_type'];
            $field->save();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Ошибка при обновлении типа поля: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
