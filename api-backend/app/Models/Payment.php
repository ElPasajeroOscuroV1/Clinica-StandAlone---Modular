<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Treatment;

class Payment extends Model
{
    //
    protected $fillable = [
        'appointment_id',
        'patient_id',
        'treatments',
        'other_treatments',
        'amount',
        'date',
        'method',
        'status'
    ];

    protected $casts = [
        'treatments' => 'array',
        'other_treatments' => 'array',
    ];
    
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function treatment()
    {
        return $this->belongsTo(Treatment::class);
    }
}
