<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DoctorPermission;

class DoctorPermissionController extends Controller
{
    public function index(Request $request)
    {
        $doctorId = $request->query('doctor_id');

        $query = DoctorPermission::with('doctor');

        if ($doctorId) {
            $query->where('doctor_id', $doctorId);
        }

        return response()->json($query->orderBy('start_date', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|exists:doctors,id',
            'type' => 'required|in:vacation,permission',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date|before_or_equal:end_date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'boolean'
        ]);

        $permission = DoctorPermission::create($validated);
        return response()->json($permission->load('doctor'), 201);
    }

    public function show(DoctorPermission $doctorPermission)
    {
        return response()->json($doctorPermission->load('doctor'));
    }

    public function update(Request $request, DoctorPermission $doctorPermission)
    {
        $validated = $request->validate([
            'type' => 'sometimes|in:vacation,permission',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|date|before_or_equal:end_date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'is_active' => 'boolean'
        ]);

        $doctorPermission->update($validated);
        return response()->json($doctorPermission->load('doctor'));
    }

    public function destroy(DoctorPermission $doctorPermission)
    {
        $doctorPermission->delete();
        return response()->json(['message' => 'Permiso eliminado exitosamente']);
    }

    /**
     * Check if doctor has permission on specific date
     */
    public function checkPermission($doctorId, $date)
    {
        $hasPermission = DoctorPermission::where('doctor_id', $doctorId)
            ->where('is_active', true)
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->exists();

        return response()->json([
            'has_permission' => $hasPermission,
            'date' => $date,
            'doctor_id' => $doctorId
        ]);
    }
}
