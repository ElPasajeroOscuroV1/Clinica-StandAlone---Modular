<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Arr; // arriba del archivo
use App\Models\Appointment;
use App\Models\MedicalHistory;

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
        \Log::info('Datos recibidos en store:', $request->all());
        //
        try{
            $validated = $request->validate([
                //'patient_id' => 'required|integer|unique:patients,patient_id',
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:patients,email',
                //'ci' => ['required', 'ci', Rule::unique('patients')],
                'ci' => 'required|string|unique:patients,ci',
                'phone' => 'required|string|max:20',
                'address' => 'required|string|max:255',
                'birth_date' => 'required|date',
                // 'medical_history' => 'nullable|string',
                'face_image' => 'required|string' // Para la imagen en base64
            ]);

            // Validar los campos de historia médica por separado
            $medicalHistoryValidated = $request->validate([
                'medical_background' => $request->input('medical_background', ''),
                'dental_background' => $request->input('dental_background', ''),
                'consultation_reason' => $request->input('consultation_reason', ''),
                'extraoral_exam' => $request->input('extraoral_exam', ''),
                'intraoral_exam' => $request->input('intraoral_exam', ''),
                'odontogram' => $request->input('odontogram', ''),
                'treatments_performed' => $request->input('treatments_performed', ''),
                'current_medications' => $request->input('current_medications', ''),
                'allergies' => $request->input('allergies', ''),
                'relevant_oral_habits' => $request->input('relevant_oral_habits', ''),
            ]);

            // Procesar la imagen base64
            if ($request->face_image) {
                // Remover el encabezado del data URL si existe
                $image = preg_replace('/^data:image\/\w+;base64,/', '', $request->face_image);
                $decodedImage = base64_decode($image, true);
                if ($decodedImage === false) {
                    \Log::error('Error al decodificar la imagen base64');
                    return response()->json(['message' => 'La imagen base64 es inválida'], 422);
                }
                //$image = base64_decode($image);
                
                // Generar un nombre único para el archivo
                $imageName = uniqid() . '_face.png';
                
                // Guardar la imagen en el storage
                Storage::disk('public')->put('faces/' . $imageName, $decodedImage);
                
                // Actualizar el path en los datos validados
                $validated['face_image'] = 'faces/' . $imageName;
            }

            $patient = Patient::create($validated);
            
            if (!empty(array_filter($medicalHistoryValidated))) {
                // Crear historia médica con un valor predeterminado para medical_attention_id si es necesario
                $medicalHistoryValidated['medical_attention_id'] = $request->input('medical_attention_id', null); // O un valor predeterminado
                // Crear la historia médica asociada al paciente
                $patient->medicalHistory()->create($medicalHistoryValidated);
            }
            return response()->json($patient, 201);
        }catch(\Exception $e){
            \Log::error('Error en store:', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al crear el paciente'], 500);
        }
        //return Patient::create($validated);
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

    /**
     * Get the medical history for a specific patient.
     */
    public function getPatientMedicalHistory(Patient $patient)
    {
        //return response()->json(['medical_history' => $patient->medical_history]);
        //return response()->json($patient->medicalHistory);
        /*
        try {
            $medicalHistory = $patient->medicalHistory; // Intenta cargar la relación

            if ($medicalHistory) {
                return response()->json($medicalHistory);
            } else {
                // Si no hay historial médico, devuelve un objeto vacío o un 404
                return response()->json([], 200); // O 404 si prefieres indicar que no se encontró
            }
        } catch (\Exception $e) {
            // Registra el error para depuración
            \Illuminate\Support\Facades\Log::error('Error al obtener historial médico para paciente ' . $patient->id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor al obtener historial médico.'], 500);
        }
        */
        try {
            $history = $patient->medicalHistory; // relación hasOne
    
            if ($history) {
                return response()->json($history, 200);
            }
    
            // Objeto por defecto (evita 500 y facilita patchValue)
            return response()->json([
                'medical_background'    => null,
                'dental_background'     => null,
                'consultation_reason'   => '',
                'extraoral_exam'        => null,
                'intraoral_exam'        => null,
                'odontogram'            => null,
                'treatments_performed'  => null,
                'current_medications'   => null,
                'allergies'             => null,
                'relevant_oral_habits'  => null,
            ], 200);
        } catch (\Throwable $e) {
            \Log::error("Error al obtener historial médico (patient {$patient->id}): ".$e->getMessage());
            return response()->json(['error' => 'Error interno del servidor al obtener historial médico.'], 500);
        }
    }

    /**
     * Update the medical history for a specific patient.
     */
    public function updatePatientMedicalHistory(Request $request, Patient $patient)
    {
        /*
        $validated = $request->validate([
            'medical_history' => 'nullable|string',
        ]);
        */
        $validated = $request->validate([
            'medical_background' => 'nullable|string',
            'dental_background' => 'nullable|string',
            'consultation_reason' => 'required|nullable|string',
            'extraoral_exam' => 'nullable|string',
            'intraoral_exam' => 'nullable|string',
            'odontogram' => 'nullable|string',
            'treatments_performed' => 'nullable|string',
            'current_medications' => 'nullable|string',
            'allergies' => 'nullable|string',
            'relevant_oral_habits' => 'nullable|string'
        ]);
        /*
        $patient->update($validated);
        */
        $patient->medicalHistory()->updateOrCreate(
            ['patient_id' => $patient->id],
            $validated
        );
        /*
        return response()->json(['medical_history' => $patient->medical_history]);
        */
        return response()->json($patient->medicalHistory);
    }

    public function getAppointments($id)
    {
        $patient = Patient::with('appointments')->findOrFail($id);
        return response()->json($patient->appointments);
    }

    /*
    public function updateMedicalHistory(Request $request, $id)
    {
        $patient = Patient::findOrFail($id);

        // Validación de campos (snake_case porque Angular ya los envía así)
        $validated = $request->validate([
            'medical_background'   => 'nullable|string|max:1000',
            'dental_background'    => 'nullable|string|max:1000',
            'consultation_reason'  => 'nullable|string|max:1000',
            'extraoral_exam'       => 'nullable|string',
            'intraoral_exam'       => 'nullable|string',
            'odontogram'           => 'nullable|string',
            'treatments_performed' => 'nullable|string',
            'current_medications'  => 'nullable|string',
            'allergies'            => 'nullable|string',
            'relevant_oral_habits' => 'nullable|string',
        ]);

        // Buscar historial médico del paciente
        $history = $patient->medicalHistory()->first();

        if ($history) {
            // Si existe → actualizar
            $history->update($validated);
        } else {
            // Si no existe → crear
            $history = $patient->medicalHistory()->create($validated);
        }

        return response()->json([
            'message' => 'Historial médico guardado correctamente',
            'data'    => $history
        ], 200);
    }
    */

    public function updateMedicalHistory(Request $request, $patientId)
    {
        $data = $request->all();
        $data['patient_id'] = $patientId;
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $history = MedicalHistory::create($data);
        return response()->json($history);
    }
}


