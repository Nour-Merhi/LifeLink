<?php

namespace App\Http\Controllers;

class PublicDonationStatsController extends Controller
{
    /**
     * Public worldwide donation statistics for the landing page.
     *
     * Note: These are worldwide estimates (not LifeLink database totals).
     * We return explicit units and sources so the frontend can render them clearly.
     */
    public function index()
    {
        try {
            // ---- Worldwide estimates (static snapshot) ----
            // Keep these values explicit and easy to update when sources change.
            $year = 2024;

            // Global blood donations collected annually (estimate).
            // Commonly reported on WHO blood safety pages; keep as a number for animation.
            $blood_donations_per_year = 118500000;

            // Global solid organ transplants performed annually (estimate).
            // GODT / WHO-ONT reported totals are ~170k+ for recent years.
            $organ_transplants_per_year = 173700;

            // Global organ transplant breakdown by organ type (approx, same year).
            // Source: GODT / WHO-ONT. These are commonly cited headline numbers.
            $kidney = 110467;
            $liver = 42497;
            $heart = 10287;
            $lung = 8236;
            $pancreas = 2066;
            $known_sum = $kidney + $liver + $heart + $lung + $pancreas;
            $other = max($organ_transplants_per_year - $known_sum, 0);

            // Share of people who donated money (behavior metric; percentage, not count).
            // World Giving Index is a common source; keep as percent for UI.
            $donated_money_share_pct = 0;

            return response()->json([
                'scope' => 'worldwide',
                'year' => $year,
                'metrics' => [
                    'blood_donations_per_year' => $blood_donations_per_year,
                    'organ_transplants_per_year' => $organ_transplants_per_year,
                    'donated_money_share_pct' => $donated_money_share_pct,
                ],
                'organ_transplants_breakdown' => [
                    'kidney' => $kidney,
                    'liver' => $liver,
                    'heart' => $heart,
                    'lung' => $lung,
                    'pancreas' => $pancreas,
                    'other' => $other,
                ],
                'sources' => [
                    [
                        'label' => 'WHO (Blood safety and availability)',
                        'url' => 'https://www.who.int/health-topics/blood-products#tab=tab_1',
                    ],
                    [
                        'label' => 'WHO-ONT / GODT (Transplant Observatory)',
                        'url' => 'https://www.transplant-observatory.org/',
                    ],
                    [
                        'label' => 'CAF World Giving Index (for “donated money” share)',
                        'url' => 'https://www.cafonline.org/about-us/research/caf-world-giving-index',
                    ],
                ],
                'note' => 'Worldwide estimates. Units differ by metric (counts vs %).',
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching public donation stats:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch donation statistics',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}

