<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use App\Models\User;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title',
        'description',
        'content',
        'image',
        'category',
        'is_published',
        'author_id',
        'published_at',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($article) {
            // Only generate if not already set
            if (!$article->code) {
                $article->code = 'ART-' . strtoupper(Str::random(8)); // ART-ABCDEFGH
            }
        });
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
