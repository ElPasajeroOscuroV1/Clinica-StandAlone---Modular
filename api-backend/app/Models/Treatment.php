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
    ];

}
