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
        'treatment_ids', // Cambia a plural
        'total_cost', // Agrega este si no está
        'notes'
    ];

    protected $casts = [
        'total_cost' => 'decimal:2', // Para manejar decimales correctamente
    ];

    public function patient() { 
        return $this->belongsTo(Patient::class); 
    }

    public function appointment() { 
        return $this->belongsTo(Appointment::class); 
    }

    public function treatments() {
        return $this->belongsToMany(Treatment::class, 'medical_attention_treatment') // Especifica la tabla pivot si es personalizada
            ->withTimestamps(); // Si quieres timestamps en la pivot
    }

    public function medicalHistory() { 
        return $this->hasOne(MedicalHistory::class); 
    }
    
}
