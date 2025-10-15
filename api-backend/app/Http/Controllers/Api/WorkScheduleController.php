<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WorkSchedule;
use App\Models\Appointment;
use App\Models\DoctorPermission;

class WorkScheduleController extends Controller
{
    public function index()
    {
        return response()->json(WorkSchedule::all());
    }

    public function showByDoctor($doctorId)
    {
        return response()->json(WorkSchedule::where('doctor_id', $doctorId)->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|exists:doctors,id',
            'day_of_week' => 'required|string',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        $schedule = WorkSchedule::create($validated);
        return response()->json($schedule, 201);
    }

    public function update(Request $request, $id)
    {
        $schedule = WorkSchedule::findOrFail($id);
        $schedule->update($request->all());
        return response()->json($schedule);
    }

    public function destroy($id)
    {
        $schedule = WorkSchedule::findOrFail($id);
        $schedule->delete();
        return response()->json(['message' => 'Turno eliminado']);
    }

    public function getAvailableTurns($doctorId, $date)
    {
        // Verificar si el doctor tiene permisos para esta fecha
        $hasPermission = DoctorPermission::where('doctor_id', $doctorId)
            ->where('is_active', true)
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->exists();

        if ($hasPermission) {
            return response()->json(['message' => 'El doctor tiene permisos en esta fecha y no está disponible'], 403);
        }

        // Obtener el día de la semana
        $dayOfWeek = date('l', strtotime($date)); // Monday, Tuesday, etc.

        // Mapear a español
        $dayMapping = [
            'Monday' => 'lunes',
            'Tuesday' => 'martes',
            'Wednesday' => 'miércoles',
            'Thursday' => 'jueves',
            'Friday' => 'viernes',
            'Saturday' => 'sábado',
            'Sunday' => 'domingo'
        ];

        $spanishDay = $dayMapping[$dayOfWeek] ?? $dayOfWeek;

        // Obtener el horario del doctor para ese día
        $schedules = WorkSchedule::where('doctor_id', $doctorId)
            ->where('day_of_week', $spanishDay)
            ->get();

        $availableTurns = [];

        // Obtener citas existentes para ese doctor y fecha
        $existingAppointments = Appointment::where('doctor_id', $doctorId)
            ->where('date', $date)
            ->pluck('time')
            ->toArray();

        foreach ($schedules as $schedule) {
            $startTime = strtotime($schedule->start_time);
            $endTime = strtotime($schedule->end_time);

            // Generar turnos cada 90 minutos (1 hora y 30 minutos)
            for ($time = $startTime; $time < $endTime; $time += 90 * 60) { // 90 minutos
                $turnTime = date('H:i:s', $time);

                // Verificar si el turno ya está ocupado
                $isAvailable = !in_array($turnTime, $existingAppointments);

                $availableTurns[] = [
                    'time' => $turnTime,
                    'formatted_time' => date('H:i', $time),
                    'available' => $isAvailable
                ];
            }
        }

        // Si no hay horarios configurados, devolver vacío
        if (empty($availableTurns)) {
            return response()->json(['message' => 'No hay horarios configurados para este día'], 404);
        }

        return response()->json($availableTurns);
    }
}
