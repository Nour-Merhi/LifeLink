<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FinancialDonation;
use App\Models\PatientCase;
use App\Models\Donor;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinancialController extends Controller
{
    /**
     * Get financial metrics for dashboard
     */
    public function getMetrics()
    {
        try {
            // Total Funds Raised (all completed donations)
            $totalFundsRaised = FinancialDonation::where('status', 'completed')
                ->sum('donation_amount');

            // Monthly Donations (current month)
            $currentMonthStart = Carbon::now()->startOfMonth();
            $monthlyDonations = FinancialDonation::where('status', 'completed')
                ->where('created_at', '>=', $currentMonthStart)
                ->sum('donation_amount');

            // Last month for comparison
            $lastMonthStart = Carbon::now()->subMonth()->startOfMonth();
            $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();
            $lastMonthDonations = FinancialDonation::where('status', 'completed')
                ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
                ->sum('donation_amount');

            $monthlyChange = $lastMonthDonations > 0 
                ? round((($monthlyDonations - $lastMonthDonations) / $lastMonthDonations) * 100, 2)
                : 0;

            // Active Campaigns (active patient cases)
            $activeCampaigns = PatientCase::where('status', 'active')->count();
            
            // Last month active campaigns for comparison
            $lastMonthActiveCampaigns = PatientCase::where('status', 'active')
                ->where('created_at', '<=', $lastMonthEnd)
                ->count();
            
            $campaignsChange = $lastMonthActiveCampaigns > 0
                ? round((($activeCampaigns - $lastMonthActiveCampaigns) / $lastMonthActiveCampaigns) * 100, 2)
                : 0;

            // Patients Funded (cases with status 'done'/'funded' or fully funded)
            $patientsFunded = PatientCase::where(function($query) {
                    $query->whereIn('status', ['done', 'funded'])
                        ->orWhereRaw('current_funding >= target_amount');
                })
                ->count();

            // Last month patients funded for comparison
            $lastMonthPatientsFunded = PatientCase::where(function($query) use ($lastMonthEnd) {
                    $query->whereIn('status', ['done', 'funded'])
                        ->orWhereRaw('current_funding >= target_amount');
                })
                ->where('updated_at', '<=', $lastMonthEnd)
                ->count();

            $patientsFundedChange = $lastMonthPatientsFunded > 0
                ? round((($patientsFunded - $lastMonthPatientsFunded) / $lastMonthPatientsFunded) * 100, 2)
                : 0;

            // Total funds change (compare with last month)
            $lastMonthTotalFunds = FinancialDonation::where('status', 'completed')
                ->where('created_at', '<=', $lastMonthEnd)
                ->sum('donation_amount');

            $totalFundsChange = $lastMonthTotalFunds > 0
                ? round((($totalFundsRaised - $lastMonthTotalFunds) / $lastMonthTotalFunds) * 100, 2)
                : 0;

            return response()->json([
                'metrics' => [
                    [
                        'title' => 'Total Funds Raised',
                        'value' => '$' . number_format($totalFundsRaised, 2),
                        'change' => ($totalFundsChange >= 0 ? '+' : '') . number_format($totalFundsChange, 2) . '% vs last month',
                    ],
                    [
                        'title' => 'Monthly Donations',
                        'value' => '$' . number_format($monthlyDonations, 2),
                        'change' => ($monthlyChange >= 0 ? '+' : '') . number_format($monthlyChange, 2) . '% vs last month',
                    ],
                    [
                        'title' => 'Active Campaigns',
                        'value' => (string)$activeCampaigns,
                        'change' => ($campaignsChange >= 0 ? '+' : '') . number_format($campaignsChange, 2) . '% vs last month',
                    ],
                    [
                        'title' => 'Patients Funded',
                        'value' => (string)$patientsFunded,
                        'change' => ($patientsFundedChange >= 0 ? '+' : '') . number_format($patientsFundedChange, 2) . '% vs last month',
                    ],
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching financial metrics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'metrics' => [],
                'error' => 'Failed to fetch financial metrics'
            ], 500);
        }
    }

    /**
     * Get top 5 donors by total donation amount (all time)
     */
    public function getTopDonors()
    {
        try {
            // Registered donors (have donor_id)
            $registered = FinancialDonation::where('status', 'completed')
                ->whereNotNull('donor_id')
                ->select('donor_id', DB::raw('SUM(donation_amount) as total_amount'), DB::raw('MAX(created_at) as last_donation_date'))
                ->groupBy('donor_id')
                ->orderByRaw('SUM(donation_amount) DESC')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    $donor = Donor::with('user')->find($item->donor_id);
                    $user = $donor?->user;
                    $name = 'Anonymous';
                    if ($user) {
                        $name = trim(($user->first_name ?? '') . ' ' . ($user->middle_name ?? '') . ' ' . ($user->last_name ?? ''));
                        if ($name === '') $name = 'Anonymous';
                    }
                    return ['name' => $name, 'total_amount' => (float) $item->total_amount, 'date' => Carbon::parse($item->last_donation_date)->format('Y-m-d')];
                });

            // Guest donors (donor_id null)
            $guestDonations = FinancialDonation::where('status', 'completed')->whereNull('donor_id')->get();
            $guestByKey = [];
            foreach ($guestDonations as $d) {
                $key = trim($d->name ?? '') ?: (trim($d->email ?? '') ?: 'Anonymous');
                if ($key === '') $key = 'Anonymous';
                if (!isset($guestByKey[$key])) $guestByKey[$key] = ['name' => $key, 'total_amount' => 0, 'last_date' => null];
                $guestByKey[$key]['total_amount'] += (float) $d->donation_amount;
                $dt = $d->created_at;
                if (!$guestByKey[$key]['last_date'] || ($dt && $dt > $guestByKey[$key]['last_date'])) {
                    $guestByKey[$key]['last_date'] = $dt;
                }
            }
            $guests = collect($guestByKey)->map(fn ($item) => [
                'name' => $item['name'],
                'total_amount' => $item['total_amount'],
                'date' => $item['last_date'] ? Carbon::parse($item['last_date'])->format('Y-m-d') : '',
            ])->values();

            $all = $registered->concat($guests)->sortByDesc('total_amount')->take(5)->map(function ($item) {
                return ['name' => $item['name'], 'date' => $item['date'] ?? '', 'amount' => '$' . number_format($item['total_amount'], 2)];
            })->values();

            return response()->json(['topDonors' => $all], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching top donors', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'topDonors' => [],
                'error' => 'Failed to fetch top donors'
            ], 500);
        }
    }

    /**
     * Get active cases for dashboard
     */
    public function getActiveCases()
    {
        try {
            $activeCases = PatientCase::where('status', 'active')
                ->orderByRaw("CASE severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END")
                ->orderBy('due_date', 'asc')
                ->limit(6) // Limit to 6 for dashboard
                ->get()
                ->map(function ($case) {
                    $age = $case->date_of_birth ? Carbon::parse($case->date_of_birth)->age : null;
                    $daysRemaining = $case->due_date
                        ? (int) max(0, Carbon::now()->diffInDays(Carbon::parse($case->due_date), false))
                        : 0;

                    $donorsCount = (int) $case->financialDonations()
                        ->where('status', 'completed')
                        ->selectRaw('COUNT(DISTINCT donor_id) as c')
                        ->value('c');

                    return [
                        'id' => $case->id,
                        'patientName' => $case->full_name,
                        'condition' => $case->case_title,
                        'age' => $age,
                        'currentFunding' => floatval($case->current_funding ?? 0),
                        'targetFunding' => floatval($case->target_amount ?? 0),
                        'donorsCount' => $donorsCount,
                        'medicalCenter' => $case->hospital_name ?? 'N/A',
                        'daysRemaining' => $daysRemaining,
                    ];
                });

            return response()->json([
                'activeCases' => $activeCases
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching active cases', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'activeCases' => [],
                'error' => 'Failed to fetch active cases'
            ], 500);
        }
    }

    /**
     * Get all patient cases for PatientFunding component
     */
    public function getAllPatientCases()
    {
        try {
            $patientCases = PatientCase::with('hospital')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($case) {
                    $age = Carbon::parse($case->date_of_birth)->age;
                    $daysRemaining = (int) max(0, Carbon::now()->diffInDays(Carbon::parse($case->due_date), false));
                    
                    $donorsCount = (int) $case->financialDonations()
                        ->where('status', 'completed')
                        ->selectRaw('COUNT(DISTINCT donor_id) as c')
                        ->value('c');

                    return [
                        'id' => $case->id,
                        'code' => $case->code,
                        'patientName' => $case->full_name,
                        'condition' => $case->case_title,
                        'description' => $case->description,
                        'age' => $age,
                        'currentFunding' => floatval($case->current_funding),
                        'targetFunding' => floatval($case->target_amount),
                        'donorsCount' => $donorsCount,
                        'hospital' => $case->hospital_name,
                        'daysRemaining' => $daysRemaining,
                        'status' => $case->status,
                        'severity' => $case->severity,
                        'created_at' => $case->created_at->format('Y-m-d'),
                    ];
                });

            return response()->json([
                'patientCases' => $patientCases,
                'total' => $patientCases->count()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching all patient cases', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'patientCases' => [],
                'total' => 0,
                'error' => 'Failed to fetch patient cases'
            ], 500);
        }
    }

    /**
     * Get a single transaction by ID or code (for admin view/edit modals)
     */
    public function getTransactionDetails($id)
    {
        try {
            $query = FinancialDonation::with(['donor.user', 'patientCase.hospital']);
            if (is_numeric($id)) {
                $donation = $query->where('id', $id)->firstOrFail();
            } else {
                $donation = $query->where('code', $id)->firstOrFail();
            }

            $user = $donation->donor?->user;
            $donorName = $donation->name;
            if ($user) {
                $donorName = trim(($user->first_name ?? '') . ' ' . ($user->middle_name ?? '') . ' ' . ($user->last_name ?? '')) ?: $donation->name;
            }

            return response()->json([
                'donation' => [
                    'id' => $donation->id,
                    'code' => $donation->code,
                    'status' => $donation->status,
                    'donation_amount' => floatval($donation->donation_amount),
                    'amount' => floatval($donation->donation_amount),
                    'payment_method' => $donation->payment_method,
                    'name' => $donorName ?? $donation->name,
                    'email' => $donation->email ?? $user?->email ?? null,
                    'phone' => $donation->phone ?? $user?->phone_nb ?? null,
                    'address' => $donation->address,
                    'donation_type' => $donation->donation_type,
                    'preference' => $donation->preference,
                    'created_at' => $donation->created_at?->format('Y-m-d'),
                    'donor' => $donation->donor && $user ? [
                        'user' => [
                            'first_name' => $user->first_name ?? null,
                            'last_name' => $user->last_name ?? null,
                            'email' => $user->email ?? null,
                            'phone_nb' => $user->phone_nb ?? null,
                        ],
                    ] : null,
                    'patientCase' => $donation->patientCase ? [
                        'full_name' => $donation->patientCase->full_name,
                        'case_title' => $donation->patientCase->case_title,
                        'hospital_name' => $donation->patientCase->hospital_name ?? ($donation->patientCase->hospital?->name ?? null),
                    ] : null,
                ]
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Transaction not found'], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching transaction details', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch transaction details'], 500);
        }
    }

    /**
     * Get all transactions
     */
    public function getTransactions()
    {
        try {
            $transactions = FinancialDonation::with(['donor.user', 'patientCase'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($donation) {
                    $donor = $donation->donor;
                    $user = $donor?->user;
                    
                    $donorName = $donation->name ?? 'Anonymous';
                    if ($user) {
                        $donorName = trim(($user->first_name ?? '') . ' ' . ($user->middle_name ?? '') . ' ' . ($user->last_name ?? ''));
                    } elseif ($donation->name) {
                        $donorName = $donation->name;
                    }

                    $beneficiaryName = 'General Patient Fund';
                    if ($donation->patientCase) {
                        $beneficiaryName = $donation->patientCase->full_name;
                    }

                    // Get hospital name
                    $hospitalName = 'N/A';
                    if ($donation->patientCase && $donation->patientCase->hospital) {
                        $hospitalName = $donation->patientCase->hospital->name;
                    } elseif ($donation->patientCase) {
                        $hospitalName = $donation->patientCase->hospital_name;
                    }

                    // Format payment method
                    $paymentMethod = $donation->payment_method;
                    if ($paymentMethod === 'credit card') {
                        $paymentMethod = 'credit_card';
                    } elseif ($paymentMethod === 'cash') {
                        $paymentMethod = 'cash'; 
                    } elseif ($paymentMethod === 'wish') {
                        $paymentMethod = 'wish_money';
                    }

                    return [
                        'id' => $donation->code,
                        'db_id' => $donation->id, // Database ID for API calls
                        'donor_name' => $donorName,
                        'donor_id' => $donor ? $donor->code : 'N/A',
                        'beneficiary_name' => $beneficiaryName,
                        'hospital_name' => $hospitalName,
                        'transactionType' => 'Donation',
                        'status' => $donation->status,
                        'amount' => floatval($donation->donation_amount),
                        'date' => $donation->created_at->format('Y-m-d'),
                        'time' => $donation->created_at->format('h:i A'),
                        'payment_method' => $paymentMethod,
                        'created_at' => $donation->created_at->format('Y-m-d'),
                        'donation_type' => $donation->donation_type,
                        'name' => $donation->name,
                        'email' => $donation->email,
                        'phone' => $donation->phone,
                        'address' => $donation->address,
                        'preference' => $donation->preference,
                    ];
                });

            return response()->json([
                'transactions' => $transactions,
                'total' => $transactions->count()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching transactions', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'transactions' => [],
                'total' => 0,
                'error' => 'Failed to fetch transactions'
            ], 500);
        }
    }

    /**
     * Store a new patient case
     */
    public function storePatientCase(Request $request)
    {
        try {
            $validated = $request->validate([
                'full_name' => 'required|string|max:255',
                'date_of_birth' => 'required|date|before:today',
                'gender' => 'required|in:male,female,other',
                'case_title' => 'required|string|max:255',
                'description' => 'required|string',
                'severity' => 'required|in:high,medium,low',
                'target_amount' => 'required|numeric|min:0.01',
                'hospital_id' => 'nullable|integer|exists:hospitals,id',
                'due_date' => 'required|date|after:today',
                'image' => 'nullable|string', // Base64 image
            ]);

            // Handle image upload (base64)
            $imagePath = null;
            if (!empty($validated['image'])) {
                $imagePath = $this->saveBase64Image($validated['image'], 'patient_cases');
            }

            // Get hospital name if hospital_id is provided
            $hospitalName = null;
            if (!empty($validated['hospital_id'])) {
                $hospital = Hospital::find($validated['hospital_id']);
                $hospitalName = $hospital ? $hospital->name : null;
            }

            $patientCase = PatientCase::create([
                'full_name' => $validated['full_name'],
                'date_of_birth' => $validated['date_of_birth'],
                'gender' => $validated['gender'],
                'case_title' => $validated['case_title'],
                'description' => $validated['description'],
                'severity' => $validated['severity'],
                'target_amount' => $validated['target_amount'],
                'hospital_id' => $validated['hospital_id'] ?? null,
                'hospital_name' => $hospitalName,
                'due_date' => $validated['due_date'],
                'image' => $imagePath,
                'status' => 'active',
                'current_funding' => 0.00,
            ]);

            $patientCase->load('hospital');

            return response()->json([
                'message' => 'Patient case created successfully',
                'patientCase' => $patientCase
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating patient case:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create patient case: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get patient case details with donors
     */
    public function getPatientCaseDetails($id)
    {
        try {
            // Find patient case by ID or code
            $patientCase = PatientCase::where(function($query) use ($id) {
                    $query->where('id', $id)
                          ->orWhere('code', $id);
                })
                ->with('hospital')
                ->firstOrFail();

            // Calculate age
            $age = Carbon::parse($patientCase->date_of_birth)->age;
            
            // Calculate days remaining
            $daysRemaining = (int) max(0, Carbon::now()->diffInDays(Carbon::parse($patientCase->due_date), false));
            
            // Get all donors who funded this patient case
            $donations = FinancialDonation::where('patient_case_id', $patientCase->id)
                ->where('status', 'completed')
                ->with(['donor.user'])
                ->orderBy('created_at', 'desc')
                ->get();

            $donors = $donations->map(function ($donation) {
                $donorName = 'Anonymous';
                if ($donation->donor && $donation->donor->user) {
                    $user = $donation->donor->user;
                    $donorName = trim(($user->first_name ?? '') . ' ' . ($user->middle_name ?? '') . ' ' . ($user->last_name ?? ''));
                } elseif ($donation->name) {
                    $donorName = $donation->name;
                }

                return [
                    'name' => $donorName,
                    'amount' => floatval($donation->donation_amount),
                    'date' => $donation->created_at->format('Y-m-d'),
                    'payment_method' => $donation->payment_method,
                ];
            })->unique('name')->values();

            // Calculate funding percentage
            $fundingPercentage = $patientCase->target_amount > 0 
                ? round(($patientCase->current_funding / $patientCase->target_amount) * 100, 2)
                : 0;

            $caseData = [
                'id' => $patientCase->id,
                'code' => $patientCase->code,
                'patientName' => $patientCase->full_name,
                'condition' => $patientCase->case_title,
                'description' => $patientCase->description,
                'age' => $age,
                'currentFunding' => floatval($patientCase->current_funding),
                'targetFunding' => floatval($patientCase->target_amount),
                'donorsCount' => $donors->count(),
                'hospital' => $patientCase->hospital->name ?? $patientCase->hospital_name ?? 'N/A',
                'hospitalId' => $patientCase->hospital_id,
                'daysRemaining' => $daysRemaining,
                'status' => $patientCase->status,
                'severity' => $patientCase->severity,
                'image' => $patientCase->image,
                'fundingPercentage' => $fundingPercentage,
                'dateOfBirth' => $patientCase->date_of_birth->format('Y-m-d'),
                'gender' => $patientCase->gender,
                'dueDate' => $patientCase->due_date->format('Y-m-d'),
                'created_at' => $patientCase->created_at->format('Y-m-d'),
                'donors' => $donors,
                'totalDonations' => $donations->sum('donation_amount'),
            ];

            return response()->json([
                'patientCase' => $caseData
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Patient case not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching patient case details:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to fetch patient case details'
            ], 500);
        }
    }

    /**
     * Update a patient case
     */
    public function updatePatientCase(Request $request, $id)
    {
        try {
            $patientCase = PatientCase::where(function($query) use ($id) {
                    $query->where('id', $id)
                          ->orWhere('code', $id);
                })
                ->firstOrFail();

            $validated = $request->validate([
                'full_name' => 'nullable|string|max:255',
                'date_of_birth' => 'nullable|date|before:today',
                'gender' => 'nullable|in:male,female,other',
                'case_title' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'severity' => 'nullable|in:high,medium,low',
                'target_amount' => 'nullable|numeric|min:0.01',
                'hospital_id' => 'nullable|integer|exists:hospitals,id',
                'due_date' => 'nullable|date',
                'status' => 'nullable|in:active,funded,done,expired,cancelled',
                'image' => 'nullable|string', // Base64 image
            ]);

            // Handle image upload (base64) if provided
            if (!empty($validated['image'])) {
                $imagePath = $this->saveBase64Image($validated['image'], 'patient_cases');
                $validated['image'] = $imagePath;
            } else {
                unset($validated['image']); // Don't update image if not provided
            }

            // Get hospital name if hospital_id is provided
            if (!empty($validated['hospital_id'])) {
                $hospital = Hospital::find($validated['hospital_id']);
                if ($hospital) {
                    $validated['hospital_name'] = $hospital->name;
                }
            }

            $patientCase->update($validated);
            $patientCase->load('hospital');

            return response()->json([
                'message' => 'Patient case updated successfully',
                'patientCase' => $patientCase
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Patient case not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error updating patient case:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to update patient case: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save base64 image to storage
     */
    private function saveBase64Image($base64Image, $folder = 'patient_cases')
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
            $filename = 'patient_case_' . time() . '_' . uniqid() . '.' . $extension;
            $path = 'uploads/' . $folder . '/' . $filename;

            // Create directory if it doesn't exist
            $directory = public_path('uploads/' . $folder);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            file_put_contents(public_path($path), $imageData);

            return $path;
        } catch (\Exception $e) {
            Log::error('Error saving base64 image:', [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}
