<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;


class PatientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        return Patient::all();

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $validated = $request->validate([
            //'patient_id' => 'required|integer|unique:patients,patient_id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:patients,email',
            //'ci' => ['required', 'ci', Rule::unique('patients')],
            'ci' => 'required|string|unique:patients,ci',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'medical_history' => 'nullable|string',
            'face_image' => 'required|string' // Para la imagen en base64
        ]);

        // Procesar la imagen base64
        if ($request->face_image) {
            // Remover el encabezado del data URL si existe
            $image = preg_replace('/^data:image\/\w+;base64,/', '', $request->face_image);
            $image = base64_decode($image);
            
            // Generar un nombre único para el archivo
            $imageName = uniqid() . '_face.png';
            
            // Guardar la imagen en el storage
            Storage::disk('public')->put('faces/' . $imageName, $image);
            
            // Actualizar el path en los datos validados
            $validated['face_image'] = 'faces/' . $imageName;
        }

        return Patient::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(Patient $patient)
    {
        //
        return $patient;

    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Patient $patient)
    {
        //
        $validated = $request->validate([
            //'patient_id' =>'required|integer|unique:patients,patient_id,' . $patient->patient_id,
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('patients')->ignore($patient->id)],
            //'ci' => ['required', 'ci', Rule::unique('patients')->ignore($patient->id)],
            'ci' =>'required|string|unique:patients,ci,'. $patient->id,
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'medical_history' => 'nullable|string',
            'face_image' => 'nullable|string' // Opcional en actualización
        ]);

        // Procesar la nueva imagen si se proporciona
        if ($request->face_image) {
            // Eliminar la imagen anterior si existe
            if ($patient->face_image) {
                Storage::disk('public')->delete($patient->face_image);
            }

            // Procesar la nueva imagen
            $image = preg_replace('/^data:image\/\w+;base64,/', '', $request->face_image);
            $image = base64_decode($image);
            $imageName = uniqid() . '_face.png';
            Storage::disk('public')->put('faces/' . $imageName, $image);
            $validated['face_image'] = 'faces/' . $imageName;
        }

        $patient->update($validated);
        return $patient;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Patient $patient)
    {
        //

        // Eliminar la imagen si existe
        if ($patient->face_image) {
            Storage::disk('public')->delete($patient->face_image);
        }
        
        $patient->delete();
        return response()->noContent();
    }
}
