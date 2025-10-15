<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Treatment;


class TreatmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        return response()->json(Treatment::all()->map(function ($treatment) {
            return $treatment->toArray() + [
                'precio_con_descuento' => $treatment->precio_con_descuento,
                'ahorro' => $treatment->ahorro,
            ];
        }), 200);

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric',
            'duracion' => 'required|integer',
            'descuento_porcentaje' => 'nullable|numeric|min:0|max:100',
            'descuento_monto' => 'nullable|numeric|min:0',
            'tiene_descuento' => 'nullable|boolean',
            'motivo_descuento' => 'nullable|string'
        ]);

        // Asignar valores por defecto si no están presentes
        $validated['tiene_descuento'] = $validated['tiene_descuento'] ?? false;
        $validated['descuento_porcentaje'] = $validated['descuento_porcentaje'] ?? 0;
        $validated['descuento_monto'] = $validated['descuento_monto'] ?? 0;
        $validated['precio_original'] = $validated['precio_original'] ?? $validated['precio'];

        // Si no tiene descuento, limpiar los valores de descuento
        if (!$validated['tiene_descuento']) {
            $validated['descuento_porcentaje'] = 0;
            $validated['descuento_monto'] = 0;
            $validated['motivo_descuento'] = null;
        }

        $treatment = Treatment::create($validated);

        // Calcular precio con descuento
        $response = $treatment->toArray() + [
            'precio_con_descuento' => $treatment->precio_con_descuento,
            'ahorro' => $treatment->ahorro,
        ];

        return response()->json($response, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
        $treatment = Treatment::findOrFail($id);
        $response = $treatment->toArray() + [
            'precio_con_descuento' => $treatment->precio_con_descuento,
            'ahorro' => $treatment->ahorro,
        ];

        return response()->json($response, 200);

    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric',
            'duracion' => 'required|integer',
            'precio_original' => 'nullable|numeric',
            'descuento_porcentaje' => 'nullable|numeric|min:0|max:100',
            'descuento_monto' => 'nullable|numeric|min:0',
            'tiene_descuento' => 'nullable|boolean',
            'motivo_descuento' => 'nullable|string'
        ]);

        // Asignar valores por defecto si no están presentes
        $validated['tiene_descuento'] = $validated['tiene_descuento'] ?? false;
        $validated['descuento_porcentaje'] = $validated['descuento_porcentaje'] ?? 0;
        $validated['descuento_monto'] = $validated['descuento_monto'] ?? 0;

        // Si no tiene descuento, limpiar los valores de descuento
        if (!$validated['tiene_descuento']) {
            $validated['descuento_porcentaje'] = 0;
            $validated['descuento_monto'] = 0;
            $validated['motivo_descuento'] = null;
        }

        $treatment = Treatment::findOrFail($id);

        $treatment->update($validated); // Usar los datos validados

        // Calcular precio con descuento
        $response = $treatment->toArray() + [
            'precio_con_descuento' => $treatment->precio_con_descuento,
            'ahorro' => $treatment->ahorro,
        ];

        return response()->json($response, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
        $treatment = Treatment::findOrFail($id);
        $treatment->delete();

        return response()->json(['message' => 'Tratamiento eliminado']);
    }
}
