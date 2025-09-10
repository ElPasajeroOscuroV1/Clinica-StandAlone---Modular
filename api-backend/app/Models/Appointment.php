<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Doctor;
use App\Models\Patient;


class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_name',
        'patient_id',
        'ci',
        'doctor_id',
        'date',
        'time',
        'reason',
        'payment_status'
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
    
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
    
    public function medicalAttention() { 
        return $this->hasOne(MedicalAttention::class); 
    }
}
