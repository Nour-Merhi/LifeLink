<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\Donor;


class BloodType extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'rh_factory'
    ];

    public function donor(){
        return $this->hasMany(Donor::class, 'id');
    }
}
