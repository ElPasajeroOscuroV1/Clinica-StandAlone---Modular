<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DoctorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $doctors = Doctor::all();
        return response()->json($doctors);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // 1️⃣ Crear el usuario
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

        // 2️⃣ Crear el doctor y vincularlo con el usuario
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
        //$doctor = Doctor::create($validatedData);
        //return response()->json($doctor, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Doctor $doctor)
    {
        //
        return $doctor;

    }

    /**
     * Update the specified resource in storage.
     */
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Doctor $doctor)
    {
        $doctor->delete();
        return response()->json(null, 204);
    }
}
