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
        Schema::table('medical_histories', function (Blueprint $table) {
            $table->text('diagnosis')->nullable()->after('allergies');
            $table->string('pre_enrollment')->nullable()->after('diagnosis');
            $table->json('other_treatments')->nullable()->after('pre_enrollment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medical_histories', function (Blueprint $table) {
            $table->dropColumn(['diagnosis', 'pre_enrollment', 'other_treatments']);
        });
    }
};
