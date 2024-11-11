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
}
