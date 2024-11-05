<?php

namespace App\Http\Controllers;

use App\Models\Seed;
use Illuminate\Http\Request;

class SeedController extends Controller
{
    public function index()
    {
        try {
            $seeds = Seed::all();
            return response()->json($seeds);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Ошибка при получении данных'], 500);
        }
    }
} 