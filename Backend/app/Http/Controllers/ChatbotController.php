<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Models\PlatformFaq;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;

class ChatbotController extends Controller
{
    public function chat(Request $request)
    {
        $rules = [
            'message' => 'required|string|max:2000',
        ];
        if (!Auth::check()) {
            $rules['visitor_id'] = 'required|string|max:64';
        }
        $validated = $request->validate($rules);
        $message = $validated['message'];

        if (Auth::check()) {
            $userId = Auth::id();
            $session = ChatSession::firstOrCreate(
                ['user_id' => $userId],
                ['visitor_id' => null]
            );
        } else {
            $visitorId = $validated['visitor_id'];
            $session = ChatSession::firstOrCreate(
                ['visitor_id' => $visitorId],
                ['user_id' => null]
            );
        }

        ChatMessage::create([
            'chat_session_id' => $session->id,
            'sender' => 'user',
            'message' => $message,
        ]);

        $faq = PlatformFaq::where('question', 'LIKE', '%' . $message . '%')->first();

        if ($faq) {
            $reply = $faq->answer;
        } else {
            $faqText = PlatformFaq::all()->map(function ($f) {
                return $f->question . ' -> ' . $f->answer;
            })->implode("\n");

            $systemPrompt = 'You are LifeLink AI assistant for a blood and organ donation platform. Answer helpfully and concisely. Use these FAQs when relevant: ' . $faqText . '. If the question is unrelated, answer briefly or politely redirect to donation/platform topics.';

            $apiKey = config('services.deepseek.key');
            if (empty($apiKey)) {
                $reply = 'AI is not configured. Please contact support.';
            } else {
                $response = Http::timeout(30)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ])
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model' => 'deepseek-chat',
                        'messages' => [
                            ['role' => 'system', 'content' => $systemPrompt],
                            ['role' => 'user', 'content' => $message],
                        ],
                    ]);

                if ($response->successful()) {
                    $reply = $response->json('choices.0.message.content') ?? 'I couldn\'t generate a reply. Please try again.';
                } else {
                    \Log::warning('Chatbot DeepSeek API error', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                    $reply = 'I\'m temporarily unable to process that. Please try again in a moment.';
                }
            }
        }

        ChatMessage::create([
            'chat_session_id' => $session->id,
            'sender' => 'bot',
            'message' => $reply,
        ]);

        return response()->json(['reply' => $reply], 200);
    }
}
