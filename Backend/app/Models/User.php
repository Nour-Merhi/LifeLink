<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;


use App\Models\Donor;
use App\Models\MobilePhlebotomists;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone_nb',
        'role',
        'password',
        'code', 
    ];

    protected static function booted()
    {
        static::creating(function ($user) {
            // Only generate if not already set
            if (!$user->code) {
                $user->code = 'US-' . strtoupper(Str::random(8)); // MN-ABCDEFGH
            }
        });
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function donor(){
        return $this->hasOne(Donor::class, 'user_id');
    }
    public function mobilePhlebotomists(){
        return $this->hasOne(MobilePhlebotomist::class, 'id');
    }
    
}
