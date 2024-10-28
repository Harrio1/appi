<?php

namespace App\Http\Controllers;

use App\Models\Season;
use App\Models\SeasonPolygonSeed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SeasonController extends Controller
{
    public function index()
    {
        try {
            $seasons = Season::with('polygonSeeds')->get();
            return response()->json($seasons);
        } catch (\Exception $e) {
            Log::error('Ошибка при загрузке сезонов: ' . $e->getMessage());
            return response()->json(['error' => 'Ошибка при загрузке сезонов'], 500);
        }
    }

    public function createNewSeason(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'seeds' => 'nullable|array' // Валидация для семян
            ]);

            Log::info('Validated data:', $validatedData);

            $season = Season::create([
                'name' => $validatedData['name']
            ]);

            if (!empty($validatedData['seeds'])) {
                foreach ($validatedData['seeds'] as $polygonId => $seedType) {
                    SeasonPolygonSeed::create([
                        'season_id' => $season->id,
                        'polygon_id' => $polygonId,
                        'seed_type' => $seedType
                    ]);
                }
            }

            Log::info('Сезон успешно создан:', $season);

            return response()->json($season);
        } catch (\Exception $e) {
            Log::error('Ошибка при создании сезона: ' . $e->getMessage());
            return response()->json(['error' => 'Ошибка при создании сезона'], 500);
        }
    }
}
