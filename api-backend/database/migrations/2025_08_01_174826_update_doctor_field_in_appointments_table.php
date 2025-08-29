<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedBigInteger('doctor_id')->after('ci');
    
            // Establecer la relación foránea
            $table->foreign('doctor_id')
                  ->references('id')->on('doctors')
                  ->onDelete('cascade');
            
            $table->dropColumn('doctor'); // 👈 Elimina después de añadir doctor_id
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('doctor')->after('ci');
            $table->dropForeign(['doctor_id']); // 👈 Elimina la foreign key
            $table->dropColumn('doctor_id');    // 👈 Elimina el campo
        });
    }
};
