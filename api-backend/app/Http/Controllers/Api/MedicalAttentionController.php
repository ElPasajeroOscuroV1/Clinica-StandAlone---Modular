<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MedicalAttention;
use App\Models\MedicalHistory;

class MedicalAttentionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        return MedicalAttention::with(['patient', 'appointment', 'treatments'])->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_id' => 'required|exists:appointments,id',
            'treatment_ids' => 'required|array',
            'treatment_ids.*' => 'exists:treatments,id',
        ]);

        $attention = MedicalAttention::create($validated);
        $attention->treatments()->attach($validated['treatment_ids']);

        // Calcular costo total
        $totalCost = $attention->treatments->sum('cost');
        $attention->update(['total_cost' => $totalCost]);

        // Guardar en historial
        MedicalHistory::create([
            'patient_id' => $attention->patient_id,
            'medical_attention_id' => $attention->id,
            'details' => 'Atención médica registrada con tratamientos: ' . implode(', ', $attention->treatments->pluck('name')->toArray()),
        ]);

        return response()->json($attention->load(['treatments']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
        $attention = MedicalAttention::with(['patient', 'appointment', 'treatments'])->findOrFail($id);
        return response()->json($attention);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $attention = MedicalAttention::findOrFail($id);

            $validated = $request->validate([
                'patient_id' => 'required|exists:patients,id',
                'appointment_id' => 'required|exists:appointments,id',
                'treatment_ids' => 'required|array|min:1', // Asegura al menos un tratamiento
                'treatment_ids.*' => 'exists:treatments,id',
            ]);

            // Actualizar los campos básicos
            $attention->update([
                'patient_id' => $validated['patient_id'],
                'appointment_id' => $validated['appointment_id'],
            ]);

            // Sincronizar tratamientos (reemplaza los existentes)
            $attention->treatments()->sync($validated['treatment_ids']);

            // Cargar la relación treatments para calcular el costo
            $attention->load('treatments');

            // Recalcular costo total (asumiendo que 'cost' o 'precio' existe en Treatment)
            $totalCost = $attention->treatments->sum('precio'); // Cambié 'cost' a 'precio' basado en tus datos de tratamientos
            $attention->update(['total_cost' => $totalCost]);

            // Actualizar historial médico
            $attention->medicalHistory()->updateOrCreate(
                ['medical_attention_id' => $attention->id],
                [
                    'patient_id' => $attention->patient_id,
                    'details' => 'Atención médica actualizada con tratamientos: ' . implode(', ', $attention->treatments->pluck('nombre')->toArray())
                ]
            );

            // Devolver con relaciones cargadas
            return response()->json($attention->load(['patient', 'appointment', 'treatments']));

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Error de validación', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error al actualizar atención médica ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
        $attention = MedicalAttention::findOrFail($id);
        $attention->treatments()->detach();
        $attention->medicalHistory()->delete();
        $attention->delete();

        return response()->json(null, 204);
    }
}
