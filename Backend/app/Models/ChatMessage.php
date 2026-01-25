<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\ChatSession;

class ChatMessage extends Model
{
    protected $fillable = [
        'chat_session_id',
        'sender',
        'message',
    ];

    public function session(){
        return $this->belongsTo(ChatSession::class, 'chat_session_id');
    }
}
