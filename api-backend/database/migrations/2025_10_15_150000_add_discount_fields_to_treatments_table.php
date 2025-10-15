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
        Schema::table('treatments', function (Blueprint $table) {
            $table->decimal('precio_original', 8, 2)->nullable()->after('precio'); // precio sin descuento
            $table->decimal('descuento_porcentaje', 5, 2)->default(0)->after('precio_original'); // porcentaje de descuento (0-100)
            $table->decimal('descuento_monto', 8, 2)->default(0)->after('descuento_porcentaje'); // monto fijo de descuento
            $table->boolean('tiene_descuento')->default(false)->after('descuento_monto'); // si tiene descuento aplicado
            $table->text('motivo_descuento')->nullable()->after('tiene_descuento'); // razón del descuento
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            $table->dropColumn([
                'precio_original',
                'descuento_porcentaje',
                'descuento_monto',
                'tiene_descuento',
                'motivo_descuento'
            ]);
        });
    }
};
