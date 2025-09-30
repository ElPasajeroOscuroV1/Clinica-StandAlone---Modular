<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medical_attentions', function (Blueprint $table) {
            $table->text('diagnosis')->nullable();
            $table->json('other_treatments')->nullable(); // [{name: '', price: 0}]
            //$table->boolean('pre_enrollment')->default(false);
            $table->string('pre_enrollment')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('medical_attentions', function (Blueprint $table) {
            $table->dropColumn(['diagnosis', 'other_treatments', 'pre_enrollment']);
        });
    }
};

