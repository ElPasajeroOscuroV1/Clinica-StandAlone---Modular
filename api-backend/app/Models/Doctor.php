<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Factories\hasMany;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\MedicalAttention;

class Doctor extends Model
{
    //
    use HasFactory;

    protected $fillable = [
        'name',
        'specialty',
        'email',
        'phone',
        'available',
        'user_id'
    ];

    protected $casts = [
        'available' => 'boolean'
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
