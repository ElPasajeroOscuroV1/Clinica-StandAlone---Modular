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
use App\Http\Controllers\Api\MedicalAttentionController;
use App\Http\Controllers\Api\MedicalHistoryController;

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
    Route::apiResource('tests', TestController::class);
    Route::apiResource('appointments', AppointmentController::class);
    Route::apiResource('doctors', DoctorController::class);
    Route::apiResource('patients', PatientController::class);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('treatments', TreatmentController::class);
    Route::apiResource('medical-attentions', MedicalAttentionController::class);
    Route::apiResource('medical-histories', MedicalHistoryController::class);

    // Rutas personalizadas
    Route::get('patients/{patient}/medical-history', [PatientController::class, 'getPatientMedicalHistory']);
    Route::put('patients/{patient}/medical-history', [PatientController::class, 'updatePatientMedicalHistory']);
    Route::get('patients/{patient}/appointments', [AppointmentController::class, 'indexByPatient']);
    Route::get('/doctors', [DoctorController::class, 'index']); // Opcional, considera eliminar si usas apiResource
    Route::put('patients/{patient}/medical-history/{id}', [MedicalHistoryController::class, 'update']);
    Route::post('patients/{patient}/medical-history', [MedicalHistoryController::class, 'store']);
    Route::get('patients/{patientId}/medical-histories', [MedicalHistoryController::class, 'getByPatient']);
    Route::post('patients/{patientId}/medical-history', [MedicalHistoryController::class, 'store']);
    // Rutas para MedicalHistory
    Route::get('/medical-histories', [MedicalHistoryController::class, 'index']);
    Route::post('/medical-histories', [MedicalHistoryController::class, 'store']);
    Route::put('/medical-histories/{id}', [MedicalHistoryController::class, 'update']);
    Route::delete('/medical-histories/{id}', [MedicalHistoryController::class, 'destroy']);
    Route::get('/patients/{patient}/medical-histories', [MedicalHistoryController::class, 'getByPatient']);
    Route::get('/medical-histories/by-attention/{medicalAttentionId}', [MedicalHistoryController::class, 'getByMedicalAttentionId']);
    // Rutas para Doctor
    //Route::get('/doctor/patients', [DoctorController::class, 'patientsByDoctor']);
    Route::get('/doctor/patients', [DoctorController::class, 'getPatientsByDoctor']);
    Route::get('/doctor/patients/{patient}/appointments', [DoctorController::class, 'appointmentsByDoctorPatient']);

});

// END POINTS MOVIL
//Route::prefix('mobile')->group(function () {
//    Route::post('/verify-patient', [MobileController::class, 'verifyPatient']);
//    Route::post('/queue-ticket', [MobileController::class, 'generateQueueTicket']);
//});