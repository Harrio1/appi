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
            'seeds' => 'required|array', // Убедитесь, что это поле указано как обязательное
        ]);

        // Логика для создания нового сезона
    }
}
