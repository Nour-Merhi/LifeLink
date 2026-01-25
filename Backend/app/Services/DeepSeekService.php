<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class DeepSeekService 
{
    /**
     * Generate article content using DeepSeek.
     *
     * Supports both:
     * - generateArticleContent($title, $description, $category, $contentNotes)
     * - generateArticleContent($topic)  (backward-compatible)
     */
    public static function generateArticleContent($title, $description = null, $category = null, $content = null)
    {
        $apiKey = config('services.deepseek.key');
        if (empty($apiKey)) {
            \Log::warning('DeepSeek API key is not configured (services.deepseek.key is empty).');
            return null;
        }

        // Backward compatibility: if only one argument is provided, treat it as a topic.
        $isTopicOnly = ($description === null && $category === null && $content === null);
        $topic = $isTopicOnly ? (string) $title : null;

        $title = $isTopicOnly ? null : (string) $title;
        $description = $isTopicOnly ? null : (string) ($description ?? '');
        $category = $isTopicOnly ? null : (string) ($category ?? '');
        $content = (string) ($content ?? '');

        $userPrompt = $isTopicOnly
            ? "Write a professional medical article for a blood and organ donation platform about this topic:\nTopic: {$topic}"
            : "Write a professional medical article for a blood and organ donation platform using the following details:\n"
                . "Title: {$title}\n"
                . "Category: {$category}\n"
                . "Description: {$description}\n"
                . "Content notes (may be empty): {$content}\n";

        $payload = [
            'model' => 'deepseek-chat',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => "You are a professional medical article writer for a blood and organ donation platform.
                        Write a clear, accurate, engaging article.
                        Use headings and short paragraphs where appropriate.
                        Do not include medical misinformation or dangerous advice.
                        End the article with a short line stating that the article was AI-generated.",
                ],
                [
                    'role' => 'user',
                    'content' => $userPrompt,
                ],
            ],
        ];

        $response = Http::timeout(30)
            ->retry(2, 500)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->post('https://api.deepseek.com/v1/chat/completions', $payload);

        if (!$response->successful()) {
            \Log::error('DeepSeek API request failed.', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        return data_get($response->json(), 'choices.0.message.content');
    }

    /**
     * Generate a full article as a STRICT JSON object:
     * { "title": "...", "category": "blood|organ|health", "description": "...", "content": "..." }
     *
     * This is meant to be consumed by the frontend, then stored directly in the articles table.
     */
    public static function generateArticleJsonByCategory(string $category): ?string
    {
        $apiKey = config('services.deepseek.key');
        if (empty($apiKey)) {
            \Log::warning('DeepSeek API key is not configured (services.deepseek.key is empty).');
            return null;
        }

        $category = strtolower(trim($category));

        $systemPrompt = <<<SYS
You are a professional medical article writer for a blood and organ donation platform.
Return ONLY a valid JSON object (no markdown, no code fences, no extra text).
The JSON must have exactly these keys: title, category, description, content.

Rules:
- category must be exactly one of: blood, organ, health
- description must be 1-3 sentences (plain text)
- content must be a detailed article (multiple paragraphs, can include headings using plain text)
- No medical misinformation or dangerous advice.
- End the content with a final line: "This article was AI-generated."
SYS;

        $userPrompt = <<<USR
Generate one article for category: {$category}
USR;

        $payload = [
            'model' => 'deepseek-chat',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            // Keep it reasonably consistent across calls
            'temperature' => 0.7,
        ];

        $response = Http::timeout(30)
            ->retry(2, 500)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->post('https://api.deepseek.com/v1/chat/completions', $payload);

        if (!$response->successful()) {
            \Log::error('DeepSeek API request failed (generateArticleJsonByCategory).', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        return data_get($response->json(), 'choices.0.message.content');
    }

    /**
     * Generate quiz questions for a given level using DeepSeek.
     * Returns an array of questions in seeder format:
     * [['question' => '...', 'options' => ['A', 'B', 'C', 'D'], 'correct_answer' => '...'], ...]
     */
    public static function generateQuizQuestionsForLevel(int $level): ?array
    {
        $apiKey = config('services.deepseek.key');
        if (empty($apiKey)) {
            \Log::warning('DeepSeek API key is not configured (services.deepseek.key is empty).');
            return null;
        }

        $systemPrompt = <<<'SYS'
You are a quiz author for a blood and organ donation platform. Generate exactly 10 multiple-choice questions.

Return ONLY a valid JSON array. No markdown, no code fences, no extra text.
Each element must have exactly: "question", "options", "correct_answer".

Rules:
- "question": string, clear and concise.
- "options": array of exactly 4 strings (the possible answers).
- "correct_answer": string, must be exactly one of the 4 option strings.

Example format:
[{"question":"Which blood type is the universal donor?","options":["A+","B+","AB+","O-"],"correct_answer":"O-"}]

Topics: blood donation, organ donation, eligibility, storage, transplantation, compatibility, safety. Increase difficulty with level.
SYS;

        $userPrompt = "Generate 10 quiz questions for level {$level}. Difficulty should increase with level. Return only the JSON array.";

        $payload = [
            'model' => 'deepseek-chat',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.7,
        ];

        $response = Http::timeout(60)
            ->retry(2, 500)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->post('https://api.deepseek.com/v1/chat/completions', $payload);

        if (!$response->successful()) {
            \Log::error('DeepSeek API request failed (generateQuizQuestionsForLevel).', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        $raw = data_get($response->json(), 'choices.0.message.content');
        if (!$raw || !is_string($raw)) {
            return null;
        }

        $raw = preg_replace('/^[\s\n]*```(?:json)?\s*/i', '', $raw);
        $raw = preg_replace('/\s*```\s*$/i', '', $raw);
        $raw = trim($raw);

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            \Log::warning('DeepSeek quiz response was not valid JSON.', ['raw' => substr($raw, 0, 500)]);
            return null;
        }

        $valid = [];
        foreach ($decoded as $i => $q) {
            if (
                !empty($q['question']) && is_string($q['question'])
                && !empty($q['options']) && is_array($q['options'])
                && isset($q['correct_answer']) && is_string($q['correct_answer'])
            ) {
                $opt = array_values(array_slice($q['options'], 0, 4));
                if (count($opt) >= 2 && in_array($q['correct_answer'], $opt, true)) {
                    $valid[] = [
                        'question' => trim($q['question']),
                        'options' => $opt,
                        'correct_answer' => trim($q['correct_answer']),
                    ];
                }
            }
        }

        return $valid ?: null;
    }
}