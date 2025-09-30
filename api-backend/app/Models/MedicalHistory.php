<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\MedicalAttention;
use App\Models\Treatment;

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
        'relevant_oral_habits',
        'created_at',
        'updated_at',
        'medical_attention_id',
        'details',
        'diagnosis',
        'pre_enrollment',
        'other_treatments'
    ];

    protected $casts = [
        'other_treatments' => 'array',
        'treatments_performed' => 'array',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }


    public function medicalAttention() { 
        return $this->belongsTo(MedicalAttention::class); 
    }

    public function treatments()
    {
        return $this->belongsToMany(Treatment::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
    
}
