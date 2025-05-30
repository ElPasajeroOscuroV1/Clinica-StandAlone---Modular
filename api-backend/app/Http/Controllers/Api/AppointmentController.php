<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Appointment;

class AppointmentController extends Controller
{
    public function index()
    {
        //
        //return Appointment::all();
        try {
            $appointments = Appointment::all();
            return response()->json($appointments);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error fetching appointments'], 500);
        }
    }

    public function store(Request $request)
    {
        /* VERSION 1
        $validatedData = $request->validate([
            'patient_name' => 'required|string|max:255',
            'doctor' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|string',
            'description' => 'nullable|string'
        ]);

        $appointment = Appointment::create($validatedData);

        return response()->json($appointment, 201);

        */
        // VERSION 2 FUNCIONAL
        $request->validate([
            'patient_name' => 'required|string',
            'doctor' => 'required|string',
            'date' => 'required|date',
            'time' => 'required',
            'reason' => 'required|string'
        ]);

        return Appointment::create($request->all());
    }

    public function show(Appointment $appointment)
    {
        //
        return $appointment;
    }

    public function update(Request $request, Appointment $appointment)
    {
        //
        $request->validate([
            'patient_name' => 'required|string',
            'doctor' => 'required|string',
            'date' => 'required|date',
            'time' => 'required',
            'reason' => 'required|string'
        ]);

        $appointment->update($request->all());
        return $appointment;
    }

    public function destroy(Appointment $appointment)
    {
        //
        $appointment->delete();
        return response()->json(null, 204);
    }
}
