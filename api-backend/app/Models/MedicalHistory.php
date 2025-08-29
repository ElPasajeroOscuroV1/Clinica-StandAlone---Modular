<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MedicalHistory extends Model
{
    //
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'medical_background',
        'dental_background',
        'consultation_reason',
        'extraoral_exam',
        'intraoral_exam',
        'odontogram',
        'treatments_performed',
        'current_medications',
        'allergies',
        'relevant_oral_habits'
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}
