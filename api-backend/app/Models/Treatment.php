<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Treatment extends Model
{
    //
    protected $fillable = [
        'nombre',
        'descripcion',
        'precio',
        'duracion',
        'precio_original',
        'descuento_porcentaje',
        'descuento_monto',
        'tiene_descuento',
        'motivo_descuento',
    ];

    protected $casts = [
        'precio_original' => 'decimal:2',
        'descuento_porcentaje' => 'decimal:2',
        'descuento_monto' => 'decimal:2',
        'tiene_descuento' => 'boolean',
    ];

    /**
     * Calcular precio con descuento
     */
    public function getPrecioConDescuentoAttribute(): float
    {
        $precio = $this->precio;

        if ($this->tiene_descuento) {
            // Aplicar descuento por porcentaje primero
            if ($this->descuento_porcentaje > 0) {
                $precio = $precio * (1 - $this->descuento_porcentaje / 100);
            }

            // Luego aplicar descuento por monto fijo
            if ($this->descuento_monto > 0) {
                $precio = max(0, $precio - $this->descuento_monto);
            }
        }

        return round($precio, 2);
    }

    /**
     * Calcular el ahorro total
     */
    public function getAhorroAttribute(): float
    {
        if (!$this->tiene_descuento) {
            return 0;
        }

        return round($this->precio - $this->precio_con_descuento, 2);
    }

    /**
     * Set precio original cuando se actualiza precio base
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($treatment) {
            if (!$treatment->precio_original) {
                $treatment->precio_original = $treatment->precio;
            }
        });

        static::updating(function ($treatment) {
            // Si cambia el precio base y no tiene precio original, actualizarlo
            if ($treatment->isDirty('precio') && !$treatment->precio_original) {
                $treatment->precio_original = $treatment->getOriginal('precio');
            }
        });
    }

}
