<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\Api\AuthController;

// Rutas existentes...
// Ruta de prueba básica
Route::get('/', function () {
    return response()->json(['message' => 'API funcionando correctamente']);
});
// Ruta de verificación
Route::get('/check', function () {
    return response()->json(['status' => 'API is working']);
});
// Rutas de autenticación
Route::prefix('auth')->group(function () {
    Route::get('/test', [AuthController::class, 'test']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

// Rutas para TestController
Route::apiResource('tests', TestController::class);
/*
Route::get('/example', function () {
    return response()->json([
        'message' => 'Hello from Laravel!',
        'status' => 'success'
    ]);
});
Route::get('/', function () {
    return response()->json([
        'message' => 'Hello from Laravel!',
        'status' => 'success'
    ]);
});

Route::get('/test', function () {
    return response()->json([
        'message' => 'Hello from Laravel!',
        'status' => 'success'
    ]);
});

Route::get('/test', [TestController::class, 'index']);

Route::get('/test', function () {
    return response()->json(['message' => '¡CORS funciona!']);
});
// Ruta para el registro de usuarios
Route::prefix('auth')->group(function () {
    Route::get('test', [AuthController::class, 'test']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
});
*/