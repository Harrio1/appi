<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Field;
use Illuminate\Support\Facades\Log;

class FieldController extends Controller
{
    public function index()
    {
        // Предположим, что вы хотите вернуть все полигоны
        $polygonsData = Field::all();

        // Преобразование данных в нужный формат
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
                'coordinates' => array_filter($coordinates), // Убедитесь, что фильтруете null значения
                'color' => $polygon->color,
                'name' => $polygon->name
            ];
        })->filter(function($polygon) {
            return !empty($polygon['coordinates']);
        });

        Log::info('Отформатированные полигоны:', $formattedPolygons->toArray());

        // Возвращаем данные в формате JSON
        return response()->json($formattedPolygons);
    }

    // public function create(Request $request)
    // {
    //     // Обработка данных, полученных от клиента
    //     return response()->json(['message' => 'Data saved successfully']);
    // }

    public function storeField(Request $request)
    {
        try {
            // Логирование входящих данных
            Log::info('Входящие данные:', $request->all());

            $validatedData = $request->validate([
                'coordinates' => 'required|array',
                'color' => 'required|string',
                'name' => 'required|string',
            ]);

            $field = new Field();
            $field->coordinates = json_encode($validatedData['coordinates']);
            $field->color = $validatedData['color'];
            $field->name = $validatedData['name'];
            $field->save();

            // Логирование успешного сохранения
            Log::info('Полигон успешно сохранен с id: ' . $field->id);

            return response()->json(['success' => true, 'id' => $field->id, 'name' => $field->name]);
        } catch (\Exception $e) {
            // Логирование ошибки
            Log::error('Ошибка при сохранении поля: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
