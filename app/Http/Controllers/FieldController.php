<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Field;
use App\Models\Property;
use Illuminate\Support\Facades\Log;

class FieldController extends Controller
{
    public function index($seasonId = null)
    {
        try {
            $query = Field::query();

            if ($seasonId) {
                $query->where('season_id', $seasonId);
            }

            $polygonsData = $query->get();

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

    public function storeField(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'coordinates' => 'required|array',
                'name' => 'required|string|unique:fields,name',
                'area' => 'required|numeric'
            ]);

            $field = new Field();
            $field->coordinates = json_encode($validatedData['coordinates']);
            $field->name = $validatedData['name'];
            $field->area = $validatedData['area'];
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

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'coordinates' => 'required|string',
            'area' => 'required|numeric|min:0',
            'season_id' => 'required|exists:seasons,id'
        ]);

        $field = Field::create($validatedData);

        Property::create([
            'field_id' => $field->id,
            'season_id' => $validatedData['season_id']
        ]);

        return response()->json(['success' => true, 'field' => $field]);
    }

    public function update(Request $request, $id)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'coordinates' => 'required|string',
            'area' => 'required|numeric|min:0'
        ]);

        $field = Field::findOrFail($id);
        $field->update($validatedData);

        return response()->json(['success' => true, 'field' => $field]);
    }

    public function destroy($id)
    {
        $field = Field::findOrFail($id);
        $field->delete();

        return response()->json(['success' => true]);
    }

    public function storeProperty(Request $request)
    {
        $validatedData = $request->validate([
            'field_id' => 'required|exists:fields,id',
            'season' => 'required|string',
            'field_type' => 'required|string'
        ]);

        try {
            Property::create([
                'field_id' => $validatedData['field_id'],
                'season_id' => $validatedData['season'], // Assuming season is stored as a string
                'field_type' => $validatedData['field_type']
            ]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Ошибка при сохранении данных: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function getPolygonsByName(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string'
        ]);

        try {
            $polygons = Field::where('name', $validatedData['name'])->get();

            $formattedPolygons = $polygons->map(function($polygon) {
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
            Log::error('Ошибка при получении полигонов по названию: ' . $e->getMessage());
            return response()->json(['error' => 'Ошибка при получении данных'], 500);
        }
    }
}
