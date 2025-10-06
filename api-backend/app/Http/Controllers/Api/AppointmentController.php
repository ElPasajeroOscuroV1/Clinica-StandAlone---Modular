<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Patient;
//$patient = \App\Models\Patient::findOrFail($request->patient_id);

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function indexByPatient(Patient $patient)
    {
        try {
            $appointments = $patient->appointments; // Usa la relación definida en el modelo Patient
            return response()->json($appointments);
        } catch (\Exception $e) {
            \Log::error('Error al obtener citas para paciente ' . $patient->id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Error interno'], 500);
        }
    }

    public function index(Request $request)
    {
        $query = Appointment::with('doctor', 'patient'); // Corrección: 'patient' debería estar definido en la relación
        
        // Filtrar por patient_name si se pasa como query param
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        //$appointments = $query->get();
        // Aquí obtenemos las citas y agregamos el nombre del paciente y del doctor
        $appointments = $query->get()->map(function($appointment){
            return [
                'id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'patient_name' => $appointment->patient ? $appointment->patient->name : null,
                'doctor_id' => $appointment->doctor_id,
                'doctor_name' => $appointment->doctor ? $appointment->doctor->name : null,
                'doctor_specialty' => $appointment->doctor ? $appointment->doctor->specialty : null,
                'doctor' => $appointment->doctor ? [
                    'id' => $appointment->doctor->id,
                    'name' => $appointment->doctor->name,
                    'specialty' => $appointment->doctor->specialty,
                    'email' => $appointment->doctor->email,
                    'phone' => $appointment->doctor->phone,
                    'available' => $appointment->doctor->available,
                ] : null,
                'date' => $appointment->date,
                'time' => $appointment->time,
                'reason' => $appointment->reason,
                'payment_status' => $appointment->payment_status,
                'status' => $appointment->status,
                'ci' => $appointment->ci,
            ];
        });
        return response()->json($appointments);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try{
        $validatedData = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            //'patient_name' => 'required|string|max:255',
            //'ci' => 'required|string|max:255',
            'doctor_id' => 'required|exists:doctors,id',
            'date' => 'required|date',
            'time' => 'required',
            //'status' => 'required|string|max:255',
            'reason' => 'required|string|max:255',
            'payment_status' => 'sometimes|in:Pendiente,Pagado,Cancelado',
        ]);

        //$validatedData['patient_name'] = $patient->name;
        // Buscar el paciente y poblar los campos derivados
        //$patient = \App\Models\Patient::findOrFail($request->patient_id);
        // Obtener datos del paciente para poblar automáticamente la columna 'ci'
        $patient = \App\Models\Patient::findOrFail($validatedData['patient_id']);

        //$validatedData['patient_name'] = $patient->name;
        $validatedData['ci'] = $patient->ci;

        $appointment = Appointment::create($validatedData);

        return response()->json($appointment->load(['patient', 'doctor']), 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $appointment = Appointment::with(['patient', 'doctor'])->find($id);

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        return response()->json($appointment);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        $validatedData = $request->validate([
            //'patient_name' => 'sometimes|string|max:255',
            //'ci' => 'sometimes|string|max:255',
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'sometimes|exists:doctors,id',
            'date' => 'sometimes|date',
            'time' => 'sometimes',
            //'status' => 'sometimes|string|max:255',
            'reason' => 'sometimes|string|max:255',
            'payment_status' => 'sometimes|in:Pendiente,Pagado,Cancelado',
        ]);
        // Si viene patient_id en el request, actualizamos también el nombre y ci
        if ($request->has('patient_id')) {
            $patient = \App\Models\Patient::findOrFail($request->patient_id);
            $validatedData['patient_name'] = $patient->name;
            $validatedData['ci'] = $patient->ci;
        }

        $appointment->update($validatedData);

        return response()->json($appointment->load(['patient', 'doctor']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        $appointment->delete();

        return response()->json(['message' => 'Appointment deleted successfully']);
    }

    public function getAppointmentsByPatient($patientId)
    {
        $appointments = Appointment::with('doctor')
            ->where('patient_id', $patientId)
            ->get()
            ->map(function($appointment){
                return [
                    'id' => $appointment->id,
                    'date' => $appointment->date,
                    'time' => $appointment->time,
                    'doctor_id' => $appointment->doctor_id,
                    'doctor_name' => $appointment->doctor ? $appointment->doctor->name : null,
                    'doctor_specialty' => $appointment->doctor ? $appointment->doctor->specialty : null,
                    'status' => $appointment->status,
                    'payment_status' => $appointment->payment_status,
                ];
            });

        return response()->json($appointments);
    }

    public function appointmentsByDoctorPatient(Request $request, $patientId)
    {
        $doctorId = $request->user()->doctor_id;

        $appointments = Appointment::with('doctor')
            ->where('patient_id', $patientId)
            ->where('doctor_id', $doctorId)
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhere('status', '!=', 'attended');
            })
            ->orderBy('date')
            ->orderBy('time')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'date' => $appointment->date,
                    'time' => $appointment->time,
                    'doctor_id' => $appointment->doctor_id,
                    'doctor_name' => $appointment->doctor ? $appointment->doctor->name : null,
                    'doctor_specialty' => $appointment->doctor ? $appointment->doctor->specialty : null,
                    'status' => $appointment->status,
                    'payment_status' => $appointment->payment_status,
                ];
            });

        return response()->json($appointments);
    }

}
