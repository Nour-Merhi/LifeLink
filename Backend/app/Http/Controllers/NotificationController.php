<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CustomNotification;

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications
     */
    public function index(Request $request, $hospitalId = null)
    {
        $hospitalId = $hospitalId ?? $request->input('hospital_id');
        
        $query = CustomNotification::where('hospital_id', $hospitalId)
            ->with(['hospital', 'user'])
            ->orderBy('created_at', 'desc');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('is_read')) {
            $query->where('is_read', $request->is_read === 'true');
        }

        $notifications = $query->paginate($request->input('per_page', 20));

        $unreadCount = CustomNotification::where('hospital_id', $hospitalId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications->items(),
            'unread_count' => $unreadCount,
            'total' => $notifications->total(),
            'current_page' => $notifications->currentPage(),
        ], 200);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        $notification = CustomNotification::findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json([
            'message' => 'Notification marked as read',
            'notification' => $notification,
        ], 200);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $hospitalId = $request->input('hospital_id');
        
        CustomNotification::where('hospital_id', $hospitalId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'message' => 'All notifications marked as read',
        ], 200);
    }
}
