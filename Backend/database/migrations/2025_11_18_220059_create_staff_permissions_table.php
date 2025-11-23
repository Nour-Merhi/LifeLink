<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_role_id')->references('id')->on('staff_roles')->onDelete('cascade');
            $table->string('permission'); // appointments.manage, donors.manage, urgent.manage, inventory.manage, staff.manage, view.analytics
            $table->boolean('granted')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_permissions');
    }
};
