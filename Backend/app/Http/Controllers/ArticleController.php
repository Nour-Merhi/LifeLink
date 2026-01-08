<?php

namespace App\Http\Controllers;

use App\Models\Article;
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
            
            return response()->json([
                'article' => $article
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
}
