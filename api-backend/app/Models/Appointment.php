<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Doctor;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_name',
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
}
