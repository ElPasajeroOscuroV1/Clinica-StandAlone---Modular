<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\Patient;
use App\Models\Appointment;

class DoctorController extends Controller
{
    public function index()
    {
        $doctors = Doctor::all();
        return response()->json($doctors);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'specialty' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'phone' => 'required|string|max:20',
            'available' => 'boolean',
            'password' => 'required|string|min:6'
        ]);

        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'role' => 'doctor'
        ]);

        $doctor = Doctor::create([
            'name' => $validatedData['name'],
            'specialty' => $validatedData['specialty'],
            'email' => $validatedData['email'],
            'phone' => $validatedData['phone'],
            'available' => $validatedData['available'] ?? true,
            'user_id' => $user->id
        ]);

        return response()->json([
            'doctor' => $doctor,
            'user' => $user
        ], 201);
    }

    public function show(Doctor $doctor)
    {
        return response()->json($doctor);
    }

    public function update(Request $request, Doctor $doctor)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'specialty' => 'required|string|max:255',
            'email' => 'required|email|unique:doctors,email,' . $doctor->id,
            'phone' => 'required|string|max:20',
            'available' => 'boolean'
        ]);

        $doctor->update($validatedData);
        return response()->json($doctor);
    }

    public function destroy(Doctor $doctor)
    {
        $doctor->delete();
        return response()->json(null, 204);
    }

    // === Mantiene tu método original funcional para Angular ===
    public function patientsByDoctor(Request $request)
    {
        $doctorId = $request->user()->doctor_id ?? null;

        if (!$doctorId) {
            return response()->json([], 200); // siempre devuelve JSON válido
        }

        $patients = Patient::whereHas('appointments', function ($q) use ($doctorId) {
            $q->where('doctor_id', $doctorId);
        })->get();

        return response()->json($patients);
    }

    public function appointmentsByDoctorPatient(Request $request, $patientId)
    {
        $doctor = Doctor::where('user_id', $request->user()->id)->first();

        if (!$doctor) {
            return response()->json(['error' => 'No se encontró doctor'], 404);
        }

        $appointments = Appointment::where('patient_id', $patientId)
            ->where('doctor_id', $doctor->id)
            ->get();

        return response()->json($appointments);
    }

    // Mantener getPatientsByDoctor también pero seguro para Angular
    public function getPatientsByDoctor(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'doctor') {
            return response()->json([], 200); // devuelve JSON vacío
        }

        $doctor = Doctor::where('user_id', $user->id)->first();

        if (!$doctor) {
            return response()->json([], 200);
        }

        $patients = Patient::whereHas('appointments', function ($q) use ($doctor) {
            $q->where('doctor_id', $doctor->id);
        })->get();

        return response()->json($patients);
    }
}
