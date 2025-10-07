<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * 📑 Resumen general de la clínica
     */
    public function summary(Request $request)
    {
        $from = $request->query('from', Carbon::now()->startOfYear()->toDateString());
        $to = $request->query('to', Carbon::now()->toDateString());

        $totalAppointments = DB::table('appointments')
            ->whereBetween('date', [$from, $to])
            ->count();

        $patientsRegistered = DB::table('patients')->count();

        $patientsAttended = DB::table('appointments')
            ->whereBetween('date', [$from, $to])
            ->distinct()
            ->count('patient_id');

        $totalIncome = DB::table('payments')
            ->whereBetween('date', [$from, $to])
            ->sum('amount');

        $mostRequestedTreatment = DB::table('medical_attention_treatment as mat')
            ->join('medical_attentions as ma', 'mat.medical_attention_id', '=', 'ma.id')
            ->join('appointments as ap', 'ma.appointment_id', '=', 'ap.id')
            ->join('treatments as t', 'mat.treatment_id', '=', 't.id')
            ->whereBetween('ap.date', [$from, $to])
            ->select('t.nombre as treatment', DB::raw('COUNT(*) as total'))
            ->groupBy('t.nombre')
            ->orderByDesc('total')
            ->first();

        return response()->json([
            'from' => $from,
            'to' => $to,
            'totalAppointments' => (int)$totalAppointments,
            'patientsRegistered' => (int)$patientsRegistered,
            'patientsAttended' => (int)$patientsAttended,
            'totalIncome' => (float)$totalIncome,
            'mostRequestedTreatment' => $mostRequestedTreatment ? $mostRequestedTreatment->treatment : null,
            'mostRequestedTreatmentCount' => $mostRequestedTreatment ? (int)$mostRequestedTreatment->total : 0,
        ]);
    }

    /**
     * 📅 Reporte de citas agrupadas por día, mes o año
     */
    public function appointments(Request $request)
    {
        $from = $request->query('from', '2025-01-01');
        $to = $request->query('to', '2025-12-31');
        $group = $request->query('group', 'month'); // day | month | year

        $dateFormat = match ($group) {
            'day' => '%Y-%m-%d',
            'year' => '%Y',
            default => '%Y-%m',
        };

        $data = DB::table('appointments')
            ->select(DB::raw("DATE_FORMAT(date, '$dateFormat') as period"), DB::raw('COUNT(*) as total'))
            ->whereBetween('date', [$from, $to])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json($data);
    }

    /**
     * 👥 Pacientes más frecuentes
     */
    public function topPatients(Request $request)
    {
        $from = $request->query('from', '2025-01-01');
        $to = $request->query('to', '2025-12-31');

        $data = DB::table('appointments')
            ->join('patients', 'appointments.patient_id', '=', 'patients.id')
            ->select('patients.name as patient', DB::raw('COUNT(*) as total'))
            ->whereBetween('appointments.date', [$from, $to])
            ->groupBy('patients.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json($data);
    }

    /**
     * 💉 Tratamientos más realizados
     */
    public function topTreatments(Request $request)
    {
        $from = $request->query('from', '2025-01-01');
        $to = $request->query('to', '2025-12-31');

        \Log::info('=== REPORT TREATMENTS DEBUG ===');
        \Log::info('Fecha desde: ' . $from . ' hasta: ' . $to);

        try {
            $treatmentStats = collect();

            // 1. Tratamientos regulares de atenciones médicas (medical_attention_treatment)
            $medicalTreatmentsCount = DB::table('medical_attention_treatment')->count();
            \Log::info('Registros en medical_attention_treatment: ' . $medicalTreatmentsCount);

            $medicalTreatments = DB::table('medical_attention_treatment as mat')
                ->join('medical_attentions as ma', 'mat.medical_attention_id', '=', 'ma.id')
                ->join('appointments as ap', 'ma.appointment_id', '=', 'ap.id')
                ->join('treatments as t', 'mat.treatment_id', '=', 't.id')
                ->whereBetween('ap.date', [$from, $to])
                ->select('t.nombre as treatment', DB::raw('COUNT(*) as total'))
                ->groupBy('t.nombre')
                ->get();

            \Log::info('Tratamientos médicos encontrados: ' . $medicalTreatments->count());
            foreach ($medicalTreatments as $treatment) {
                \Log::info('Tratamiento médico: ' . $treatment->treatment . ' - Total: ' . $treatment->total);
            }

            // Agregar tratamientos médicos
            foreach ($medicalTreatments as $treatment) {
                $existing = $treatmentStats->firstWhere('treatment', $treatment->treatment);
                if ($existing) {
                    $existing['total'] += $treatment->total;
                } else {
                    $treatmentStats->push([
                        'treatment' => $treatment->treatment,
                        'total' => $treatment->total
                    ]);
                }
            }

            // 2. Otros tratamientos de atenciones médicas (medical_attentions.other_treatments)
            $medicalAttentionsCount = DB::table('medical_attentions')->count();
            \Log::info('Registros en medical_attentions (atenciones médicas): ' . $medicalAttentionsCount);

            $medicalAttentionsWithTreatments = DB::table('medical_attentions as ma')
                ->join('appointments as ap', 'ma.appointment_id', '=', 'ap.id')
                ->whereBetween('ap.date', [$from, $to])
                ->whereNotNull('ma.other_treatments')
                ->select('ma.other_treatments', 'ap.id as appointment_id')
                ->get();

            \Log::info('Medical attentions con tratamientos encontrados: ' . $medicalAttentionsWithTreatments->count());
            foreach ($medicalAttentionsWithTreatments as $attention) {
                \Log::info('Tratamientos en atención ' . $attention->appointment_id . ': ' . $attention->other_treatments);

                $otherTreatmentsData = is_string($attention->other_treatments) ? json_decode($attention->other_treatments, true) : $attention->other_treatments;
                if (is_array($otherTreatmentsData)) {
                    foreach ($otherTreatmentsData as $treatmentData) {
                        if (isset($treatmentData['name'])) {
                            $treatmentName = $treatmentData['name'];
                            $existing = $treatmentStats->firstWhere('treatment', $treatmentName);
                            if ($existing) {
                                $existing['total'] += 1;
                            } else {
                                $treatmentStats->push([
                                    'treatment' => $treatmentName,
                                    'total' => 1
                                ]);
                            }
                            \Log::info('Tratamiento agregado: ' . $treatmentName);
                        }
                    }
                }
            }

            // 3. Tratamientos de pagos (como respaldo)
            $paymentTreatmentsCount = DB::table('payments')
                ->whereBetween('date', [$from, $to])
                ->where(function($q) {
                    $q->whereNotNull('treatments')
                      ->orWhereNotNull('other_treatments');
                })
                ->count();
            \Log::info('Pagos con tratamientos: ' . $paymentTreatmentsCount);

            $paymentTreatments = DB::table('payments')
                ->whereBetween('date', [$from, $to])
                ->select('treatments', 'other_treatments')
                ->get();

            foreach ($paymentTreatments as $payment) {
                // Procesar tratamientos normales
                if ($payment->treatments) {
                    $treatmentsData = is_string($payment->treatments) ? json_decode($payment->treatments, true) : $payment->treatments;
                    if (is_array($treatmentsData)) {
                        foreach ($treatmentsData as $treatmentId => $treatmentQty) {
                            $qty = is_array($treatmentQty) ? (isset($treatmentQty[0]) ? $treatmentQty[0] : 1) : (int)$treatmentQty;
                            $treatment = DB::table('treatments')->where('id', (int)$treatmentId)->first();
                            if ($treatment) {
                                $existing = $treatmentStats->firstWhere('treatment', $treatment->nombre);
                                if ($existing) {
                                    $existing['total'] += $qty;
                                } else {
                                    $treatmentStats->push([
                                        'treatment' => $treatment->nombre,
                                        'total' => $qty
                                    ]);
                                }
                                \Log::info('Tratamiento de pago agregado: ' . $treatment->nombre);
                            }
                        }
                    }
                }

                // Procesar otros tratamientos de pagos
                if ($payment->other_treatments) {
                    $otherTreatmentsData = is_string($payment->other_treatments) ? json_decode($payment->other_treatments, true) : $payment->other_treatments;
                    if (is_array($otherTreatmentsData)) {
                        foreach ($otherTreatmentsData as $treatmentName => $treatmentQty) {
                            $qty = is_array($treatmentQty) ? (isset($treatmentQty[0]) ? $treatmentQty[0] : 1) : (int)$treatmentQty;
                            $existing = $treatmentStats->firstWhere('treatment', $treatmentName);
                            if ($existing) {
                                $existing['total'] += $qty;
                            } else {
                                $treatmentStats->push([
                                    'treatment' => $treatmentName,
                                    'total' => $qty
                                ]);
                            }
                            \Log::info('Otro tratamiento de pago agregado: ' . $treatmentName);
                        }
                    }
                }
            }

            \Log::info('Total tratamientos encontrados: ' . $treatmentStats->count());

            if ($treatmentStats->isEmpty()) {
                \Log::info('No se encontraron tratamientos, retornando mensaje informativo');
                $treatmentStats->push([
                    'treatment' => 'No hay tratamientos registrados en atenciones médicas',
                    'total' => 0
                ]);
            }

            // Ordenar por total descendente y limitar a 5
            $treatmentStats = $treatmentStats->sortByDesc('total')->take(5)->values();

            \Log::info('Tratamientos retornados: ' . json_encode($treatmentStats->toArray()));
            return response()->json($treatmentStats->toArray());

        } catch (\Exception $e) {
            \Log::error('Error in topTreatments: ' . $e->getMessage());
            return response()->json([[
                'treatment' => 'Error: ' . $e->getMessage(),
                'total' => 0
            ]]);
        }
    }

    /**
     * 🧑‍⚕️ Estadísticas por doctor
     */
    public function doctorStats(Request $request)
    {
        $from = $request->query('from', '2025-01-01');
        $to = $request->query('to', '2025-12-31');

        $data = DB::table('appointments')
            ->join('doctors', 'appointments.doctor_id', '=', 'doctors.id')
            ->select('doctors.name as doctor', DB::raw('COUNT(*) as total'))
            ->whereBetween('appointments.date', [$from, $to])
            ->groupBy('doctors.name')
            ->orderByDesc('total')
            ->get();

        return response()->json($data);
    }

    /**
     * 💰 Pagos por periodo
     */
    public function payments(Request $request)
    {
        $from = $request->query('from', '2025-01-01');
        $to = $request->query('to', '2025-12-31');
        $group = $request->query('group', 'month');

        $dateFormat = match ($group) {
            'day' => '%Y-%m-%d',
            'year' => '%Y',
            default => '%Y-%m',
        };

        $data = DB::table('payments')
            ->select(
                DB::raw("SUM(payments.amount) as total"),
                DB::raw("DATE_FORMAT(payments.date, '$dateFormat') as period")
            )
            ->whereBetween('payments.date', [$from, $to])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json($data);
    }
}
