<?php

namespace App\Http\Controllers;

use App\Models\PlatformFaq;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PlatformFaqController extends Controller
{
    /**
     * Get all FAQs (public endpoint)
     * Optionally filter by category
     */
    public function index(Request $request)
    {
        try {
            $query = PlatformFaq::query();

            // Filter by category if provided
            if ($request->has('category') && $request->category !== 'All' && !empty($request->category)) {
                $query->where('category', $request->category);
            }

            $faqs = $query->orderBy('created_at', 'desc')->get();

            // Get unique categories for frontend
            $categories = PlatformFaq::distinct()
                ->whereNotNull('category')
                ->pluck('category')
                ->filter()
                ->values()
                ->toArray();

            return response()->json([
                'faqs' => $faqs,
                'categories' => $categories,
                'total' => $faqs->count()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching FAQs:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'faqs' => [],
                'categories' => [],
                'total' => 0,
                'error' => 'Failed to fetch FAQs'
            ], 500);
        }
    }
}
