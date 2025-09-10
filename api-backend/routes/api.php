<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\TreatmentController;
use App\Http\Controllers\Api\MedicalAttentionController; // Asegúrate de que este controlador exista
use App\Http\Controllers\Api\MedicalHistoryController;

// Ruta de prueba básica
Route::get('/', function () {
    return response()->json(['message' => 'API funcionando correctamente']);
});

// Rutas de autenticación
Route::prefix('auth')->group(function () {
    Route::get('/test', [AuthController::class, 'test']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

// Rutas protegidas por autenticación
Route::middleware('auth:sanctum')->group(function () {
    // Recursos API
    Route::apiResource('tests', TestController::class);
    Route::apiResource('appointments', AppointmentController::class);
    Route::apiResource('doctors', DoctorController::class);
    Route::apiResource('patients', PatientController::class);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('treatments', TreatmentController::class);
    Route::apiResource('medical-attentions', MedicalAttentionController::class);

    // Rutas personalizadas
    Route::get('patients/{patient}/medical-history', [PatientController::class, 'getPatientMedicalHistory']);
    Route::get('/patients/{id}/appointments', [PatientController::class, 'getAppointments']);
    Route::put('/patients/{id}/medical-history', [PatientController::class, 'updateMedicalHistory']);

    Route::put('patients/{patient}/medical-history', [PatientController::class, 'updatePatientMedicalHistory']);
    Route::get('patients/{patient}/appointments', [AppointmentController::class, 'indexByPatient']);
    Route::get('/doctors', [DoctorController::class, 'index']); // Redundante con apiResource, opcional eliminar

    Route::get('/medical-histories', [MedicalHistoryController::class, 'index']);
    Route::get('/medical-histories', [App\Http\Controllers\Api\MedicalHistoryController::class, 'index']);
    Route::post('patients/{patient}/medical-history', [PatientController::class, 'updateMedicalHistory']);

});

// END POINTS MOVIL (asegúrate de que MobileController exista)
Route::prefix('mobile')->group(function () {
    Route::post('/verify-patient', [MobileController::class, 'verifyPatient']);
    Route::post('/queue-ticket', [MobileController::class, 'generateQueueTicket']);
});