<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorPermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'type',
        'title',
        'description',
        'start_date',
        'end_date',
        'is_active'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean'
    ];

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Check if a given date falls within this permission period
     */
    public function isDateInPermission(string $date): bool
    {
        return $this->is_active &&
               $date >= $this->start_date->toDateString() &&
               $date <= $this->end_date->toDateString();
    }
}
