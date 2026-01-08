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
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->text('description'); // Short description/excerpt
            $table->longText('content')->nullable(); // Full article content
            $table->string('image')->nullable(); // Image URL/path
            $table->string('category');
            $table->boolean('is_published')->default(false); // Whether article is published/visible
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete(); // Admin who created it
            $table->timestamp('published_at')->nullable(); // When it was published
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
