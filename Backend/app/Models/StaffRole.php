<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\Hospital;
use App\Models\User;
use App\Models\StaffPermission;

class StaffRole extends Model
{
    use HasFactory;

    protected $fillable = [
        'hospital_id',
        'user_id',
        'role_name',
        'is_active',
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function permissions()
    {
        return $this->hasMany(StaffPermission::class, 'staff_role_id');
    }
}
