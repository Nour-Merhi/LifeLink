<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donor_id')->constrained('donors')->cascadeOnDelete();
            $table->string('code')->unique();
            $table->unsignedInteger('total_xp_spent')->default(0);
            $table->string('status')->default('pending_pickup'); // pending_pickup | picked_up | cancelled
            $table->timestamps();

            $table->index(['donor_id', 'created_at']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_orders');
    }
};

