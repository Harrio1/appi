<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Field;
use App\Models\Property;
use App\Models\SeedColor;
use App\Models\Season;
use App\Models\Seed;
use Illuminate\Support\Facades\Log;

class FieldController extends Controller
{
    public function index($seasonName = null)
    {
        try {
            $query = Field::query();

            if ($seasonName) {
                $season = Season::where('name', $seasonName)->first();
                if ($season) {
                    $query->where('season_id', $season->id);
                } else {
                    return response()->json(['error' => 'Сезон не найден'], 404);
                }
            }

            $polygonsData = $query->get();

            $formattedPolygons = $polygonsData->map(function($polygon) {
                $coordinates = json_decode($polygon->coordinates, true);

                return [
                    'id' => $polygon->id,
                    'coordinates' => $coordinates,
                    'color' => $polygon->color,
                    'name' => $polygon->name,
                    'field_type' => $polygon->field_type
                ];
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

            $coordinates = array_filter($validatedData['coordinates'], function($coord) {
                return $coord[0] !== 0 && $coord[1] !== 0;
            });

            if (empty($coordinates)) {
                return response()->json(['success' => false, 'error' => 'Некорректные координаты'], 400);
            }

            $field = new Field();
            $field->coordinates = json_encode($coordinates);
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
        try {
            $validatedData = $request->validate([
                'coordinates' => 'required|array',
                'name' => 'required|string|max:255|unique:fields,name',
                'area' => 'required|numeric|min:0',
                'season_id' => 'nullable|exists:seasons,id'
            ]);

            // Отбрасываем дробную часть без округления
            $area = (int)$validatedData['area'];

            // Проверяем, что число не превышает 9 цифр
            if ($area > 999999999) {
                return response()->json([
                    'success' => false,
                    'error' => 'Площадь не может превышать 999,999,999'
                ], 400);
            }

            $field = Field::create([
                'name' => $validatedData['name'],
                'coordinates' => json_encode($validatedData['coordinates']),
                'area' => $area,
                'season_id' => $validatedData['season_id'] ?? null
            ]);

            return response()->json([
                'success' => true,
                'id' => $field->id,
                'name' => $field->name
            ]);
        } catch (\Exception $e) {
            Log::error('Ошибка при создании поля: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
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
            'season_name' => 'required|string|exists:seasons,name',
            'field_type' => 'required|string',
            'seed_color' => 'required|string'
        ]);

        try {
            Log::info('Полученные данные:', $validatedData);

            $season = Season::where('name', $validatedData['season_name'])->first();

            if (!$season) {
                return response()->json(['success' => false, 'error' => 'Сезон не найден'], 404);
            }

            $seed = Seed::firstOrCreate(['name' => $validatedData['field_type']]);

            $seedColor = SeedColor::firstOrCreate(
                ['seed_id' => $seed->id, 'color' => $validatedData['seed_color']]
            );

            Property::create([
                'field_id' => $validatedData['field_id'],
                'season_id' => $season->id,
                'field_type' => $validatedData['field_type'],
                'seed_color' => $validatedData['seed_color']
            ]);

            return response()->json(['success' => true, 'color' => $seedColor->color]);
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
                    'area' => $polygon->area
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
