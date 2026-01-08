<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SupportController extends Controller
{
    /**
     * Store a new support ticket
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'subject' => 'required|string|max:255',
                'category' => 'required|string|max:100',
                'message' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $userId = $user ? $user->id : null;

            $ticket = SupportTicket::create([
                'user_id' => $userId,
                'subject' => $request->subject,
                'category' => $request->category,
                'message' => $request->message,
                'status' => 'open',
            ]);

            return response()->json([
                'message' => 'Support ticket created successfully',
                'ticket' => [
                    'id' => $ticket->id,
                    'code' => $ticket->code,
                    'subject' => $ticket->subject,
                    'category' => $ticket->category,
                    'status' => $ticket->status,
                    'created_at' => $ticket->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating support ticket:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create support ticket',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get all support tickets for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to view your support tickets.'
                ], 401);
            }

            $tickets = SupportTicket::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'tickets' => $tickets,
                'total' => $tickets->count()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching support tickets:', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch support tickets',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get a specific support ticket
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in to view support tickets.'
                ], 401);
            }

            $ticket = SupportTicket::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$ticket) {
                return response()->json([
                    'message' => 'Support ticket not found'
                ], 404);
            }

            return response()->json([
                'ticket' => $ticket
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching support ticket:', [
                'user_id' => Auth::id(),
                'ticket_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch support ticket',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}
