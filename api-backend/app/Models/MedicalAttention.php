<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\Treatment;
use App\Models\MedicalHistory;

class MedicalAttention extends Model
{
    //
    protected $fillable = [
        'patient_id',
        'appointment_id',
        'total_cost',
        'notes',
        'diagnosis',
        'other_treatments',
        'pre_enrollment',
        'medical_history_id'
    ];

    protected $casts = [
        'total_cost' => 'decimal:2',
        'other_treatments' => 'array',
        //'pre_enrollment' => 'boolean',
        'pre_enrollment' => 'string',  
    ];

    public function patient() { 
        return $this->belongsTo(Patient::class); 
    }

    public function appointment() { 
        return $this->belongsTo(Appointment::class); 
    }

    public function treatments() {
        // ✅ CORRECCIÓN: Elimina el nombre de la tabla pivote para que Laravel use la convención por defecto.
        return $this->belongsToMany(Treatment::class);
    }

    public function medicalHistory() { 
        return $this->hasOne(MedicalHistory::class); 
    }
}
