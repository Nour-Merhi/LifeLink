<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Services\DeepSeekService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ArticleController extends Controller
{
    /**
     * Display a listing of articles (public - for home page)
     */
    public function index()
    {
        try {
            $articles = Article::where('is_published', true)
                ->with('author')
                ->orderBy('published_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($article) {
                    $arr = $article->toArray();
                    // Return full URL for path-based images (works cross-origin from frontend)
                    if (!empty($arr['image']) && !str_starts_with($arr['image'], 'data:') && !str_starts_with($arr['image'], 'http')) {
                        $arr['image_url'] = asset(ltrim($arr['image'], '/'));
                    } else {
                        $arr['image_url'] = $arr['image'] ?? null;
                    }
                    return $arr;
                });

            return response()->json([
                'articles' => $articles,
                'total' => $articles->count()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching articles:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'articles' => [],
                'total' => 0,
                'error' => 'Failed to fetch articles'
            ], 500);
        }
    }

    /**
     * Display all articles (admin - includes unpublished)
     */
    public function indexAdmin()
    {
        try {
            $articles = Article::with('author')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'articles' => $articles,
                'total' => $articles->count()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching articles:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'articles' => [],
                'total' => 0,
                'error' => 'Failed to fetch articles'
            ], 500);
        }
    }

    /**
     * Store a newly created article
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string|max:1000',
                'content' => 'nullable|string',
                'image' => 'nullable|string', // Base64 image
                'category' => 'required|string|max:100',
                'is_published' => 'boolean',
            ]);

            $user = Auth::user();
            
            // Handle image upload (base64)
            $imagePath = null;
            if (!empty($validated['image'])) {
                // Save base64 image
                $imagePath = $this->saveBase64Image($validated['image']);
            }

            $article = Article::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'content' => $validated['content'] ?? null,
                'image' => $imagePath,
                'category' => $validated['category'],
                'is_published' => $validated['is_published'] ?? false,
                'author_id' => $user->id,
                'published_at' => ($validated['is_published'] ?? false) ? Carbon::now() : null,
            ]);

            $article->load('author');

            return response()->json([
                'message' => 'Article created successfully',
                'article' => $article
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating article:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create article: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified article (can be by id or code)
     */
    public function show($identifier)
    {
        try {
            // Try to find by id first (numeric), then by code (string)
            $article = Article::where(function($query) use ($identifier) {
                    if (is_numeric($identifier)) {
                        $query->where('id', $identifier);
                    } else {
                        $query->where('code', $identifier);
                    }
                })
                ->with('author')
                ->firstOrFail();
            $data = $article->toArray();
            if (!empty($data['image']) && !str_starts_with($data['image'], 'data:') && !str_starts_with($data['image'], 'http')) {
                $data['image_url'] = asset(ltrim($data['image'], '/'));
            } else {
                $data['image_url'] = $data['image'] ?? null;
            }
            return response()->json([
                'article' => $data
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Article not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error fetching article:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch article: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified article
     */
    public function update(Request $request, $code)
    {
        try {
            $article = Article::where('code', $code)->firstOrFail();

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string|max:1000',
                'content' => 'nullable|string',
                'image' => 'nullable|string', // Base64 image
                'category' => 'sometimes|string|max:100',
                'is_published' => 'boolean',
            ]);

            // Handle image upload if provided
            if (isset($validated['image']) && !empty($validated['image'])) {
                // Delete old image if exists
                if ($article->image && file_exists(public_path($article->image))) {
                    unlink(public_path($article->image));
                }
                $validated['image'] = $this->saveBase64Image($validated['image']);
            } elseif (isset($validated['image']) && empty($validated['image'])) {
                // If empty string, remove image
                if ($article->image && file_exists(public_path($article->image))) {
                    unlink(public_path($article->image));
                }
                $validated['image'] = null;
            } else {
                // Don't update image if not provided
                unset($validated['image']);
            }

            // Handle published_at
            if (isset($validated['is_published'])) {
                if ($validated['is_published'] && !$article->is_published) {
                    // Publishing for the first time
                    $validated['published_at'] = Carbon::now();
                } elseif (!$validated['is_published']) {
                    // Unpublishing
                    $validated['published_at'] = null;
                }
            }

            $article->update($validated);
            $article->load('author');

            return response()->json([
                'message' => 'Article updated successfully',
                'article' => $article
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Article not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error updating article:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update article: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified article
     */
    public function destroy($code)
    {
        try {
            $article = Article::where('code', $code)->firstOrFail();

            // Delete image if exists
            if ($article->image && file_exists(public_path($article->image))) {
                unlink(public_path($article->image));
            }

            $article->delete();

            return response()->json([
                'message' => 'Article deleted successfully'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Article not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting article:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to delete article: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save base64 image to storage
     */
    private function saveBase64Image($base64Image)
    {
        try {
            // Check if it's a data URL
            if (strpos($base64Image, 'data:image') === 0) {
                list($type, $base64Image) = explode(';', $base64Image);
                list(, $base64Image) = explode(',', $base64Image);
            }

            $imageData = base64_decode($base64Image);
            $imageInfo = getimagesizefromstring($imageData);

            if ($imageInfo === false) {
                throw new \Exception('Invalid image data');
            }

            $extension = image_type_to_extension($imageInfo[2], false);
            $filename = 'article_' . time() . '_' . uniqid() . '.' . $extension;
            $path = 'uploads/articles/' . $filename;

            // Create directory if it doesn't exist
            $directory = public_path('uploads/articles');
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            file_put_contents(public_path($path), $imageData);

            return $path;
        } catch (\Exception $e) {
            \Log::error('Error saving base64 image:', [
                'error' => $e->getMessage()
            ]);
            throw new \Exception('Failed to save image: ' . $e->getMessage());
        }
    }

    public function generateAIArticle(Request $request){
        try {
            // New flow: frontend sends only { category: blood|organ|health }
            // Backward compatible flow: if title/description are provided, keep the old behavior.
            $validated = $request->validate([
                'category' => 'required|string|in:blood,organ,health',
                // Back-compat inputs (optional)
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string|max:1000',
                'content' => 'nullable|string',
            ]);

            $category = strtolower(trim($validated['category']));

            $hasLegacyInputs = isset($validated['title']) || isset($validated['description']) || isset($validated['content']);

            if ($hasLegacyInputs) {
                // Legacy: generate only content
                if (empty($validated['title']) || empty($validated['description'])) {
                    return response()->json([
                        'message' => 'Validation failed',
                        'errors' => [
                            'title' => ['title is required when using the legacy AI generation mode'],
                            'description' => ['description is required when using the legacy AI generation mode'],
                        ],
                    ], 422);
                }

                $generatedContent = DeepSeekService::generateArticleContent(
                    $validated['title'],
                    $validated['description'],
                    $category,
                    $validated['content'] ?? null
                );

                if (!$generatedContent) {
                    return response()->json([
                        'message' => 'Failed to generate article content from AI provider.'
                    ], 502);
                }

                $article = Article::create([
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'content' => $generatedContent,
                    'category' => $category,
                    'is_published' => false,
                    'author_id' => null,
                    'published_at' => null,
                ]);

                return response()->json([
                    'message' => 'Article generated successfully',
                    'mode' => 'legacy_content_only',
                    'content' => $generatedContent,
                    'article' => $article,
                ], 201);
            }

            // New: generate full JSON article
            $aiRaw = DeepSeekService::generateArticleJsonByCategory($category);

            if (!$aiRaw) {
                if (empty(config('services.deepseek.key'))) {
                    return response()->json([
                        'message' => 'DeepSeek API key is not configured. Please set DEEPKEY_API_KEY or DEEPSEEK_API_KEY in your Backend .env file, then run: php artisan config:clear',
                    ], 500);
                }
                return response()->json([
                    'message' => 'Failed to generate article from AI provider.'
                ], 502);
            }

            $json = $this->extractFirstJsonObject($aiRaw);
            if ($json === null) {
                return response()->json([
                    'message' => 'AI response did not contain valid JSON.',
                    'raw' => $aiRaw,
                ], 502);
            }

            $articleData = json_decode($json, true);
            if (!is_array($articleData)) {
                return response()->json([
                    'message' => 'AI returned invalid JSON.',
                    'raw_json' => $json,
                ], 502);
            }

            $normalized = $this->normalizeAndValidateAiArticleJson($articleData, $category);
            if ($normalized === null) {
                return response()->json([
                    'message' => 'AI JSON is missing required fields.',
                    'raw_json' => $json,
                ], 502);
            }

            // Create article from the JSON (review/publish later)
            $article = Article::create([
                'title' => $normalized['title'],
                'description' => $normalized['description'],
                'content' => $normalized['content'],
                'category' => $normalized['category'],
                'is_published' => false,
                'author_id' => null,
                'published_at' => null,
            ]);

            return response()->json([
                'message' => 'Article generated successfully',
                'mode' => 'json_from_category',
                'article_json' => $normalized,
                'article' => $article,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error generating article:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['message' => 'Failed to generate article: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Best-effort extraction of the first JSON object from an LLM response.
     */
    private function extractFirstJsonObject(string $text): ?string
    {
        $text = trim($text);

        // Fast path: already valid JSON object
        $decoded = json_decode($text, true);
        if (is_array($decoded)) {
            return $text;
        }

        $start = strpos($text, '{');
        $end = strrpos($text, '}');
        if ($start === false || $end === false || $end <= $start) {
            return null;
        }

        $candidate = substr($text, $start, ($end - $start) + 1);
        $decoded2 = json_decode($candidate, true);
        if (!is_array($decoded2)) {
            return null;
        }

        return $candidate;
    }

    /**
     * Ensure required keys exist and normalize category.
     * Returns normalized array or null if invalid.
     */
    private function normalizeAndValidateAiArticleJson(array $data, string $requestedCategory): ?array
    {
        $title = isset($data['title']) ? trim((string) $data['title']) : '';
        $description = isset($data['description']) ? trim((string) $data['description']) : '';
        $content = isset($data['content']) ? trim((string) $data['content']) : '';
        $category = isset($data['category']) ? strtolower(trim((string) $data['category'])) : $requestedCategory;

        // Force the stored category to the requested one (prevents model drifting)
        $category = $requestedCategory;

        if ($title === '' || $description === '' || $content === '') {
            return null;
        }

        if (!in_array($category, ['blood', 'organ', 'health'], true)) {
            return null;
        }

        // Basic length sanity (avoid empty/garbage)
        if (mb_strlen($title) > 255) {
            $title = mb_substr($title, 0, 255);
        }
        if (mb_strlen($description) > 1000) {
            $description = mb_substr($description, 0, 1000);
        }

        return [
            'title' => $title,
            'category' => $category,
            'description' => $description,
            'content' => $content,
        ];
    }

    public function publishAIArticle($id){
        try{
            $article = Article::where('id', $id)->firstOrFail();
            $article->update([
                'is_published' => true,
                'published_at' => Carbon::now(),
            ]);
            return response()->json(['message' => 'Article published successfully'], 200);
        } catch (\Exception $e) {
            \Log::error('Error publishing article:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['message' => 'Failed to publish article: ' . $e->getMessage()], 500);
        }
    }

    public function getAIArticles(){
        try{
            $articles = Article::whereNull('author_id')
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json(['articles' => $articles, 'total' => $articles->count()], 200);
        } catch (\Exception $e) {
            \Log::error('Error getting AI articles:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['message' => 'Failed to get AI articles: ' . $e->getMessage()], 500);
        }
    }
}
