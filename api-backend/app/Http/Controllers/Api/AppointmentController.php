<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Appointment;

class AppointmentController extends Controller
{
    public function index()
    {
        try {
            $appointments = Appointment::with('doctor')->get();
            return response()->json($appointments);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error fetching appointments'], 500);
        }
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'patient_name' => 'required|string',
            'ci' => 'required|integer', // Cambiado a integer
            'doctor_id' => 'required|exists:doctors,id',
            'date' => 'required|date',
            'time' => 'required',
            'reason' => 'required|string',
            'payment_status' => 'nullable|string|max:255'
        ]);

        $appointment = Appointment::create($validatedData);

        return response()->json($appointment->load('doctor'), 201);
    }

    public function show(Appointment $appointment)
    {
        return $appointment;
    }

    public function update(Request $request, Appointment $appointment)
    {
        $validatedData = $request->validate([
            'patient_name' => 'required|string',
            'ci' => 'required|integer', // Cambiado a integer
            'doctor_id' => 'required|exists:doctors,id',
            'date' => 'required|date',
            'time' => 'required',
            'reason' => 'required|string',
            'payment_status' => 'nullable|string|max:255'
        ]);

        $appointment->update($validatedData); 
        $appointment->load('doctor');
        return response()->json($appointment);
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return response()->json(null, 204);
    }
}
