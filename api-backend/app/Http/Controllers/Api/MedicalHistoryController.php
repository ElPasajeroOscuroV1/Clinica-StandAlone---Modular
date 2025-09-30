<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MedicalHistoryController extends Controller
{
    public function index()
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'No autorizado'], 401);
            }

            $user = Auth::user();

            if ($user->role === 'doctor') {
                $doctorId = $user->doctor->id;

                // Obtener historias médicas a través de las atenciones médicas del doctor
                $histories = MedicalHistory::whereHas('medicalAttention.appointment', function ($query) use ($doctorId) {
                    $query->where('doctor_id', $doctorId);
                })->with(['patient', 'medicalAttention.appointment.doctor'])->get();

            } else {
                // Para otros roles (admin, etc.), obtener todos los historiales
                $histories = MedicalHistory::with(['patient', 'medicalAttention.appointment.doctor'])->get();
            }

            return response()->json(['data' => $histories], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener historiales', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request, $patientId)
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|exists:patients,id|in:' . $patientId, // Valida que coincida con la URL
                'consultation_reason' => 'required|string',
                'allergies' => 'nullable|string',
                'medical_background' => 'nullable|string',
                'dental_background' => 'nullable|string',
                'extraoral_exam' => 'nullable|string',
                'intraoral_exam' => 'nullable|string',
                'odontogram' => 'nullable|string',
                'treatments_performed' => 'nullable|array', // Permitir array
                'current_medications' => 'nullable|string',
                'relevant_oral_habits' => 'nullable|string',
                'medical_attention_id' => 'nullable|exists:medical_attentions,id',
                'details' => 'nullable|string',
                'diagnosis' => 'nullable|string', // Añadido para consistencia
                'pre_enrollment' => 'nullable|string', // Añadido para consistencia
                'other_treatments' => 'nullable|array', // Añadido para consistencia
                'other_treatments.*.name' => 'required_with:other_treatments|string',
                'other_treatments.*.price' => 'required_with:other_treatments|numeric',
            ]);

            $validated['created_at'] = now();
            $validated['updated_at'] = now();

            // Convertir treatments_performed a string si es array
            if (is_array($validated['treatments_performed'])) {
                $validated['treatments_performed'] = implode(',', $validated['treatments_performed']);
            }

            $history = MedicalHistory::create($validated);
            return response()->json(['data' => $history->load(['patient', 'medicalAttention'])], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Error de validación', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al crear historial', 'error' => $e->getMessage()], 500);
        }
    }

    public function getByPatient($patientId)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'No autorizado'], 401);
            }

            $histories = MedicalHistory::where('patient_id', $patientId)
                ->with(['patient', 'medicalAttention'])
                ->orderBy('created_at', 'desc')
                ->get();

            if ($histories->isEmpty()) {
                return response()->json(['message' => 'No se encontraron historiales para este paciente'], 404);
            }

            return response()->json(['data' => $histories], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener historiales', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'No autorizado'], 401);
            }

            $history = MedicalHistory::findOrFail($id);

            $validated = $request->validate([
                'patient_id' => 'required|exists:patients,id',
                'consultation_reason' => 'required|string',
                'allergies' => 'nullable|string',
                'medical_background' => 'nullable|string',
                'dental_background' => 'nullable|string',
                'extraoral_exam' => 'nullable|string',
                'intraoral_exam' => 'nullable|string',
                'odontogram' => 'nullable|string',
                'treatments_performed' => 'nullable|array', // Permitir array
                'current_medications' => 'nullable|string',
                'relevant_oral_habits' => 'nullable|string',
                'medical_attention_id' => 'nullable|exists:medical_attentions,id',
                'details' => 'nullable|string',
                'diagnosis' => 'nullable|string', // Añadido
                'pre_enrollment' => 'nullable|string', // Añadido
                'other_treatments' => 'nullable|array', // Añadido
                'other_treatments.*.name' => 'required_with:other_treatments|string',
                'other_treatments.*.price' => 'required_with:other_treatments|numeric',
            ]);

            // Convertir treatments_performed a string si es array
            if (is_array($validated['treatments_performed'])) {
                $validated['treatments_performed'] = implode(',', $validated['treatments_performed']);
            }

            $validated['updated_at'] = now();
            $history->update($validated);

            return response()->json(['data' => $history->load(['patient', 'medicalAttention'])], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Error de validación', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al actualizar historial', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'No autorizado'], 401);
            }

            $history = MedicalHistory::findOrFail($id);
            $history->delete();

            return response()->json(['message' => 'Historial eliminado'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al eliminar historial', 'error' => $e->getMessage()], 500);
        }
    }

    public function getByMedicalAttentionId($medicalAttentionId)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'No autorizado'], 401);
            }

            $history = MedicalHistory::where('medical_attention_id', $medicalAttentionId)
                ->with(['patient', 'medicalAttention'])
                ->first();

            if (!$history) {
                return response()->json(['message' => 'No se encontró historial para esta atención médica'], 404);
            }

            return response()->json(['data' => $history], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener historial', 'error' => $e->getMessage()], 500);
        }
    }
}
