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
        Schema::table('hospitals', function (Blueprint $table) {
            $table->string('image')->nullable()->after('address');
            $table->text('description')->nullable()->after('image');
            $table->json('services')->nullable()->after('description');
            $table->string('hours')->nullable()->after('services');
            $table->string('established')->nullable()->after('hours');
            $table->json('urgent_needs')->nullable()->after('established'); // Array of blood types urgently needed
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->dropColumn(['image', 'description', 'services', 'hours', 'established', 'urgent_needs']);
        });
    }
};
