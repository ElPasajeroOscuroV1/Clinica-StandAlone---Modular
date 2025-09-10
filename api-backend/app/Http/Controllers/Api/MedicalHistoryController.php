<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MedicalHistory;

class MedicalHistoryController extends Controller
{
    //
    public function index()
    {
        // Si quieres incluir la relación con paciente y atención médica:
        $histories = MedicalHistory::with(['patient', 'medicalAttention'])->get();

        return response()->json($histories);
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $data['patient_id'] = $request->patient_id ?? 1; // Ajusta según el ID del paciente
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $history = MedicalHistory::create($data);
        return response()->json($history);
    }
}
