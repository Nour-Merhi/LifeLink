<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\ChatMessage;
use App\Models\User;


class ChatSession extends Model
{
    protected $fillable = [
        'user_id',
        'visitor_id'
    ];

    public function messages(){
        return $this->hasMany(ChatMessage::class, 'chat_session_id');
    }

    public function user(){
        return $this->belongsTo(User::class, 'user_id');
    }
}
