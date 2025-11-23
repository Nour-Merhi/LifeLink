<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class AfterDeathPledge extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone_nb',
        'date_of_birth',
        'gender',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'marital_status',
        'education_level',
        'professional_status',
        'work_type',
        'mother_name',
        'spouse_name',
        'id_photo_path',
        'father_id_photo_path',
        'mother_id_photo_path',
        'pledged_organs',
        'blood_type',
        'status',
    ];

    protected $casts = [
        'pledged_organs' => 'array',
        'date_of_birth' => 'date',
    ];

    protected static function booted()
    {
        static::creating(function ($pledge) {
            // Only generate if not already set
            if (!$pledge->code) {
                $pledge->code = 'AD-' . strtoupper(Str::random(8)); // AD-ABCDEFGH
            }
        });
    }

    // Helper method to get full name
    public function getFullNameAttribute()
    {
        $nameParts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name
        ]);
        return implode(' ', $nameParts);
    }

    // Helper method to get age
    public function getAgeAttribute()
    {
        if (!$this->date_of_birth) {
            return null;
        }
        
        try {
            // Ensure we have a Carbon instance
            $dob = $this->date_of_birth instanceof \Carbon\Carbon 
                ? $this->date_of_birth 
                : \Carbon\Carbon::parse($this->date_of_birth);
            
            // Calculate age using diffInYears and cast to integer
            return (int) $dob->diffInYears(\Carbon\Carbon::now());
        } catch (\Exception $e) {
            return null;
        }
    }

    // Helper method to format pledged organs as string
    public function getPledgedOrgansStringAttribute()
    {
        if (empty($this->pledged_organs)) {
            return 'None';
        }
        
        // Check if "all-organs" is in the array
        if (in_array('all-organs', $this->pledged_organs)) {
            return 'All Organs';
        }
        
        // Map organ keys to display names
        $organMap = [
            'heart' => 'Heart',
            'corneas' => 'Corneas',
            'liver' => 'Liver',
            'skin' => 'Skin',
            'kidneys' => 'Kidneys',
            'bones' => 'Bones',
            'lungs' => 'Lungs',
            'valves' => 'Valves',
            'pancrease' => 'Pancreas',
            'tendons' => 'Tendons',
            'intestines' => 'Intestines',
            'blood-vessels' => 'Blood Vessels',
        ];
        
        $organs = array_map(function($organ) use ($organMap) {
            return $organMap[$organ] ?? ucfirst(str_replace('-', ' ', $organ));
        }, $this->pledged_organs);
        
        return implode(', ', $organs);
    }
}
