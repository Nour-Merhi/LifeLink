<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->integer('level'); // Quiz level (1-10)
            $table->text('question'); // Question text
            $table->text('options')->nullable(); // JSON array of options if multiple choice
            $table->string('correct_answer'); // Correct answer (string)
            $table->integer('points')->default(0); // optional, override XP per question
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};
