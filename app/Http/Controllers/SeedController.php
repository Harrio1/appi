<?php

namespace App\Http\Controllers;

use App\Models\Seed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SeedController extends Controller
{
    public function index()
    {
        try {
            $seeds = Seed::all();
            return response()->json($seeds);
        } catch (\Exception $e) {
            Log::error('Ошибка при получении данных:', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Ошибка при получении данных'], 500);
        }
    }
} 