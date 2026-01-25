<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reward_order_id')->constrained('reward_orders')->cascadeOnDelete();
            $table->foreignId('reward_product_id')->nullable()->constrained('reward_products')->nullOnDelete();
            $table->string('product_title');
            $table->unsignedInteger('xp_each')->default(0);
            $table->unsignedInteger('qty')->default(1);
            $table->unsignedInteger('xp_total')->default(0);
            $table->timestamps();

            $table->index(['reward_order_id']);
            $table->index(['reward_product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_order_items');
    }
};

