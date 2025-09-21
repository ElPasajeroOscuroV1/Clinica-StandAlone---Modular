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

            $histories = MedicalHistory::with(['patient', 'medicalAttention'])->get();
            return response()->json(['data' => $histories], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener historiales', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|exists:patients,id',
                'consultation_reason' => 'required|string',
                'allergies' => 'nullable|string',
                'medical_background' => 'nullable|string',
                'dental_background' => 'nullable|string',
                'extraoral_exam' => 'nullable|string',
                'intraoral_exam' => 'nullable|string',
                'odontogram' => 'nullable|string',
                'treatments_performed' => 'nullable|string',
                'current_medications' => 'nullable|string',
                'relevant_oral_habits' => 'nullable|string',
                'medical_attention_id' => 'nullable|exists:medical_attentions,id',
                'details' => 'nullable|string',
            ]);

            $validated['created_at'] = now();
            $validated['updated_at'] = now();

            $history = MedicalHistory::create($validated);
            return response()->json(['data' => $history], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al crear historial', 'error' => $e->getMessage()], 500);
        }
    }

    public function getByPatient($patientId)
    {
        try {
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
                'treatments_performed' => 'nullable|string',
                'current_medications' => 'nullable|string',
                'relevant_oral_habits' => 'nullable|string',
                'medical_attention_id' => 'nullable|exists:medical_attentions,id',
                'details' => 'nullable|string',
            ]);

            $validated['updated_at'] = now();
            $history->update($validated);

            return response()->json(['data' => $history], 200);
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
}