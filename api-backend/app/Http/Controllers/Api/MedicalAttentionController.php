<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MedicalAttention;
use App\Models\Appointment;
use App\Models\MedicalHistory;

class MedicalAttentionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Obtener el doctor_id del usuario logueado (asumiendo relación en User)
        $doctorId = $request->user()->doctor_id ?? null;

        $query = MedicalAttention::with(['patient', 'appointment', 'treatments', 'medicalHistory']);

        // Si hay doctor_id, filtramos solo las atenciones de ese doctor
        if ($doctorId) {
            $query->whereHas('appointment', function ($q) use ($doctorId) {
                $q->where('doctor_id', $doctorId);
            });
        }

        // Traer todo, incluyendo las relaciones cargadas
        return $query->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_id' => 'required|exists:appointments,id',
            'treatment_ids' => 'required|array',
            'treatment_ids.*' => 'exists:treatments,id',
            'diagnosis' => 'nullable|string',
            'other_treatments' => 'nullable|array',
            'other_treatments.*.name' => 'required_with:other_treatments|string',
            'other_treatments.*.price' => 'required_with:other_treatments|numeric',
            //'pre_enrollment' => 'boolean',
            'pre_enrollment' => 'nullable|string',
        ]);

        $appointment = Appointment::find($validated['appointment_id']);
        $consultationReason = $appointment->reason ?? ($validated['diagnosis'] ?? 'Consulta médica');


        //$attention = MedicalAttention::create($validated);
        $attention = MedicalAttention::create([
            'patient_id' => $validated['patient_id'],
            'appointment_id' => $validated['appointment_id'],
            'diagnosis' => $validated['diagnosis'] ?? null,
            'other_treatments' => $validated['other_treatments'] ?? [],
            //'pre_enrollment' => $validated['pre_enrollment'] ?? false,
            'pre_enrollment' => $validated['pre_enrollment'] ?? null,
        ]);

        $attention->treatments()->attach($validated['treatment_ids']);

        // 1. Recargar la relación 'treatments' en el modelo $attention.
        $attention->load('treatments');

        // 2. Ahora, el cálculo del costo total funcionará correctamente.
        //$totalCost = $attention->treatments->sum('precio');
        $totalCost = $attention->treatments->sum('precio') +
             collect($validated['other_treatments'] ?? [])->sum('price');

        $attention->update(['total_cost' => $totalCost]);

        // Update the appointment status to 'attended'
        \App\Models\Appointment::where('id', $attention->appointment_id)->update(['status' => 'attended']);

        // Guardar en historial con datos sincronizados
        MedicalHistory::create([
            'patient_id' => $attention->patient_id,
            'medical_attention_id' => $attention->id,
            'consultation_reason' => $consultationReason,
            'diagnosis' => $validated['diagnosis'] ?? '',
            'pre_enrollment' => $validated['pre_enrollment'] ?? '',
            'other_treatments' => $validated['other_treatments'] ?? [],
            'treatments_performed' => $attention->treatments->pluck('nombre')->toArray(),
            'details' => 'Atención médica registrada con tratamientos: ' . implode(', ', $attention->treatments->pluck('nombre')->toArray()),
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
                'diagnosis' => 'nullable|string',
                'other_treatments' => 'nullable|array',
                'other_treatments.*.name' => 'required_with:other_treatments|string',
                'other_treatments.*.price' => 'required_with:other_treatments|numeric',
                //'pre_enrollment' => 'boolean',
                'pre_enrollment' => 'nullable|string',
            ]);

            // Actualizar los campos básicos
            $attention->update([
                'patient_id' => $validated['patient_id'],
                'appointment_id' => $validated['appointment_id'],
                'diagnosis' => $validated['diagnosis'] ?? null,
                'other_treatments' => $validated['other_treatments'] ?? [],
                //'pre_enrollment' => $validated['pre_enrollment'] ?? false,
                'pre_enrollment' => $validated['pre_enrollment'] ?? null,
            ]);

            // Sincronizar tratamientos (reemplaza los existentes)
            $attention->treatments()->sync($validated['treatment_ids']);

            // Cargar la relación treatments para calcular el costo
            $attention->load('treatments');

            // Recalcular costo total (asumiendo que 'cost' o 'precio' existe en Treatment)
            //$totalCost = $attention->treatments->sum('precio'); // Cambié 'cost' a 'precio' basado en tus datos de tratamientos
            $totalCost = $attention->treatments->sum('precio') +
                collect($validated['other_treatments'] ?? [])->sum('price');
            $attention->update(['total_cost' => $totalCost]);

            // Actualizar historial médico con datos sincronizados
            $attention->medicalHistory()->updateOrCreate(
                ['medical_attention_id' => $attention->id],
                [
                    'patient_id' => $attention->patient_id,
                    'diagnosis' => $validated['diagnosis'] ?? '',
                    'pre_enrollment' => $validated['pre_enrollment'] ?? '',
                    'other_treatments' => $validated['other_treatments'] ?? [],
                    'treatments_performed' => $attention->treatments->pluck('nombre')->toArray(),
                    'details' => 'Atención médica actualizada con tratamientos: ' . implode(', ', $attention->treatments->pluck('nombre')->toArray())
                ]
            );

            // Update the appointment status to 'attended'
            \App\Models\Appointment::where('id', $validated['appointment_id'])->update(['status' => 'attended']);

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
    /*
    public function getByAppointment(Request $request)
    {
        $appointmentId = $request->query('appointment_id');

        if (!$appointmentId) {
            return response()->json(['error' => 'appointment_id es requerido'], 400);
        }

        $medicalAttention = MedicalAttention::with(['treatments'])
            ->where('appointment_id', $appointmentId)
            ->first();

        if (!$medicalAttention) {
            return response()->json([
                'error' => 'No se encontró atención médica para esta cita',
                'other_treatments' => [],
            ], 404);
        }

        $medicalAttention->other_treatments = $medicalAttention->other_treatments ?? [];


        return response()->json($medicalAttention);
    }
    */
    public function getByAppointment($appointmentId)
    {
        // Fetch the medical attention, eager loading only 'treatments'
        $attention = MedicalAttention::with(['treatments'])
            ->where('appointment_id', $appointmentId)
            ->first();

        if (!$attention) {
            // If no medical attention is found, return a 404 with a message and an empty other_treatments array
            return response()->json([
                'message' => 'No se encontró atención médica para esta cita',
                'other_treatments' => [],
            ], 404);
        }

        // Ensure other_treatments is always an array, even if null in the database
        $attention->other_treatments = $attention->other_treatments ?? [];

        // Return the attention object with treatments and other_treatments
        return response()->json($attention);
    }

}
