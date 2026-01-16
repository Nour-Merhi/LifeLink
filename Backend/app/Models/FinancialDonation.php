<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use App\Models\Donor;

class FinancialDonation extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'donor_id',
        'name',
        'email',
        'phone',
        'address',
        'donation_type',
        'donation_amount',
        'recipient_chosen',
        'patient_case_id',
        'payment_method',
        'status',
        'notes',
    ];

    protected $casts = [
        'donation_amount' => 'decimal:2',
    ];

    protected static function booted()
    {
        static::creating(function ($donation) {
            // Only generate if not already set
            if (!$donation->code) {
                $donation->code = 'FD-' . strtoupper(Str::random(8)); // FD-ABCDEFGH
            }
        });
    }

    public function donor()
    {
        return $this->belongsTo(Donor::class, 'donor_id');
    }

    public function patientCase()
    {
        return $this->belongsTo(PatientCase::class, 'patient_case_id');
    }
}
