<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
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

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $request->validate([
            'patient_name' => 'required|string',
            'doctor' => 'required|string',
            'date' => 'required|date',
            'time' => 'required',
            'reason' => 'required|string'
        ]);

        return Appointment::create($request->all());
    }

    /**
     * Display the specified resource.
     */
    public function show(Appointment $appointment)
    {
        //
        return $appointment;
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Appointment $appointment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Appointment $appointment)
    {
        //
        $appointment->delete();
        return response()->json(null, 204);
    }
}
