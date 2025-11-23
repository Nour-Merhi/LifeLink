<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->json('medical_conditions')->nullable()->after('availability');
            $table->enum('status', ['active', 'inactive', 'blocked'])->default('active')->after('medical_conditions');
        });
    }

    public function down(): void
    {
        Schema::table('donors', function (Blueprint $table) {
            $table->dropColumn(['medical_conditions', 'status']);
        });
    }
};
