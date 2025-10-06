<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Treatment;
use App\Models\Appointment;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $payments = \App\Models\Payment::with(['patient', 'appointment.doctor', 'treatment'])->get();

        // Transformar los datos para incluir doctor_name
        $transformedPayments = $payments->map(function ($payment) {
            $paymentArray = $payment->toArray();

            // Agregar doctor_name si existe el doctor
            if ($payment->appointment && $payment->appointment->doctor) {
                $paymentArray['appointment']['doctor_name'] = $payment->appointment->doctor->name;
            }

            return $paymentArray;
        });

        return response()->json($transformedPayments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $validatedData = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_id' => 'required|exists:appointments,id',
            'treatment_ids' => 'nullable|array',
            'other_treatments' => 'nullable|array',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'method' => 'required|string|max:255',
            'status' => 'required|string|max:255',
        ]);

        $treatmentIds = $request->treatment_ids ?? [];
        $treatments = Treatment::whereIn('id', $treatmentIds)->get(['id', 'nombre', 'precio'])->toArray();

        $data = [
            'appointment_id' => $request->appointment_id,
            'patient_id' => $request->patient_id,
            'treatments' => $treatments,
            'other_treatments' => $request->other_treatments ?? [],
            'amount' => $request->amount,
            'date' => $request->date,
            'method' => $request->method,
            'status' => $request->status,
        ];

        $payment = \App\Models\Payment::create($data);

        // Actualizar estado de pago de la cita
        $appointment = \App\Models\Appointment::findOrFail($request->appointment_id);
        $appointment->payment_status = $request->status === 'Pendiente' ? 'Pendiente' : 'Pagado';
        $appointment->save();

        $payment->load(['patient', 'appointment.doctor', 'treatment']);

        // Agregar doctor_name a la respuesta
        $paymentArray = $payment->toArray();
        if ($payment->appointment && $payment->appointment->doctor) {
            $paymentArray['appointment']['doctor_name'] = $payment->appointment->doctor->name;
        }

        return response()->json($paymentArray, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
        $validatedData = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_id' => 'required|exists:appointments,id',
            'treatment_ids' => 'nullable|array',
            'other_treatments' => 'nullable|array',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'method' => 'required|string|max:255',
            'status' => 'required|string|max:255',
        ]);

        $payment = \App\Models\Payment::findOrFail($id);

        $treatmentIds = $request->treatment_ids ?? [];
        $treatments = Treatment::whereIn('id', $treatmentIds)->get(['id', 'nombre', 'precio'])->toArray();

        $data = [
            'appointment_id' => $request->appointment_id,
            'patient_id' => $request->patient_id,
            'treatments' => $treatments,
            'other_treatments' => $request->other_treatments ?? [],
            'amount' => $request->amount,
            'date' => $request->date,
            'method' => $request->method,
            'status' => $request->status,
        ];

        $payment->update($data);

        // Actualizar estado de pago de la cita
        $appointment = \App\Models\Appointment::findOrFail($request->appointment_id);
        $appointment->payment_status = $request->status === 'Pendiente' ? 'Pendiente' : 'Pagado';
        $appointment->save();

        $payment->load(['patient', 'appointment.doctor', 'treatment']);

        // Agregar doctor_name a la respuesta
        $paymentArray = $payment->toArray();
        if ($payment->appointment && $payment->appointment->doctor) {
            $paymentArray['appointment']['doctor_name'] = $payment->appointment->doctor->name;
        }

        return response()->json($paymentArray, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
        Payment::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
