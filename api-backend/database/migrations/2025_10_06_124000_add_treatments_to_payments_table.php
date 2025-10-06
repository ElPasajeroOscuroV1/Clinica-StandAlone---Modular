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
        Schema::table('payments', function (Blueprint $table) {
            // ✅ Primero eliminamos la vieja relación 1 a 1 (ya no la necesitamos)
            if (Schema::hasColumn('payments', 'treatment_id')) {
                $table->dropForeign(['treatment_id']);
                $table->dropColumn('treatment_id');
            }

            // ✅ Agregamos los nuevos campos JSON
            $table->json('treatments')->nullable()->after('appointment_id');
            $table->json('other_treatments')->nullable()->after('treatments');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // ✅ En rollback, eliminamos los nuevos campos
            $table->dropColumn(['treatments', 'other_treatments']);

            // ✅ Restauramos la columna vieja si hicieras rollback
            $table->unsignedBigInteger('treatment_id')->nullable()->after('appointment_id');
            $table->foreign('treatment_id')->references('id')->on('treatments')->onDelete('set null');
        });
    }
};
