<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\PatientController;
// Rutas existentes...
// Ruta de prueba básica
Route::get('/', function () {
    return response()->json(['message' => 'API funcionando correctamente']);
});
// Ruta de verificación
Route::get('/check', function () {
    return response()->json(['status' => 'API is working']);
});

// Rutas para TestController
Route::apiResource('tests', TestController::class);

// Rutas de autenticación
Route::prefix('auth')->group(function () {
    Route::get('/test', [AuthController::class, 'test']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

//Route::post('/appointment', [AppointmentController::class, 'store']);
/* ES ESTA RUTA LA QUE USA http://localhost:4200/appointment */

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('appointments', AppointmentController::class);
    Route::apiResource('doctors', DoctorController::class);
    Route::apiResource('patients', PatientController::class);
    Route::get('patients/{patient}/medical-history', [PatientController::class, 'getPatientMedicalHistory']);
    Route::put('patients/{patient}/medical-history', [PatientController::class, 'updatePatientMedicalHistory']);
});

// END POINTS MOVIL
Route::prefix('mobile')->group(function () {
    Route::post('/verify-patient', [MobileController::class, 'verifyPatient']);
    Route::post('/queue-ticket', [MobileController::class, 'generateQueueTicket']);
});

/*
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('patients', PatientController::class);
});
*/
/*
Route::post('/patients', [PatientController::class, 'store']);
Route::get('/patients', function () {
    return ['message' => 'Ruta GET funcionando'];
});
*/
/* **
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('patients', PatientController::class);
    // Rutas personalizadas para el historial médico
    Route::get('patients/{patient}/medical-history', [PatientController::class, 'getPatientMedicalHistory']);
    Route::put('patients/{patient}/medical-history', [PatientController::class, 'updatePatientMedicalHistory']);
});
* **/
// END POINTS MOVIL
//ruta x que no es necesaria al parecer
//Route::post('/appointments', [AppointmentController::class, 'store'])->middleware('auth:sanctum');
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