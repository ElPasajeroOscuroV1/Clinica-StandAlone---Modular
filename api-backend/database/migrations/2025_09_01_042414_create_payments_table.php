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
        Schema::create('payments', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('appointment_id');
        $table->unsignedBigInteger('patient_id');
        $table->decimal('amount', 8, 2);
        $table->date('date');
        $table->string('method');
        $table->string('status')->default('Pendiente');
        $table->timestamps();

        // Relaciones (opcional)
        $table->foreign('appointment_id')->references('id')->on('appointments');
        $table->foreign('patient_id')->references('id')->on('patients');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
