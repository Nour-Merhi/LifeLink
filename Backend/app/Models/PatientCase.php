<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use App\Models\Hospital;
use App\Models\FinancialDonation;

class PatientCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'full_name',
        'date_of_birth',
        'gender',
        'case_title',
        'description',
        'severity',
        'target_amount',
        'current_funding',
        'hospital_name',
        'hospital_id',
        'due_date',
        'status',
        'image',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'due_date' => 'date',
        'target_amount' => 'decimal:2',
        'current_funding' => 'decimal:2',
    ];

    protected static function booted()
    {
        static::creating(function ($patientCase) {
            // Only generate if not already set
            if (!$patientCase->code) {
                $patientCase->code = 'PC-' . strtoupper(Str::random(8)); // PC-ABCDEFGH
            }
        });
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }

    public function financialDonations()
    {
        return $this->hasMany(FinancialDonation::class, 'patient_case_id');
    }

    // Calculate age from date of birth
    public function getAgeAttribute()
    {
        return $this->date_of_birth->age;
    }

    // Calculate days remaining until due date
    public function getDaysRemainingAttribute()
    {
        $now = now();
        $dueDate = $this->due_date;
        
        if ($dueDate < $now) {
            return 0;
        }
        
        return $now->diffInDays($dueDate);
    }

    // Get donor count for this case
    public function getDonorsCountAttribute()
    {
        return $this->financialDonations()
            ->where('status', 'completed')
            ->distinct('donor_id')
            ->count();
    }

    // Update current funding when donations are completed
    public function updateFunding()
    {
        $this->current_funding = $this->financialDonations()
            ->where('status', 'completed')
            ->sum('donation_amount');
        $this->save();
    }
}
