<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_products', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('cost_xp')->default(0);
            $table->text('image_path')->nullable(); // stored path (e.g. /storage/reward-products/xxx.png)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default products (admin can later update cost + upload images)
        DB::table('reward_products')->insert([
            [
                'code' => 'RP-TSHIRT',
                'title' => 'LifeLink T‑Shirt',
                'description' => 'Premium cotton with LifeLink logo.',
                'cost_xp' => 600,
                'image_path' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'RP-CUP',
                'title' => 'LifeLink Cup',
                'description' => 'Insulated cup for everyday use.',
                'cost_xp' => 350,
                'image_path' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'RP-STICKERS',
                'title' => 'Sticker Pack',
                'description' => 'A set of 10 LifeLink stickers.',
                'cost_xp' => 120,
                'image_path' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'RP-CAP',
                'title' => 'Cap',
                'description' => 'Adjustable cap with embroidered logo.',
                'cost_xp' => 420,
                'image_path' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'RP-NOTEBOOK',
                'title' => 'Notebook',
                'description' => 'A5 notebook for notes and journaling.',
                'cost_xp' => 220,
                'image_path' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'RP-HOODIE',
                'title' => 'Hoodie',
                'description' => 'Warm hoodie for winter days.',
                'cost_xp' => 1200,
                'image_path' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_products');
    }
};

