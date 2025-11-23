<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\StaffRole;

class StaffPermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_role_id',
        'permission',
        'granted',
    ];

    public function staffRole()
    {
        return $this->belongsTo(StaffRole::class, 'staff_role_id');
    }
}
