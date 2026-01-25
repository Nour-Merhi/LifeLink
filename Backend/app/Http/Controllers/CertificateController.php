<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Donor;
use App\Mail\CertificateIssued;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;

class CertificateController extends Controller
{
    /**
     * List certificates and return metrics for admin dashboard.
     */
    public function index(Request $request)
    {
        try {
            $certificates = Certificate::with(['donor', 'hospital'])
                ->orderBy('created_at', 'desc')
                ->take(6)
                ->get();

            $total = $certificates->count();
            $thisMonth = $certificates->filter(fn ($c) => $c->created_at->isCurrentMonth())->count();
            $uniqueDonors = $certificates->pluck('donor_id')->filter()->unique()->count();

            $data = $certificates->map(fn ($c) => [
                'id' => $c->id,
                'donor_id' => $c->donor_id,
                'hospital_id' => $c->hospital_id,
                'hospital_name' => $c->hospital?->name ?? $c->hospital?->hospital_name ?? null,
                'donor_name' => $c->donor_name,
                'donor_code' => $c->donor?->code,
                'description_option' => $c->description_option,
                'certificate_date' => $c->certificate_date?->format('Y-m-d'),
                'image_path' => $c->image_path,
                'image_url' => $c->image_path ? asset('storage/' . $c->image_path) : null,
                'created_at' => $c->created_at?->toIso8601String(),
            ]);

            return response()->json([
                'certificates' => $data,
                'metrics' => [
                    'total_certificates' => $total,
                    'certificates_this_month' => $thisMonth,
                    'donors_with_certificates' => $uniqueDonors,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching certificates: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'certificates' => [],
                'metrics' => [
                    'total_certificates' => 0,
                    'certificates_this_month' => 0,
                    'donors_with_certificates' => 0,
                ],
                'message' => 'Failed to fetch certificates.',
            ], 500);
        }
    }

    /**
     * Store a new certificate (admin).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'donor_id' => 'nullable|exists:donors,id',
            'donor_name' => 'required|string|max:255',
            'description_option' => 'required|string|max:255',
            'certificate_date' => 'nullable|date',
            'image' => 'nullable|file|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = 'cert_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $imagePath = $file->storeAs('certificates', $filename, 'public');
        }

        $certificate = Certificate::create([
            'donor_id' => $validated['donor_id'] ?? null,
            'hospital_id' => $validated['hospital_id'] ?? null,
            'donor_name' => $validated['donor_name'],
            'description_option' => $validated['description_option'],
            'certificate_date' => isset($validated['certificate_date']) ? $validated['certificate_date'] : null,
            'image_path' => $imagePath,
        ]);

        // Send email notification to donor if donor_id exists
        if ($certificate->donor_id) {
            try {
                $donor = Donor::with('user')->find($certificate->donor_id);
                if ($donor && $donor->user && $donor->user->email) {
                    Mail::to($donor->user->email)->send(new CertificateIssued($certificate));
                } else {
                    \Log::warning('Skipping certificate issued email: donor user email is missing.', [
                        'donor_id' => $certificate->donor_id,
                        'certificate_id' => $certificate->id,
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to send certificate issued email:', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'certificate_id' => $certificate->id,
                ]);
            }
        }

        return response()->json([
            'message' => 'Certificate created successfully.',
            'certificate' => [
                'id' => $certificate->id,
                'donor_id' => $certificate->donor_id,
                'hospital_id' => $certificate->hospital_id,
                'hospital_name' => $certificate->hospital?->name ?? $certificate->hospital?->hospital_name ?? null,
                'donor_name' => $certificate->donor_name,
                'description_option' => $certificate->description_option,
                'certificate_date' => $certificate->certificate_date?->format('Y-m-d'),
                'image_path' => $certificate->image_path,
                'image_url' => $certificate->image_path ? asset('storage/' . $certificate->image_path) : null,
                'created_at' => $certificate->created_at?->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Show a single certificate.
     */
    public function show(string $id)
    {
        $certificate = Certificate::with(['donor', 'hospital'])->findOrFail($id);
        return response()->json([
            'certificate' => [
                'id' => $certificate->id,
                'donor_id' => $certificate->donor_id,
                'hospital_id' => $certificate->hospital_id,
                'hospital_name' => $certificate->hospital?->name ?? $certificate->hospital?->hospital_name ?? null,
                'donor_name' => $certificate->donor_name,
                'donor_code' => $certificate->donor?->code,
                'description_option' => $certificate->description_option,
                'certificate_date' => $certificate->certificate_date?->format('Y-m-d'),
                'image_path' => $certificate->image_path,
                'image_url' => $certificate->image_path ? asset('storage/' . $certificate->image_path) : null,
                'created_at' => $certificate->created_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Delete a certificate.
     */
    public function destroy(string $id)
    {
        $certificate = Certificate::findOrFail($id);
        if ($certificate->image_path) {
            Storage::disk('public')->delete($certificate->image_path);
        }
        $certificate->delete();
        return response()->json(['message' => 'Certificate deleted.']);
    }

    /**
     * Get certificates for the authenticated donor.
     */
    public function myCertificates(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $donor = Donor::where('user_id', $user->id)->first();
            if (!$donor) {
                return response()->json([
                    'certificates' => [],
                    'message' => 'Donor profile not found',
                ]);
            }

            $certificates = Certificate::with('hospital')
                ->where('donor_id', $donor->id)
                ->orderBy('created_at', 'desc')
                ->get();

            $data = $certificates->map(fn ($c) => [
                'id' => $c->id,
                'donor_name' => $c->donor_name,
                'hospital_id' => $c->hospital_id,
                'hospital_name' => $c->hospital?->name ?? $c->hospital?->hospital_name ?? null,
                'description_option' => $c->description_option,
                'certificate_date' => $c->certificate_date?->format('Y-m-d'),
                'image_path' => $c->image_path,
                'image_url' => $c->image_path ? asset('storage/' . $c->image_path) : null,
                'created_at' => $c->created_at?->toIso8601String(),
            ]);

            return response()->json([
                'certificates' => $data,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching donor certificates: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'certificates' => [],
                'message' => 'Failed to fetch certificates.',
            ], 500);
        }
    }

    /**
     * Download certificate image for donor.
     */
    public function download(string $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $donor = Donor::where('user_id', $user->id)->first();
            if (!$donor) {
                return response()->json(['message' => 'Donor profile not found'], 404);
            }

            $certificate = Certificate::findOrFail($id);
            
            // Verify the certificate belongs to this donor
            if ($certificate->donor_id !== $donor->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if (!$certificate->image_path || !Storage::disk('public')->exists($certificate->image_path)) {
                return response()->json(['message' => 'Certificate image not found'], 404);
            }

            $filePath = Storage::disk('public')->path($certificate->image_path);
            $fileName = 'certificate-' . $certificate->id . '.png';

            return response()->download($filePath, $fileName, [
                'Content-Type' => 'image/png',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error downloading certificate: ' . $e->getMessage(), [
                'certificate_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Failed to download certificate'], 500);
        }
    }

    /**
     * Update certificate image (add/replace).
     */
    public function updateImage(Request $request, string $id)
    {
        $request->validate([
            'image' => 'required|file|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        $certificate = Certificate::findOrFail($id);
        if ($certificate->image_path) {
            Storage::disk('public')->delete($certificate->image_path);
        }

        $file = $request->file('image');
        $filename = 'cert_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $imagePath = $file->storeAs('certificates', $filename, 'public');
        $certificate->update(['image_path' => $imagePath]);

        return response()->json([
            'message' => 'Certificate image updated.',
            'image_path' => $imagePath,
            'image_url' => asset('storage/' . $imagePath),
        ]);
    }
}
