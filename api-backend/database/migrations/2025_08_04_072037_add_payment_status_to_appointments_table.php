<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Añade la nueva columna 'payment_status' de tipo string
            $table->enum('payment_status', ['Pendiente', 'Pagado'])->default('Pendiente')->after('reason');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->enum('payment_status', ['Pendiente', 'Pagado'])->default('Pendiente')->after('status');
        });
    }
};
