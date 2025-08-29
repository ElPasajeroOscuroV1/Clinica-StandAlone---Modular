<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\MedicalHistory;


class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        //'patient_id', // Agrega 'patient_id' a la lista de atributos llenables
        'name',
        'email',
        'ci',
        'phone',
        'address',
        'birth_date',
        'medical_history',
        'face_image'
    ];

    protected $casts = [
        'birth_date' => 'date'
    ];

    public function medicalHistory()
    {
        return $this->hasOne(MedicalHistory::class);
    }
}