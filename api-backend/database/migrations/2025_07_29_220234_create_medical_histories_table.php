<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('medical_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->unique(); // Clave foránea a la tabla patients
            $table->text('medical_background')->nullable(); // Antecedentes médicos
            $table->text('dental_background')->nullable(); // Antecedentes odontológicos
            $table->text('consultation_reason')->nullable(); // Motivo de la consulta
            $table->text('extraoral_exam')->nullable(); // Examen extraoral
            $table->text('intraoral_exam')->nullable(); // Examen intraoral
            $table->text('odontogram')->nullable(); // Odontograma
            $table->text('treatments_performed')->nullable(); // Tratamientos realizados
            $table->text('current_medications')->nullable(); // Medicamentos actuales
            $table->text('allergies')->nullable(); // Alergias
            $table->text('relevant_oral_habits')->nullable(); // Hábitos bucales relevantes
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_histories');
    }
};
