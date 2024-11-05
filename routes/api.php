<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FieldController;
use App\Http\Controllers\SeasonController;
use App\Http\Controllers\SeedController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/seasons', [SeasonController::class, 'index']);
Route::post('/seasons', [SeasonController::class, 'createNewSeason']);

Route::get('/seasons/{season}/fields', [FieldController::class, 'index']);
Route::post('/seasons/{season}/fields', [FieldController::class, 'storeField']);

Route::put('/fields/{field}', [FieldController::class, 'updateFieldType']);
Route::put('/fields/{id}', [FieldController::class, 'update']);
Route::delete('/fields/{id}', [FieldController::class, 'destroy']);

Route::get('/seeds', [SeedController::class, 'index']);

Route::get('/fields', [FieldController::class, 'index']);
Route::post('/fields', [FieldController::class, 'storeField']);

Route::post('/properties', [FieldController::class, 'storeProperty']);

Route::post('/fields/by-name', [FieldController::class, 'getPolygonsByName']);

