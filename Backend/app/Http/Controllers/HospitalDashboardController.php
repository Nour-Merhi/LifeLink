<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Hospital;
use App\Models\Appointment;
use App\Models\HomeAppointment;
use App\Models\HospitalAppointment;
use App\Models\Donor;
use App\Models\EmergencyRequest;
use App\Models\BloodInventory;
use App\Models\CustomNotification;
use App\Models\MobilePhlebotomist;
use App\Models\Message;
use App\Models\LivingDonor;
use App\Models\AfterDeathPledge;
use App\Models\HospitalSetting;
use App\Models\BloodType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use App\Mail\LivingOrganAppointmentSuggestions;
use App\Mail\LivingOrganAppointmentCompleted;
use App\Mail\LivingOrganAppointmentCancelled;
use App\Mail\LivingOrganMedicalClearedThankYou;

class HospitalDashboardController extends Controller
{
    private function resolveHospitalId(Request $request, $hospitalId = null)
    {
        $hospitalId = $hospitalId ?? $request->input('hospital_id');

        if (!$hospitalId && $request->user()) {
            $user = $request->user();
            $role = strtolower((string)($user->role ?? ''));
            if ($role === 'manager' && $user->healthCenterManager) {
                $hospitalId = $user->healthCenterManager->hospital_id;
            }
        }

        return $hospitalId;
    }

    /**
     * Hospital manager: view messages sent by their phlebotomists.
     * Returns a list of phlebotomists (for tabs) and message feed.
     */
    public function getPhlebotomistMessages(Request $request, $hospitalId = null)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, $hospitalId);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $user = $request->user();
            $role = strtolower((string)($user->role ?? ''));
            if ($role !== 'manager') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $hospital = Hospital::with(['healthCenterManager.user'])->find($hospitalId);
            if (!$hospital) {
                return response()->json(['message' => 'Hospital not found'], 404);
            }

            // Ensure manager belongs to this hospital (prevent cross-hospital access)
            if (!$user->healthCenterManager || (int)$user->healthCenterManager->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $managerUserId = $hospital->healthCenterManager?->user?->id;
            if (!$managerUserId) {
                return response()->json(['message' => 'Manager not found for this hospital'], 404);
            }

            $phlebotomists = MobilePhlebotomist::where('hospital_id', $hospitalId)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->get();

            $phlebotomistUsers = $phlebotomists
                ->filter(fn ($p) => (bool) $p->user)
                ->map(function ($p) {
                    $u = $p->user;
                    $nameParts = array_filter([$u->first_name ?? null, $u->middle_name ?? null, $u->last_name ?? null]);
                    $name = trim(implode(' ', $nameParts)) ?: ($u->email ?? 'N/A');
                    return [
                        'phlebotomist_id' => $p->id,
                        'user_id' => $u->id,
                        'name' => $name,
                        'email' => $u->email ?? null,
                        'phone_nb' => $u->phone_nb ?? null,
                    ];
                })
                ->values();

            $senderUserIds = $phlebotomistUsers->pluck('user_id')->values();

            // Messages between this manager and phlebotomists from the same hospital (bidirectional)
            $messages = Message::where(function ($q) use ($managerUserId, $senderUserIds) {
                    $q->where('receiver_id', $managerUserId)
                      ->whereIn('sender_id', $senderUserIds);
                })
                ->orWhere(function ($q) use ($managerUserId, $senderUserIds) {
                    $q->where('sender_id', $managerUserId)
                      ->whereIn('receiver_id', $senderUserIds);
                })
                ->with(['sender', 'receiver'])
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedMessages = $messages->map(function ($m) use ($managerUserId) {
                $sender = $m->sender;
                $senderName = 'N/A';
                if ($sender) {
                    $parts = array_filter([$sender->first_name ?? null, $sender->middle_name ?? null, $sender->last_name ?? null]);
                    $senderName = trim(implode(' ', $parts)) ?: ($sender->email ?? 'N/A');
                }

                $receiver = $m->receiver;
                $receiverName = 'N/A';
                if ($receiver) {
                    $parts = array_filter([$receiver->first_name ?? null, $receiver->middle_name ?? null, $receiver->last_name ?? null]);
                    $receiverName = trim(implode(' ', $parts)) ?: ($receiver->email ?? 'N/A');
                }

                return [
                    'id' => $m->id,
                    'code' => $m->code,
                    'sender_user_id' => $m->sender_id,
                    'receiver_user_id' => $m->receiver_id,
                    'senderName' => $senderName,
                    'receiverName' => $receiverName,
                    'subject' => $m->subject ?? 'N/A',
                    'body' => $m->body ?? 'N/A',
                    'created_at' => $m->created_at ? Carbon::parse($m->created_at)->toISOString() : null,
                    'date' => $m->created_at ? Carbon::parse($m->created_at)->format('Y-m-d h:i A') : 'N/A',
                    'read_at' => $m->read_at ? Carbon::parse($m->read_at)->format('Y-m-d h:i A') : null,
                    'is_sent_by_me' => (int) $m->sender_id === (int) $managerUserId,
                ];
            });

            return response()->json([
                'phlebotomists' => $phlebotomistUsers,
                'messages' => $formattedMessages,
                'total' => $formattedMessages->count(),
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching hospital phlebotomist messages:', [
                'user_id' => $request->user()?->id,
                'hospital_id' => $hospitalId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch messages',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Hospital manager: unread message count (from hospital phlebotomists).
     * "Unread" = incoming to manager where read_at is null.
     */
    public function getUnreadPhlebotomistMessagesCount(Request $request, $hospitalId = null)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, $hospitalId);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $user = $request->user();
            $role = strtolower((string)($user->role ?? ''));
            if ($role !== 'manager') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $hospital = Hospital::with(['healthCenterManager.user'])->find($hospitalId);
            if (!$hospital) {
                return response()->json(['message' => 'Hospital not found'], 404);
            }

            if (!$user->healthCenterManager || (int)$user->healthCenterManager->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $managerUserId = $hospital->healthCenterManager?->user?->id;
            if (!$managerUserId) {
                return response()->json(['message' => 'Manager not found for this hospital'], 404);
            }

            $phlebUserIds = MobilePhlebotomist::where('hospital_id', $hospitalId)
                ->pluck('user_id')
                ->filter()
                ->values();

            $unreadCount = Message::where('receiver_id', $managerUserId)
                ->whereIn('sender_id', $phlebUserIds)
                ->whereNull('read_at')
                ->count();

            return response()->json([
                'unread_count' => (int) $unreadCount,
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching unread phlebotomist message count:', [
                'user_id' => $request->user()?->id,
                'hospital_id' => $hospitalId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch unread count',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Hospital manager: mark all incoming messages from hospital phlebotomists as read.
     */
    public function markPhlebotomistMessagesRead(Request $request, $hospitalId = null)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, $hospitalId);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $user = $request->user();
            $role = strtolower((string)($user->role ?? ''));
            if ($role !== 'manager') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $hospital = Hospital::with(['healthCenterManager.user'])->find($hospitalId);
            if (!$hospital) {
                return response()->json(['message' => 'Hospital not found'], 404);
            }

            if (!$user->healthCenterManager || (int)$user->healthCenterManager->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $managerUserId = $hospital->healthCenterManager?->user?->id;
            if (!$managerUserId) {
                return response()->json(['message' => 'Manager not found for this hospital'], 404);
            }

            $phlebUserIds = MobilePhlebotomist::where('hospital_id', $hospitalId)
                ->pluck('user_id')
                ->filter()
                ->values();

            $updated = Message::where('receiver_id', $managerUserId)
                ->whereIn('sender_id', $phlebUserIds)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            return response()->json([
                'message' => 'Messages marked as read',
                'updated' => (int) $updated,
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error marking phlebotomist messages read:', [
                'user_id' => $request->user()?->id,
                'hospital_id' => $hospitalId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to mark messages as read',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Hospital manager: send a message to one of their phlebotomists (reply/new).
     */
    public function sendPhlebotomistMessage(Request $request, $hospitalId = null)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, $hospitalId);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $user = $request->user();
            $role = strtolower((string)($user->role ?? ''));
            if ($role !== 'manager') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $hospital = Hospital::with(['healthCenterManager.user'])->find($hospitalId);
            if (!$hospital) {
                return response()->json(['message' => 'Hospital not found'], 404);
            }

            if (!$user->healthCenterManager || (int)$user->healthCenterManager->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $managerUserId = $hospital->healthCenterManager?->user?->id;
            if (!$managerUserId) {
                return response()->json(['message' => 'Manager not found for this hospital'], 404);
            }

            $data = $request->validate([
                'receiver_user_id' => 'required|integer|exists:users,id',
                'subject' => 'required|string|max:255',
                'body' => 'required|string|max:5000',
            ]);

            // Ensure receiver is a phlebotomist belonging to this hospital
            $validReceiver = MobilePhlebotomist::where('hospital_id', $hospitalId)
                ->whereHas('user', function ($q) use ($data) {
                    $q->where('id', $data['receiver_user_id']);
                })
                ->exists();

            if (!$validReceiver) {
                return response()->json([
                    'message' => 'Invalid receiver. You can only message phlebotomists in your hospital.',
                ], 422);
            }

            $message = Message::create([
                'sender_id' => $managerUserId,
                'receiver_id' => (int) $data['receiver_user_id'],
                'subject' => $data['subject'],
                'body' => $data['body'],
            ]);

            $message->load(['sender', 'receiver']);

            $sender = $message->sender;
            $senderName = 'N/A';
            if ($sender) {
                $parts = array_filter([$sender->first_name ?? null, $sender->middle_name ?? null, $sender->last_name ?? null]);
                $senderName = trim(implode(' ', $parts)) ?: ($sender->email ?? 'N/A');
            }

            $receiver = $message->receiver;
            $receiverName = 'N/A';
            if ($receiver) {
                $parts = array_filter([$receiver->first_name ?? null, $receiver->middle_name ?? null, $receiver->last_name ?? null]);
                $receiverName = trim(implode(' ', $parts)) ?: ($receiver->email ?? 'N/A');
            }

            return response()->json([
                'message' => 'Message sent',
                'data' => [
                    'id' => $message->id,
                    'code' => $message->code,
                    'sender_user_id' => $message->sender_id,
                    'receiver_user_id' => $message->receiver_id,
                    'senderName' => $senderName,
                    'receiverName' => $receiverName,
                    'subject' => $message->subject ?? 'N/A',
                    'body' => $message->body ?? 'N/A',
                    'created_at' => $message->created_at ? Carbon::parse($message->created_at)->toISOString() : null,
                    'date' => $message->created_at ? Carbon::parse($message->created_at)->format('Y-m-d h:i A') : 'N/A',
                    'read_at' => $message->read_at ? Carbon::parse($message->read_at)->format('Y-m-d h:i A') : null,
                    'is_sent_by_me' => true,
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error sending hospital phlebotomist message:', [
                'user_id' => $request->user()?->id,
                'hospital_id' => $hospitalId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to send message',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Living donors (hospital-scoped) for Organ Coordination page.
     */
    public function getLivingDonors(Request $request)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, null);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $hospital = Hospital::find($hospitalId);
            if (!$hospital) {
                return response()->json(['message' => 'Hospital not found'], 404);
            }

            $livingDonors = LivingDonor::where('hospital_id', $hospitalId)
                ->orderBy('created_at', 'desc')
                ->get();

            $data = $livingDonors->map(function ($donor) use ($hospital) {
                return [
                    'id' => $donor->code,
                    'full_name' => $donor->full_name,
                    'email' => $donor->email,
                    'phone_nb' => $donor->phone_nb,
                    'blood_type' => $donor->blood_type,
                    'age' => $donor->age,
                    'gender' => $donor->gender,
                    'address' => $donor->address,
                    'organ' => $donor->organ,
                    'donation_type' => $donor->donation_type,
                    'medical_status' => $donor->medical_status,
                    'ethics_status' => $donor->ethics_status,
                    'appointment_status' => $donor->appointment_status,
                    'selected_appointment_at' => $donor->selected_appointment_at ? $donor->selected_appointment_at->toISOString() : null,
                    'hospital_selection' => $donor->hospital_selection,
                    'hospital_id' => $donor->hospital_id,
                    'hospital_name' => $hospital->name,
                    'recipient_full_name' => $donor->recipient_full_name,
                    'recipient_age' => $donor->recipient_age,
                    'recipient_contact' => $donor->recipient_contact,
                    'recipient_contact_type' => $donor->recipient_contact_type,
                    'recipient_blood_type' => $donor->recipient_blood_type,
                    'medical_conditions' => $donor->medical_conditions ?? [],
                    'created_at' => $donor->created_at ? $donor->created_at->format('Y-m-d') : null,
                ];
            });

            return response()->json([
                'hospital' => ['id' => $hospital->id, 'name' => $hospital->name],
                'living_donors' => $data,
                'total' => $data->count(),
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching hospital living donors:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'living_donors' => [],
                'total' => 0,
                'message' => 'Failed to fetch living donors'
            ], 500);
        }
    }

    /**
     * After-death pledges (hospital-scoped) for Organ Coordination page.
     */
    public function getAfterDeathPledges(Request $request)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, null);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $hospital = Hospital::find($hospitalId);
            if (!$hospital) {
                return response()->json(['message' => 'Hospital not found'], 404);
            }

            $pledges = AfterDeathPledge::where('hospital_id', $hospitalId)
                ->orderBy('created_at', 'desc')
                ->get();

            $data = $pledges->map(function ($pledge) use ($hospital) {
                return [
                    'id' => $pledge->code,
                    'full_name' => $pledge->full_name,
                    'email' => $pledge->email,
                    'phone_nb' => $pledge->phone_nb,
                    'blood_type' => $pledge->blood_type,
                    'age' => $pledge->age,
                    'gender' => $pledge->gender,
                    'address' => $pledge->address,
                    'pledged_organs' => $pledge->pledged_organs ?? [],
                    'pledged_organs_string' => $pledge->pledged_organs_string,
                    'status' => $pledge->status,
                    'hospital_selection' => $pledge->hospital_selection,
                    'hospital_id' => $pledge->hospital_id,
                    'hospital_name' => $hospital->name,
                    'emergency_contact_name' => $pledge->emergency_contact_name,
                    'emergency_contact_phone' => $pledge->emergency_contact_phone,
                    'marital_status' => $pledge->marital_status,
                    'education_level' => $pledge->education_level,
                    'professional_status' => $pledge->professional_status,
                    'work_type' => $pledge->work_type,
                    'mother_name' => $pledge->mother_name,
                    'spouse_name' => $pledge->spouse_name,
                    'id_photo' => $pledge->id_photo_path ? asset('storage/' . $pledge->id_photo_path) : null,
                    'father_id_photo' => $pledge->father_id_photo_path ? asset('storage/' . $pledge->father_id_photo_path) : null,
                    'mother_id_photo' => $pledge->mother_id_photo_path ? asset('storage/' . $pledge->mother_id_photo_path) : null,
                    'created_at' => $pledge->created_at ? $pledge->created_at->format('Y-m-d') : null,
                ];
            });

            return response()->json([
                'hospital' => ['id' => $hospital->id, 'name' => $hospital->name],
                'after_death_pledges' => $data,
                'total' => $data->count(),
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching hospital after-death pledges:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'after_death_pledges' => [],
                'total' => 0,
                'message' => 'Failed to fetch after-death pledges'
            ], 500);
        }
    }

    /**
     * Show living donor details (hospital-scoped) for view modal.
     */
    public function showLivingDonor(Request $request, string $code)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, null);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $hospital = Hospital::find($hospitalId);
            $user = $request->user();
            $managerName = null;
            if ($user) {
                $nameParts = array_filter([$user->first_name ?? null, $user->middle_name ?? null, $user->last_name ?? null]);
                $managerName = $nameParts ? implode(' ', $nameParts) : null;
            }

            $donor = LivingDonor::where('code', $code)->firstOrFail();
            if ((int)$donor->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            return response()->json([
                'living_donor' => [
                    'code' => $donor->code,
                    'full_name' => $donor->full_name,
                    'first_name' => $donor->first_name,
                    'middle_name' => $donor->middle_name,
                    'last_name' => $donor->last_name,
                    'email' => $donor->email,
                    'phone_nb' => $donor->phone_nb,
                    'address' => $donor->address,
                    'date_of_birth' => $donor->date_of_birth,
                    'age' => $donor->age ?? ($donor->date_of_birth ? Carbon::parse($donor->date_of_birth)->age : null),
                    'gender' => $donor->gender,
                    'blood_type' => $donor->blood_type,
                    'organ' => $donor->organ,
                    'donation_type' => $donor->donation_type,
                    'medical_conditions' => $donor->medical_conditions,
                    'medical_status' => $donor->medical_status,
                    'ethics_status' => $donor->ethics_status,
                    'appointment_status' => $donor->appointment_status,
                    'suggested_appointments' => $donor->suggested_appointments ?? [],
                    'suggestions_sent_at' => $donor->suggestions_sent_at,
                    'selected_appointment_at' => $donor->selected_appointment_at,
                    'selected_at' => $donor->selected_at,
                    'appointment_completed_at' => $donor->appointment_completed_at,
                    'appointment_cancelled_at' => $donor->appointment_cancelled_at,
                    'appointment_cancel_reason' => $donor->appointment_cancel_reason,
                    'agree_interest' => $donor->agree_interest,
                    'hospital_selection' => $donor->hospital_selection,
                    'hospital_id' => $donor->hospital_id,
                    'hospital_name' => $hospital ? $hospital->name : null,
                    'manager_name' => $managerName,
                    'recipient_full_name' => $donor->recipient_full_name,
                    'recipient_age' => $donor->recipient_age,
                    'recipient_contact' => $donor->recipient_contact,
                    'recipient_contact_type' => $donor->recipient_contact_type,
                    'recipient_blood_type' => $donor->recipient_blood_type,
                    'id_picture' => $donor->id_picture ? asset('storage/' . $donor->id_picture) : null,
                    'created_at' => $donor->created_at,
                    'updated_at' => $donor->updated_at,
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Living donor not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Error showing hospital living donor:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to fetch living donor details'], 500);
        }
    }

    /**
     * Show after-death pledge details (hospital-scoped) for view modal.
     */
    public function showAfterDeathPledge(Request $request, string $code)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, null);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $hospital = Hospital::find($hospitalId);
            $user = $request->user();
            $managerName = null;
            if ($user) {
                $nameParts = array_filter([$user->first_name ?? null, $user->middle_name ?? null, $user->last_name ?? null]);
                $managerName = $nameParts ? implode(' ', $nameParts) : null;
            }

            $pledge = AfterDeathPledge::where('code', $code)->firstOrFail();
            if ((int)$pledge->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            return response()->json([
                'after_death_pledge' => [
                    'code' => $pledge->code,
                    'full_name' => $pledge->full_name,
                    'first_name' => $pledge->first_name,
                    'middle_name' => $pledge->middle_name,
                    'last_name' => $pledge->last_name,
                    'email' => $pledge->email,
                    'phone_nb' => $pledge->phone_nb,
                    'address' => $pledge->address,
                    'age' => $pledge->age,
                    'gender' => $pledge->gender,
                    'blood_type' => $pledge->blood_type,
                    'pledged_organs' => $pledge->pledged_organs,
                    'pledged_organs_string' => $pledge->pledged_organs_string,
                    'emergency_contact_name' => $pledge->emergency_contact_name,
                    'emergency_contact_phone' => $pledge->emergency_contact_phone,
                    'mother_name' => $pledge->mother_name,
                    'spouse_name' => $pledge->spouse_name,
                    'marital_status' => $pledge->marital_status,
                    'education_level' => $pledge->education_level,
                    'professional_status' => $pledge->professional_status,
                    'work_type' => $pledge->work_type,
                    'hospital_selection' => $pledge->hospital_selection,
                    'hospital_id' => $pledge->hospital_id,
                    'hospital_name' => $hospital ? $hospital->name : null,
                    'manager_name' => $managerName,
                    'status' => $pledge->status,
                    'id_photo' => $pledge->id_photo_path ? asset('storage/' . $pledge->id_photo_path) : null,
                    'father_id_photo' => $pledge->father_id_photo_path ? asset('storage/' . $pledge->father_id_photo_path) : null,
                    'mother_id_photo' => $pledge->mother_id_photo_path ? asset('storage/' . $pledge->mother_id_photo_path) : null,
                    'created_at' => $pledge->created_at,
                    'updated_at' => $pledge->updated_at,
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'After-death pledge not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Error showing hospital after-death pledge:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to fetch pledge details'], 500);
        }
    }

    /**
     * Update living donor (hospital-scoped).
     */
    public function updateLivingDonor(Request $request, string $code)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, null);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $donor = LivingDonor::where('code', $code)->firstOrFail();
            if ((int)$donor->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $oldEthics = $donor->ethics_status;
            $oldAppointmentStatus = $donor->appointment_status;
            $oldMedical = $donor->medical_status;

            $validated = $request->validate([
                'medical_status' => 'nullable|in:not_started,in_progress,cleared,rejected',
                'ethics_status' => 'nullable|in:pending,approved,rejected,N/A',
            ]);

            $donor->fill($validated);

            // Step 2: If ethics approved, auto-clear medical state and move to scheduling
            if (array_key_exists('ethics_status', $validated) && $validated['ethics_status'] === 'approved' && $oldEthics !== 'approved') {
                $donor->medical_status = 'cleared';
                $donor->appointment_status = 'awaiting_scheduling';
            }

            // If rejected -> cancel workflow
            if (
                (array_key_exists('ethics_status', $validated) && $validated['ethics_status'] === 'rejected') ||
                (array_key_exists('medical_status', $validated) && $validated['medical_status'] === 'rejected')
            ) {
                $donor->appointment_status = 'cancelled';
                if (!$donor->appointment_cancelled_at) $donor->appointment_cancelled_at = now();
                $donor->appointment_cancel_reason = $donor->appointment_cancel_reason ?: 'Case rejected during review.';
            }

            $donor->save();

            // Final thank-you email when medical state becomes cleared
            try {
                if ($donor->medical_status === 'cleared' && $oldMedical !== 'cleared' && $donor->email) {
                    Mail::to($donor->email)->send(new LivingOrganMedicalClearedThankYou($donor));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send living organ medical cleared thank you email (hospital update)', [
                    'living_donor_code' => $donor->code,
                    'error' => $e->getMessage(),
                ]);
            }

            // Step 6 email (if it got cancelled here)
            try {
                if ($donor->appointment_status === 'cancelled' && $oldAppointmentStatus !== 'cancelled' && $donor->email) {
                    Mail::to($donor->email)->send(new LivingOrganAppointmentCancelled($donor, $donor->appointment_cancel_reason));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send living organ appointment cancelled email (hospital update)', [
                    'living_donor_code' => $donor->code,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'message' => 'Living donor updated',
                'living_donor' => $donor->fresh(),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Living donor not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating hospital living donor:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to update living donor'], 500);
        }
    }

    /**
     * Step 3 (hospital-scoped): Suggest appointment options and email donor.
     */
    public function suggestLivingDonorAppointments(Request $request, string $code)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, null);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $donor = LivingDonor::where('code', $code)->firstOrFail();
            if ((int)$donor->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $validated = $request->validate([
                'suggested_appointments' => 'required|array|min:1|max:10',
                'suggested_appointments.*' => 'required|string',
            ]);

            if (($donor->ethics_status ?? '') !== 'approved') {
                return response()->json(['message' => 'Ethics must be approved before suggesting appointments.'], 422);
            }

            $slots = array_values(array_filter(array_map(function ($s) {
                $v = trim((string)$s);
                return $v !== '' ? $v : null;
            }, $validated['suggested_appointments'])));

            if (count($slots) === 0) {
                return response()->json(['message' => 'Please provide at least one appointment option.'], 422);
            }

            $donor->suggested_appointments = $slots;
            $donor->suggestions_sent_at = now();
            $donor->appointment_status = 'awaiting_donor_choice';
            $donor->save();

            $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
            $dashboardUrl = $frontend . '/donor/my-appointments?focus=living&code=' . urlencode($donor->code);

            try {
                if ($donor->email) {
                    Mail::to($donor->email)->send(new LivingOrganAppointmentSuggestions($donor, $slots, $dashboardUrl));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send living organ appointment suggestions email (hospital)', [
                    'living_donor_code' => $donor->code,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'message' => 'Appointment options saved and email sent to donor.',
                'living_donor' => $donor->fresh(),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Living donor not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error suggesting hospital living donor appointments:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to suggest appointments'], 500);
        }
    }

    /**
     * Step 4/5/6 (hospital-scoped): Update appointment status and trigger emails.
     */
    public function updateLivingDonorAppointmentStatus(Request $request, string $code)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, null);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $donor = LivingDonor::where('code', $code)->firstOrFail();
            if ((int)$donor->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $oldStatus = $donor->appointment_status;
            $validated = $request->validate([
                'appointment_status' => 'required|in:awaiting_donor_choice,in_progress,completed,cancelled,awaiting_scheduling,awaiting_approval',
                'cancel_reason' => 'nullable|string|max:255',
            ]);

            $donor->appointment_status = $validated['appointment_status'];

            if ($validated['appointment_status'] === 'in_progress') {
                $donor->medical_status = 'in_progress';
            }

            if ($validated['appointment_status'] === 'completed') {
                if (!$donor->appointment_completed_at) $donor->appointment_completed_at = now();
            }

            if ($validated['appointment_status'] === 'cancelled') {
                if (!$donor->appointment_cancelled_at) $donor->appointment_cancelled_at = now();
                $donor->appointment_cancel_reason = $validated['cancel_reason'] ?? ($donor->appointment_cancel_reason ?: 'Appointment cancelled.');
            }

            $donor->save();

            if ($donor->appointment_status === 'completed' && $oldStatus !== 'completed' && $donor->email) {
                try {
                    Mail::to($donor->email)->send(new LivingOrganAppointmentCompleted($donor));
                } catch (\Exception $e) {
                    \Log::warning('Failed to send living organ appointment completed email (hospital)', [
                        'living_donor_code' => $donor->code,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if ($donor->appointment_status === 'cancelled' && $oldStatus !== 'cancelled' && $donor->email) {
                try {
                    Mail::to($donor->email)->send(new LivingOrganAppointmentCancelled($donor, $donor->appointment_cancel_reason));
                } catch (\Exception $e) {
                    \Log::warning('Failed to send living organ appointment cancelled email (hospital)', [
                        'living_donor_code' => $donor->code,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return response()->json([
                'message' => 'Appointment status updated.',
                'living_donor' => $donor->fresh(),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Living donor not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating hospital living donor appointment status:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to update appointment status'], 500);
        }
    }

    /**
     * Delete living donor (hospital-scoped).
     */
    public function deleteLivingDonor(Request $request, string $code)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, null);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $donor = LivingDonor::where('code', $code)->firstOrFail();
            if ((int)$donor->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $donor->delete();

            return response()->json(['message' => 'Living donor deleted'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Living donor not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting hospital living donor:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to delete living donor'], 500);
        }
    }

    /**
     * Update after-death pledge (hospital-scoped).
     */
    public function updateAfterDeathPledge(Request $request, string $code)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, null);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $pledge = AfterDeathPledge::where('code', $code)->firstOrFail();
            if ((int)$pledge->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $validated = $request->validate([
                'status' => 'nullable|in:active,cancelled',
                'email' => 'nullable|email|max:255',
                'phone_nb' => 'nullable|string|max:50',
                'emergency_contact_name' => 'nullable|string|max:255',
                'emergency_contact_phone' => 'nullable|string|max:50',
                'pledged_organs' => 'nullable|array|min:1',
                'pledged_organs.*' => 'in:all-organs,heart,corneas,liver,skin,kidneys,bones,lungs,valves,pancrease,tendons,intestines,blood-vessels,blood-vesseles',
            ]);

            $pledge->fill($validated);
            $pledge->save();

            return response()->json([
                'message' => 'After-death pledge updated',
                'after_death_pledge' => $pledge->fresh(),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'After-death pledge not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating hospital after-death pledge:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to update after-death pledge'], 500);
        }
    }

    /**
     * Delete after-death pledge (hospital-scoped).
     */
    public function deleteAfterDeathPledge(Request $request, string $code)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, null);
            if (!$hospitalId) {
                return response()->json(['message' => 'Hospital ID required'], 400);
            }

            $pledge = AfterDeathPledge::where('code', $code)->firstOrFail();
            if ((int)$pledge->hospital_id !== (int)$hospitalId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $pledge->delete();

            return response()->json(['message' => 'After-death pledge deleted'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'After-death pledge not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting hospital after-death pledge:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to delete after-death pledge'], 500);
        }
    }

    /**
     * Get dashboard overview for a specific hospital
     * Returns comprehensive dashboard data including metrics, appointments, and events
     */
    public function overview(Request $request, $hospitalId = null)
    {
        try {
            // TODO: Get hospital ID from authenticated user's hospital relationship
            // For now, get hospital from request parameter or input
            $hospitalId = $this->resolveHospitalId($request, $hospitalId);
            
            if (!$hospitalId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital ID required'
                ], 400);
            }

            $hospital = Hospital::find($hospitalId);
            if (!$hospital) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital not found'
                ], 404);
            }
            
            $today = now()->toDateString();
            $todayStart = now()->startOfDay();
            $todayEnd = now()->endOfDay();

            // === METRICS CALCULATIONS ===
            
            // 1. Urgent Donations (urgent appointments scheduled for today)
            $urgentDonations = Appointment::where('hospital_id', $hospitalId)
                ->where('appointment_type', 'urgent')
                ->whereDate('appointment_date', $today)
                ->where('state', 'pending')
                ->count();
            
            // 2. Regular Appointments (regular appointments scheduled for today)
            $regularAppointments = Appointment::where('hospital_id', $hospitalId)
                ->where('appointment_type', 'regular')
                ->whereDate('appointment_date', $today)
                ->where('state', 'pending')
                ->count();
            
            // 3. Pending Home Visits (home appointments pending assignment)
            $pendingHomeVisits = HomeAppointment::where('hospital_id', $hospitalId)
                ->where('state', 'pending')
                ->whereNull('phlebotomist_id') // Not yet assigned
                ->count();
            
            // 4. Phlebotomists On Duty (currently active/on duty)
            $phlebotomistsOnDuty = MobilePhlebotomist::where('hospital_id', $hospitalId)
                ->where('availability', 'onDuty')
                ->count();
            
            // 5. Critical Blood Shortages (blood inventory below threshold - e.g., < 10 units)
            $criticalThreshold = 10; // Configurable threshold
            try {
                $bloodInventory = BloodInventory::where('hospital_id', $hospitalId)
                    ->where('status', 'available')
                    ->select('blood_type_id', DB::raw('SUM(quantity) as total'))
                    ->groupBy('blood_type_id')
                    ->get();
                
                $criticalBloodShortages = $bloodInventory->filter(function($item) use ($criticalThreshold) {
                    return $item->total < $criticalThreshold;
                })->count();
            } catch (\Exception $e) {
                \Log::warning('Error fetching blood inventory for critical shortages:', [
                    'error' => $e->getMessage()
                ]);
                $criticalBloodShortages = 0; // Default to 0 if table doesn't exist
            }
            
            // 6. Pending Organ Matches (living donors or after-death pledges pending approval)
            $pendingOrganMatches = LivingDonor::where('hospital_id', $hospitalId)
                ->where(function($query) {
                    $query->where('medical_status', 'pending')
                          ->orWhere('ethics_status', 'pending');
                })
                ->count();
            
            // === HOSPITAL INFO ===
            $hospitalInfo = [
                'id' => $hospital->id,
                'name' => $hospital->name,
                'address' => $hospital->address,
                'status' => $hospital->status ?? 'verified',
                'code' => $hospital->code,
                'phone_nb' => $hospital->phone_nb,
                'email' => $hospital->email,
            ];
            
            // === TODAY'S APPOINTMENTS ===
            // Note: HospitalAppointment uses 'hospital_Id' (capital I) and relationship is 'appointments' (singular belongsTo)
            try {
                $todayAppointmentsList = HospitalAppointment::where('hospital_Id', $hospitalId)
                    ->where('state', 'pending')
                    ->with([
                        'donor.user',
                        'donor.bloodType',
                        'appointments'
                    ])
                    ->get()
                    ->filter(function($apt) use ($today) {
                        // Filter to ensure appointment is today
                        try {
                            $appointmentRelation = $apt->appointments;
                            $appointment = null;
                            if ($appointmentRelation instanceof \Illuminate\Database\Eloquent\Model) {
                                $appointment = $appointmentRelation;
                            } elseif (is_array($appointmentRelation) && !empty($appointmentRelation)) {
                                $appointment = (object)$appointmentRelation[0];
                            } elseif ($appointmentRelation instanceof \Illuminate\Support\Collection && $appointmentRelation->isNotEmpty()) {
                                $appointment = $appointmentRelation->first();
                            } else {
                                $appointment = $apt->appointments()->first();
                            }
                            if (!$appointment) return false;
                            
                            $apptDate = $appointment->appointment_date;
                            if ($apptDate instanceof Carbon) {
                                $apptDate = $apptDate->toDateString();
                            } elseif (is_string($apptDate)) {
                                // Already a string, just use it
                            } else {
                                // Try to convert
                                $apptDate = Carbon::parse($apptDate)->toDateString();
                            }
                            
                            $appointmentState = $appointment->state;
                            return $apptDate === $today && $appointmentState === 'pending';
                        } catch (\Exception $e) {
                            \Log::warning('Error filtering appointment:', [
                                'appt_id' => $apt->id ?? null,
                                'error' => $e->getMessage()
                            ]);
                            return false;
                        }
                    })
                    ->map(function($apt) {
                    try {
                        // Get appointment using the singular relationship name
                        $appointment = $apt->appointment;
                        $donor = $apt->donor;
                        $user = $donor && $donor->user ? $donor->user : null;
                        
                        // Extract time from appointment_time or time_slots
                        $timeDisplay = $apt->appointment_time ?? 'N/A';
                        if ($timeDisplay === 'N/A' && $appointment) {
                            $timeSlots = $appointment->time_slots ?? null;
                            if ($timeSlots) {
                                $slots = is_array($timeSlots) 
                                    ? $timeSlots 
                                    : (is_string($timeSlots) ? json_decode($timeSlots, true) : []);
                                
                                if ($slots && is_array($slots) && count($slots) > 0) {
                                    $firstSlot = $slots[0];
                                    if (is_array($firstSlot) && isset($firstSlot['start'])) {
                                        $timeDisplay = $firstSlot['start'];
                                    } elseif (is_string($firstSlot)) {
                                        $timeDisplay = $firstSlot;
                                    }
                                }
                            }
                        }
                        
                        $donorName = 'Unknown';
                        if ($user) {
                            $nameParts = array_filter([
                                $user->first_name ?? '',
                                $user->middle_name ?? '',
                                $user->last_name ?? ''
                            ]);
                            $donorName = trim(implode(' ', $nameParts)) ?: 'Unknown';
                        }
                        
                        $appointmentType = 'regular';
                        if ($appointment) {
                            $appointmentType = is_object($appointment) ? ($appointment->appointment_type ?? 'regular') : ($appointment['appointment_type'] ?? 'regular');
                        }
                        
                        return [
                            'id' => $apt->id,
                            'code' => $apt->code,
                            'time' => $timeDisplay,
                            'donor' => $donorName,
                            'type' => $appointmentType,
                            'bloodType' => ($donor && $donor->bloodType) 
                                ? ($donor->bloodType->type . ($donor->bloodType->rh_factor ?? '')) 
                                : 'N/A',
                            'status' => $apt->state ?? 'pending',
                            'appointment_date' => $appointment ? $appointment->appointment_date : null,
                        ];
                    } catch (\Exception $e) {
                        \Log::warning('Error mapping appointment in dashboard:', [
                            'appointment_id' => $apt->id ?? null,
                            'error' => $e->getMessage()
                        ]);
                        return null;
                    }
                })
                    ->filter() // Remove null entries
                    ->sortBy(function($apt) {
                        // Sort by time if available
                        return $apt['time'];
                    })
                    ->values();
            } catch (\Exception $e) {
                \Log::error('Error fetching today appointments:', [
                    'hospital_id' => $hospitalId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $todayAppointmentsList = collect([]); // Return empty collection on error
            }
            
            // === RECENT EVENTS ===
            // Get recent notifications, appointments, and activities
            $recentEvents = collect();
            
            // Recent urgent appointments created
            $recentUrgentAppts = Appointment::where('hospital_id', $hospitalId)
                ->where('appointment_type', 'urgent')
                ->where('created_at', '>=', now()->subHours(24))
                ->with('hospital')
                ->latest()
                ->take(5)
                ->get()
                ->map(function($apt) {
                    return [
                        'id' => 'urgent_' . $apt->id,
                        'type' => 'urgent',
                        'message' => "New urgent blood request: " . ($apt->blood_type ?? 'N/A') . " needed",
                        'time' => $apt->created_at->diffForHumans(),
                        'created_at' => $apt->created_at,
                    ];
                });
            $recentEvents = $recentEvents->merge($recentUrgentAppts);
            
            // Recent completed home visits
            $recentHomeVisits = HomeAppointment::where('hospital_id', $hospitalId)
                ->where('state', 'completed')
                ->where('created_at', '>=', now()->subHours(24))
                ->with(['donor.user', 'mobilePhlebotomist.user'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function($apt) {
                    $donorName = $apt->donor && $apt->donor->user 
                        ? trim(($apt->donor->user->first_name ?? '') . ' ' . ($apt->donor->user->last_name ?? ''))
                        : 'Donor';
                    $phlebName = $apt->mobilePhlebotomist && $apt->mobilePhlebotomist->user
                        ? trim(($apt->mobilePhlebotomist->user->first_name ?? '') . ' ' . ($apt->mobilePhlebotomist->user->last_name ?? ''))
                        : 'Phlebotomist';
                    
                    return [
                        'id' => 'home_' . $apt->id,
                        'type' => 'home',
                        'message' => "Home visit completed by " . $phlebName,
                        'time' => $apt->updated_at->diffForHumans(),
                        'created_at' => $apt->updated_at,
                    ];
                });
            $recentEvents = $recentEvents->merge($recentHomeVisits);
            
            // Recent donor arrivals (hospital appointments for today)
            $recentDonorArrivals = HospitalAppointment::where('hospital_Id', $hospitalId)
                ->whereHas('appointment', function($query) use ($today) {
                    $query->whereDate('appointment_date', $today)
                          ->where('state', 'pending');
                })
                ->where('created_at', '>=', now()->subHours(24))
                ->with(['donor.user'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function($apt) {
                    $donorName = 'Donor';
                    if ($apt->donor && $apt->donor->user) {
                        $nameParts = array_filter([
                            $apt->donor->user->first_name ?? '',
                            $apt->donor->user->last_name ?? ''
                        ]);
                        $donorName = trim(implode(' ', $nameParts)) ?: 'Donor';
                    }
                    
                    return [
                        'id' => 'donor_' . $apt->id,
                        'type' => 'donor',
                        'message' => "Donor " . $donorName . " arrived",
                        'time' => $apt->created_at->diffForHumans(),
                        'created_at' => $apt->created_at,
                    ];
                });
            $recentEvents = $recentEvents->merge($recentDonorArrivals);
            
            // Sort all events by created_at (most recent first) and take top 10
            $recentEvents = $recentEvents->sortByDesc('created_at')->take(10)->values();
            
            // Additional summary stats
            $totalUpcomingAppointments = Appointment::where('hospital_id', $hospitalId)
                ->where('state', '!=', 'canceled')
                ->whereDate('appointment_date', '>=', $today)
                ->count();

            $totalCompletedDonations = HomeAppointment::where('hospital_id', $hospitalId)
                ->where('state', 'completed')
                ->count() + HospitalAppointment::where('hospital_Id', $hospitalId)
                ->where('state', 'completed')
                ->count();

            try {
                $bloodInventoryCount = BloodInventory::where('hospital_id', $hospitalId)
                    ->where('status', 'available')
                    ->sum('quantity');
            } catch (\Exception $e) {
                \Log::warning('Error fetching blood inventory count:', [
                    'error' => $e->getMessage()
                ]);
                $bloodInventoryCount = 0; // Default to 0 if table doesn't exist
            }

            // === MONTHLY TRENDS (Last 12 months) ===
            $monthlyTrends = [];
            for ($i = 11; $i >= 0; $i--) {
                $monthStart = now()->subMonths($i)->startOfMonth();
                $monthEnd = now()->subMonths($i)->endOfMonth();
                
                $homeDonations = HomeAppointment::where('hospital_id', $hospitalId)
                    ->where('state', 'completed')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();
                
                $hospitalDonations = HospitalAppointment::where('hospital_Id', $hospitalId)
                    ->where('state', 'completed')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();
                
                $monthlyTrends[] = [
                    'month' => $monthStart->format('M Y'),
                    'home_visits' => $homeDonations,
                    'hospital' => $hospitalDonations,
                    'total' => $homeDonations + $hospitalDonations,
                ];
            }

            // === DONATION TYPES DISTRIBUTION ===
            $donationTypes = [
                'blood' => Appointment::where('hospital_id', $hospitalId)
                    ->where('donation_type', 'like', '%Blood%')
                    ->where('state', 'completed')
                    ->count(),
                'platelets' => Appointment::where('hospital_id', $hospitalId)
                    ->where('donation_type', 'like', '%Platelet%')
                    ->count(),
                'organs' => Appointment::where('hospital_id', $hospitalId)
                    ->where('donation_type', 'like', '%Organ%')
                    ->count(),
                'home_visit' => HomeAppointment::where('hospital_id', $hospitalId)
                    ->where('state', 'completed')
                    ->count(),
            ];

            // === BLOOD TYPE DISTRIBUTION ===
            try {
                $bloodTypeDistribution = BloodInventory::where('hospital_id', $hospitalId)
                    ->join('blood_types', 'blood_inventory.blood_type_id', '=', 'blood_types.id')
                    ->select('blood_types.type', 'blood_types.rh_factor', DB::raw('SUM(blood_inventory.quantity) as total'))
                    ->groupBy('blood_types.type', 'blood_types.rh_factor')
                    ->get()
                    ->map(function($item) {
                        return [
                            'blood_type' => $item->type . $item->rh_factor,
                            'quantity' => $item->total,
                        ];
                    });
            } catch (\Exception $e) {
                \Log::warning('Error fetching blood type distribution:', [
                    'error' => $e->getMessage()
                ]);
                $bloodTypeDistribution = collect([]); // Return empty collection if table doesn't exist
            }

            return response()->json([
                'success' => true,
                'hospitalInfo' => $hospitalInfo,
                'metrics' => [
                    'urgentDonations' => $urgentDonations,
                    'regularAppointments' => $regularAppointments,
                    'pendingHomeVisits' => $pendingHomeVisits,
                    'phlebotomistsOnDuty' => $phlebotomistsOnDuty,
                    'criticalBloodShortages' => $criticalBloodShortages,
                    'pendingOrganMatches' => $pendingOrganMatches,
                ],
                'todayAppointments' => $todayAppointmentsList,
                'recentEvents' => $recentEvents,
                'summary' => [
                    'total_upcoming_appointments' => $totalUpcomingAppointments,
                    'total_completed_donations' => $totalCompletedDonations,
                    'blood_inventory_count' => $bloodInventoryCount,
                ],
                'monthly_trends' => $monthlyTrends,
                'donation_types' => $donationTypes,
                'blood_type_distribution' => $bloodTypeDistribution,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching hospital dashboard overview:', [
                'hospital_id' => $hospitalId ?? 'unknown',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data',
                'error' => config('app.debug') ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Hospital-scoped blood inventory summary for dashboard Inventory page.
     * Returns all 8 blood types with quantity, threshold, and shortage status.
     */
    public function getInventory(Request $request, $hospitalId = null)
    {
        try {
            $hospitalId = $this->resolveHospitalId($request, $hospitalId);
            if (!$hospitalId) {
                return response()->json(['success' => false, 'message' => 'Hospital ID required'], 400);
            }

            $hospital = Hospital::find($hospitalId);
            if (!$hospital) {
                return response()->json(['success' => false, 'message' => 'Hospital not found'], 404);
            }

            $settings = HospitalSetting::where('hospital_id', $hospitalId)->first();
            $threshold = (int)($settings->auto_reorder_threshold ?? 15);
            if ($threshold < 0) $threshold = 0;

            $bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

            $rows = [];

            // 1) Current blood stock (manual inventory editor) from blood_inventory table
            // Sum quantities where status=available and compute nearest expiry from expiry_date.
            $stockByType = collect();
            $nearestStockExpiryByType = collect();
            try {
                $stockByType = BloodInventory::where('hospital_id', $hospitalId)
                    ->where('status', 'available')
                    ->join('blood_types', 'blood_inventory.blood_type_id', '=', 'blood_types.id')
                    ->select('blood_types.type', 'blood_types.rh_factor', DB::raw('SUM(blood_inventory.quantity) as total'))
                    ->groupBy('blood_types.type', 'blood_types.rh_factor')
                    ->get()
                    ->mapWithKeys(function($item) {
                        $key = $item->type . $item->rh_factor;
                        return [$key => (int)($item->total ?? 0)];
                    });

                $nearestStockExpiryByType = BloodInventory::where('hospital_id', $hospitalId)
                    ->where('status', 'available')
                    ->whereNotNull('expiry_date')
                    ->join('blood_types', 'blood_inventory.blood_type_id', '=', 'blood_types.id')
                    ->select('blood_types.type', 'blood_types.rh_factor', DB::raw('MIN(blood_inventory.expiry_date) as min_expiry'))
                    ->groupBy('blood_types.type', 'blood_types.rh_factor')
                    ->get()
                    ->mapWithKeys(function($item) {
                        $key = $item->type . $item->rh_factor;
                        return [$key => $item->min_expiry];
                    });
            } catch (\Exception $e) {
                $stockByType = collect();
                $nearestStockExpiryByType = collect();
            }

            // 2) Registered donors for blood donations (home + hospital) in this hospital, grouped by donor blood type
            $donorIdsByType = [];
            foreach ($bloodTypes as $bt) {
                $donorIdsByType[$bt] = [];
            }

            try {
                $homeRows = DB::table('home_appointments')
                    ->join('appointments', 'home_appointments.appointment_id', '=', 'appointments.id')
                    ->join('donors', 'home_appointments.donor_id', '=', 'donors.id')
                    ->join('blood_types', 'donors.blood_type_id', '=', 'blood_types.id')
                    ->where('home_appointments.hospital_id', $hospitalId)
                    ->where('home_appointments.state', '!=', 'canceled')
                    ->where('appointments.donation_type', 'like', '%Blood%')
                    ->select('home_appointments.donor_id as donor_id', 'blood_types.type', 'blood_types.rh_factor')
                    ->distinct()
                    ->get();

                foreach ($homeRows as $r) {
                    $bt = $r->type . $r->rh_factor;
                    if (!isset($donorIdsByType[$bt])) continue;
                    $donorIdsByType[$bt][$r->donor_id] = true;
                }

                $hospitalRows = DB::table('hospital_appointments')
                    ->join('appointments', 'hospital_appointments.appointment_id', '=', 'appointments.id')
                    ->join('donors', 'hospital_appointments.donor_id', '=', 'donors.id')
                    ->join('blood_types', 'donors.blood_type_id', '=', 'blood_types.id')
                    ->where('hospital_appointments.hospital_Id', $hospitalId)
                    ->where('hospital_appointments.state', '!=', 'canceled')
                    ->where('appointments.donation_type', 'like', '%Blood%')
                    ->select('hospital_appointments.donor_id as donor_id', 'blood_types.type', 'blood_types.rh_factor')
                    ->distinct()
                    ->get();

                foreach ($hospitalRows as $r) {
                    $bt = $r->type . $r->rh_factor;
                    if (!isset($donorIdsByType[$bt])) continue;
                    $donorIdsByType[$bt][$r->donor_id] = true;
                }
            } catch (\Exception $e) {
                // ignore and return zeros
            }

            $today = Carbon::today();
            $warningDays = 7;

            // --- Blood donation requests & usage (by donor blood type) ---
            // We count bookings (requests) for blood donation and keep a collapsible list
            // of completed bookings with donor + completion time + expiry + usage status.
            $bloodDonationLike = '%Blood%';
            $requestsByType = array_fill_keys($bloodTypes, 0);
            $usedUnitsByType = array_fill_keys($bloodTypes, 0);
            $unusedUnitsByType = array_fill_keys($bloodTypes, 0);
            $availableUnitsByType = array_fill_keys($bloodTypes, 0); // unused + not expired
            $expiredUnusedUnitsByType = array_fill_keys($bloodTypes, 0); // unused + expired
            $nearestExpiryAvailableByType = array_fill_keys($bloodTypes, null); // min expires_at among unused + not expired
            $completedListByType = array_fill_keys($bloodTypes, []);

            try {
                // Home bookings (counts)
                $homeAgg = DB::table('home_appointments')
                    ->join('appointments', 'home_appointments.appointment_id', '=', 'appointments.id')
                    ->join('donors', 'home_appointments.donor_id', '=', 'donors.id')
                    ->join('blood_types', 'donors.blood_type_id', '=', 'blood_types.id')
                    ->where('home_appointments.hospital_id', $hospitalId)
                    ->where('home_appointments.state', '=', 'completed')
                    ->where('appointments.donation_type', 'like', $bloodDonationLike)
                    ->select(
                        'blood_types.type',
                        'blood_types.rh_factor',
                        DB::raw('COUNT(*) as total_requests'),
                        DB::raw("SUM(CASE WHEN COALESCE(home_appointments.blood_usage_status, 'unused') = 'used' THEN COALESCE(home_appointments.blood_units_collected, 1) ELSE 0 END) as used_units"),
                        DB::raw("SUM(CASE WHEN COALESCE(home_appointments.blood_usage_status, 'unused') != 'used' THEN COALESCE(home_appointments.blood_units_collected, 1) ELSE 0 END) as unused_units"),
                        DB::raw("SUM(CASE WHEN COALESCE(home_appointments.blood_usage_status, 'unused') != 'used' AND COALESCE(home_appointments.expires_at, DATE(DATE_ADD(COALESCE(home_appointments.completed_at, home_appointments.updated_at), INTERVAL 42 DAY))) > CURDATE() THEN COALESCE(home_appointments.blood_units_collected, 1) ELSE 0 END) as available_units"),
                        DB::raw("SUM(CASE WHEN COALESCE(home_appointments.blood_usage_status, 'unused') != 'used' AND COALESCE(home_appointments.expires_at, DATE(DATE_ADD(COALESCE(home_appointments.completed_at, home_appointments.updated_at), INTERVAL 42 DAY))) <= CURDATE() THEN COALESCE(home_appointments.blood_units_collected, 1) ELSE 0 END) as expired_unused_units"),
                        DB::raw("MIN(CASE WHEN COALESCE(home_appointments.blood_usage_status, 'unused') != 'used' AND COALESCE(home_appointments.expires_at, DATE(DATE_ADD(COALESCE(home_appointments.completed_at, home_appointments.updated_at), INTERVAL 42 DAY))) > CURDATE() THEN COALESCE(home_appointments.expires_at, DATE(DATE_ADD(COALESCE(home_appointments.completed_at, home_appointments.updated_at), INTERVAL 42 DAY))) ELSE NULL END) as nearest_available_expiry")
                    )
                    ->groupBy('blood_types.type', 'blood_types.rh_factor')
                    ->get();

                foreach ($homeAgg as $r) {
                    $bt = ($r->type ?? '') . ($r->rh_factor ?? '');
                    if (!isset($requestsByType[$bt])) continue;
                    $requestsByType[$bt] += (int)($r->total_requests ?? 0);
                    $usedUnitsByType[$bt] += (int)($r->used_units ?? 0);
                    $unusedUnitsByType[$bt] += (int)($r->unused_units ?? 0);
                    $availableUnitsByType[$bt] += (int)($r->available_units ?? 0);
                    $expiredUnusedUnitsByType[$bt] += (int)($r->expired_unused_units ?? 0);
                    if (!empty($r->nearest_available_expiry)) {
                        $nearestExpiryAvailableByType[$bt] = $r->nearest_available_expiry;
                    }
                }

                // Hospital bookings (counts)
                $hospitalAgg = DB::table('hospital_appointments')
                    ->join('appointments', 'hospital_appointments.appointment_id', '=', 'appointments.id')
                    ->join('donors', 'hospital_appointments.donor_id', '=', 'donors.id')
                    ->join('blood_types', 'donors.blood_type_id', '=', 'blood_types.id')
                    ->where('hospital_appointments.hospital_Id', $hospitalId)
                    ->where('hospital_appointments.state', '=', 'completed')
                    ->where('appointments.donation_type', 'like', $bloodDonationLike)
                    ->select(
                        'blood_types.type',
                        'blood_types.rh_factor',
                        DB::raw('COUNT(*) as total_requests'),
                        DB::raw("SUM(CASE WHEN COALESCE(hospital_appointments.blood_usage_status, 'unused') = 'used' THEN COALESCE(hospital_appointments.blood_units_collected, 1) ELSE 0 END) as used_units"),
                        DB::raw("SUM(CASE WHEN COALESCE(hospital_appointments.blood_usage_status, 'unused') != 'used' THEN COALESCE(hospital_appointments.blood_units_collected, 1) ELSE 0 END) as unused_units"),
                        DB::raw("SUM(CASE WHEN COALESCE(hospital_appointments.blood_usage_status, 'unused') != 'used' AND COALESCE(hospital_appointments.expires_at, DATE(DATE_ADD(COALESCE(hospital_appointments.completed_at, hospital_appointments.updated_at), INTERVAL 42 DAY))) > CURDATE() THEN COALESCE(hospital_appointments.blood_units_collected, 1) ELSE 0 END) as available_units"),
                        DB::raw("SUM(CASE WHEN COALESCE(hospital_appointments.blood_usage_status, 'unused') != 'used' AND COALESCE(hospital_appointments.expires_at, DATE(DATE_ADD(COALESCE(hospital_appointments.completed_at, hospital_appointments.updated_at), INTERVAL 42 DAY))) <= CURDATE() THEN COALESCE(hospital_appointments.blood_units_collected, 1) ELSE 0 END) as expired_unused_units"),
                        DB::raw("MIN(CASE WHEN COALESCE(hospital_appointments.blood_usage_status, 'unused') != 'used' AND COALESCE(hospital_appointments.expires_at, DATE(DATE_ADD(COALESCE(hospital_appointments.completed_at, hospital_appointments.updated_at), INTERVAL 42 DAY))) > CURDATE() THEN COALESCE(hospital_appointments.expires_at, DATE(DATE_ADD(COALESCE(hospital_appointments.completed_at, hospital_appointments.updated_at), INTERVAL 42 DAY))) ELSE NULL END) as nearest_available_expiry")
                    )
                    ->groupBy('blood_types.type', 'blood_types.rh_factor')
                    ->get();

                foreach ($hospitalAgg as $r) {
                    $bt = ($r->type ?? '') . ($r->rh_factor ?? '');
                    if (!isset($requestsByType[$bt])) continue;
                    $requestsByType[$bt] += (int)($r->total_requests ?? 0);
                    $usedUnitsByType[$bt] += (int)($r->used_units ?? 0);
                    $unusedUnitsByType[$bt] += (int)($r->unused_units ?? 0);
                    $availableUnitsByType[$bt] += (int)($r->available_units ?? 0);
                    $expiredUnusedUnitsByType[$bt] += (int)($r->expired_unused_units ?? 0);
                    if (!empty($r->nearest_available_expiry)) {
                        // Keep the earliest date across both booking types
                        if (!$nearestExpiryAvailableByType[$bt] || $r->nearest_available_expiry < $nearestExpiryAvailableByType[$bt]) {
                            $nearestExpiryAvailableByType[$bt] = $r->nearest_available_expiry;
                        }
                    }
                }

                // Completed bookings list (for collapsible UI)
                // Keep it bounded to avoid huge responses (latest 200 per booking type).
                $homeCompleted = DB::table('home_appointments')
                    ->join('appointments', 'home_appointments.appointment_id', '=', 'appointments.id')
                    ->join('donors', 'home_appointments.donor_id', '=', 'donors.id')
                    ->join('users', 'donors.user_id', '=', 'users.id')
                    ->join('blood_types', 'donors.blood_type_id', '=', 'blood_types.id')
                    ->where('home_appointments.hospital_id', $hospitalId)
                    ->where('home_appointments.state', '=', 'completed')
                    ->where('appointments.donation_type', 'like', $bloodDonationLike)
                    ->orderBy('home_appointments.updated_at', 'desc')
                    ->limit(200)
                    ->select(
                        'home_appointments.id as booking_id',
                        'home_appointments.code as booking_code',
                        DB::raw('COALESCE(home_appointments.completed_at, home_appointments.updated_at) as completed_at'),
                        DB::raw('COALESCE(home_appointments.expires_at, DATE(DATE_ADD(COALESCE(home_appointments.completed_at, home_appointments.updated_at), INTERVAL 42 DAY))) as expires_at'),
                        'home_appointments.appointment_time as appointment_time',
                        'home_appointments.blood_units_collected as units_collected',
                        'home_appointments.blood_usage_status as usage_status',
                        'donors.id as donor_id',
                        'donors.code as donor_code',
                        'users.first_name',
                        'users.middle_name',
                        'users.last_name',
                        'blood_types.type as bt_type',
                        'blood_types.rh_factor as bt_rh'
                    )
                    ->get();

                foreach ($homeCompleted as $r) {
                    $bt = ($r->bt_type ?? '') . ($r->bt_rh ?? '');
                    if (!isset($completedListByType[$bt])) continue;
                    $nameParts = array_filter([$r->first_name ?? null, $r->middle_name ?? null, $r->last_name ?? null]);

                    $expiresAt = $r->expires_at ?? null;
                    $expiryStatus = 'none';
                    $expiryDaysLeft = null;
                    if ($expiresAt) {
                        try {
                            $expDate = Carbon::parse($expiresAt)->startOfDay();
                            $expiryDaysLeft = $today->diffInDays($expDate, false);
                            if ($expiryDaysLeft <= 0) {
                                $expiryStatus = 'expired';
                            } elseif ($expiryDaysLeft <= $warningDays) {
                                $expiryStatus = 'warning';
                            } else {
                                $expiryStatus = 'ok';
                            }
                            $expiresAt = $expDate->toDateString();
                        } catch (\Exception $e) {
                            $expiresAt = null;
                            $expiryStatus = 'none';
                            $expiryDaysLeft = null;
                        }
                    }

                    $completedListByType[$bt][] = [
                        'booking_type' => 'home',
                        'booking_id' => (int)($r->booking_id ?? 0),
                        'booking_code' => $r->booking_code,
                        'donor_id' => (int)($r->donor_id ?? 0),
                        'donor_code' => $r->donor_code,
                        'donor_name' => $nameParts ? implode(' ', $nameParts) : null,
                        'blood_type' => $bt,
                        'completed_at' => $r->completed_at,
                        'expires_at' => $expiresAt,
                        'expiry_status' => $expiryStatus, // ok|warning|expired|none
                        'expiry_days_left' => $expiryDaysLeft,
                        'appointment_time' => $r->appointment_time,
                        'units_collected' => (int)($r->units_collected ?? 1),
                        'usage_status' => $r->usage_status ?? 'unused',
                    ];
                }

                $hospitalCompleted = DB::table('hospital_appointments')
                    ->join('appointments', 'hospital_appointments.appointment_id', '=', 'appointments.id')
                    ->join('donors', 'hospital_appointments.donor_id', '=', 'donors.id')
                    ->join('users', 'donors.user_id', '=', 'users.id')
                    ->join('blood_types', 'donors.blood_type_id', '=', 'blood_types.id')
                    ->where('hospital_appointments.hospital_Id', $hospitalId)
                    ->where('hospital_appointments.state', '=', 'completed')
                    ->where('appointments.donation_type', 'like', $bloodDonationLike)
                    ->orderBy('hospital_appointments.updated_at', 'desc')
                    ->limit(200)
                    ->select(
                        'hospital_appointments.id as booking_id',
                        'hospital_appointments.code as booking_code',
                        DB::raw('COALESCE(hospital_appointments.completed_at, hospital_appointments.updated_at) as completed_at'),
                        DB::raw('COALESCE(hospital_appointments.expires_at, DATE(DATE_ADD(COALESCE(hospital_appointments.completed_at, hospital_appointments.updated_at), INTERVAL 42 DAY))) as expires_at'),
                        'hospital_appointments.appointment_time as appointment_time',
                        'hospital_appointments.blood_units_collected as units_collected',
                        'hospital_appointments.blood_usage_status as usage_status',
                        'donors.id as donor_id',
                        'donors.code as donor_code',
                        'users.first_name',
                        'users.middle_name',
                        'users.last_name',
                        'blood_types.type as bt_type',
                        'blood_types.rh_factor as bt_rh'
                    )
                    ->get();

                foreach ($hospitalCompleted as $r) {
                    $bt = ($r->bt_type ?? '') . ($r->bt_rh ?? '');
                    if (!isset($completedListByType[$bt])) continue;
                    $nameParts = array_filter([$r->first_name ?? null, $r->middle_name ?? null, $r->last_name ?? null]);

                    $expiresAt = $r->expires_at ?? null;
                    $expiryStatus = 'none';
                    $expiryDaysLeft = null;
                    if ($expiresAt) {
                        try {
                            $expDate = Carbon::parse($expiresAt)->startOfDay();
                            $expiryDaysLeft = $today->diffInDays($expDate, false);
                            if ($expiryDaysLeft <= 0) {
                                $expiryStatus = 'expired';
                            } elseif ($expiryDaysLeft <= $warningDays) {
                                $expiryStatus = 'warning';
                            } else {
                                $expiryStatus = 'ok';
                            }
                            $expiresAt = $expDate->toDateString();
                        } catch (\Exception $e) {
                            $expiresAt = null;
                            $expiryStatus = 'none';
                            $expiryDaysLeft = null;
                        }
                    }

                    $completedListByType[$bt][] = [
                        'booking_type' => 'hospital',
                        'booking_id' => (int)($r->booking_id ?? 0),
                        'booking_code' => $r->booking_code,
                        'donor_id' => (int)($r->donor_id ?? 0),
                        'donor_code' => $r->donor_code,
                        'donor_name' => $nameParts ? implode(' ', $nameParts) : null,
                        'blood_type' => $bt,
                        'completed_at' => $r->completed_at,
                        'expires_at' => $expiresAt,
                        'expiry_status' => $expiryStatus, // ok|warning|expired|none
                        'expiry_days_left' => $expiryDaysLeft,
                        'appointment_time' => $r->appointment_time,
                        'units_collected' => (int)($r->units_collected ?? 1),
                        'usage_status' => $r->usage_status ?? 'unused',
                    ];
                }
            } catch (\Exception $e) {
                // Keep zeros/defaults if any query fails
            }

            foreach ($bloodTypes as $bt) {
                // Manual stock (from blood_inventory)
                $availableStock = (int)($stockByType[$bt] ?? 0);
                $shortage = 'sufficient';
                if ($availableStock < $threshold) {
                    $shortage = 'critical';
                } elseif ($availableStock < ($threshold * 2)) {
                    $shortage = 'low stock';
                }

                $nearestExpiry = $nearestStockExpiryByType[$bt] ?? null;
                $expiryStatus = 'none';
                $daysLeft = null;
                if ($nearestExpiry) {
                    try {
                        $expDate = Carbon::parse($nearestExpiry)->startOfDay();
                        $daysLeft = $today->diffInDays($expDate, false);
                        if ($daysLeft <= 0) {
                            $expiryStatus = 'expired';
                        } elseif ($daysLeft <= $warningDays) {
                            $expiryStatus = 'warning';
                        } else {
                            $expiryStatus = 'ok';
                        }
                        $nearestExpiry = $expDate->toDateString();
                    } catch (\Exception $e) {
                        $nearestExpiry = null;
                        $expiryStatus = 'none';
                        $daysLeft = null;
                    }
                }

                $registeredDonors = isset($donorIdsByType[$bt]) ? count($donorIdsByType[$bt]) : 0;

                $rows[] = [
                    'blood_type' => $bt,
                    'registered_donors' => $registeredDonors,
                    'requests_total' => (int)($requestsByType[$bt] ?? 0),
                    'available_stock' => $availableStock,
                    'threshold' => $threshold,
                    'shortage_status' => $shortage,
                    'nearest_expiry_date' => $nearestExpiry,
                    'expiry_status' => $expiryStatus, // none|ok|warning
                    'expiry_days_left' => $daysLeft,
                    'usage' => [
                        'used_units' => (int)($usedUnitsByType[$bt] ?? 0),
                        'unused_units' => (int)($unusedUnitsByType[$bt] ?? 0),
                        'expired_unused_units' => (int)($expiredUnusedUnitsByType[$bt] ?? 0),
                    ],
                    'completed_donations' => $completedListByType[$bt] ?? [],
                ];
            }

            return response()->json([
                'success' => true,
                'hospital' => [
                    'id' => $hospital->id,
                    'name' => $hospital->name,
                ],
                'threshold' => $threshold,
                'inventory' => $rows,
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching hospital inventory:', [
                'hospital_id' => $hospitalId ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch inventory',
            ], 500);
        }
    }

    /**
     * Update hospital blood stock for each blood type (dashboard Inventory editor).
     * This replaces existing AVAILABLE stock rows for the given blood type in this hospital
     * with a single row containing the provided quantity + optional expiry_date.
     */
    public function updateInventory(Request $request, $hospitalId = null)
    {
        $hospitalId = $this->resolveHospitalId($request, $hospitalId);
        if (!$hospitalId) {
            return response()->json(['success' => false, 'message' => 'Hospital ID required'], 400);
        }

        $hospital = Hospital::find($hospitalId);
        if (!$hospital) {
            return response()->json(['success' => false, 'message' => 'Hospital not found'], 404);
        }

        $validated = $request->validate([
            'inventory' => 'required|array|min:1',
            'inventory.*.blood_type' => 'required|string|max:5',
            'inventory.*.quantity' => 'required|integer|min:0',
            'inventory.*.expiry_date' => 'nullable|date',
        ]);

        $bloodTypesAllowed = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

        DB::beginTransaction();
        try {
            foreach ($validated['inventory'] as $row) {
                $bt = strtoupper(trim($row['blood_type']));
                if (!in_array($bt, $bloodTypesAllowed, true)) {
                    throw new \InvalidArgumentException("Invalid blood type: {$bt}");
                }

                $type = str_replace(['+', '-'], '', $bt);
                $rh = str_contains($bt, '+') ? '+' : '-';

                $bloodType = BloodType::where('type', $type)->where('rh_factor', $rh)->first();
                if (!$bloodType) {
                    throw new \InvalidArgumentException("Blood type not found in DB: {$bt}");
                }

                // Replace existing stock rows for this blood type/hospital.
                // We keep "used" history but fully replace current stock (available/expired).
                BloodInventory::where('hospital_id', $hospitalId)
                    ->where('blood_type_id', $bloodType->id)
                    ->whereIn('status', ['available', 'expired'])
                    ->delete();

                $qty = (int)$row['quantity'];
                if ($qty === 0) {
                    continue;
                }

                $expiryDate = $row['expiry_date'] ?? null;
                $status = 'available';
                if ($expiryDate) {
                    try {
                        $exp = Carbon::parse($expiryDate)->startOfDay();
                        if (Carbon::today()->greaterThanOrEqualTo($exp)) {
                            $status = 'expired';
                        }
                        $expiryDate = $exp->toDateString();
                    } catch (\Exception $e) {
                        // If date can't be parsed, store null (treat as available)
                        $expiryDate = null;
                    }
                }

                BloodInventory::create([
                    'hospital_id' => $hospitalId,
                    'blood_type_id' => $bloodType->id,
                    'quantity' => $qty,
                    'expiry_date' => $expiryDate,
                    'status' => $status,
                    'note' => 'dashboard_inventory_update',
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Inventory updated successfully',
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Error updating hospital inventory:', [
                'hospital_id' => $hospitalId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => $e instanceof \InvalidArgumentException ? $e->getMessage() : 'Failed to update inventory',
            ], 500);
        }
    }

    /**
     * Get all appointments (home and hospital) for the authenticated hospital manager
     * Supports filtering by date range, donation type, urgency, and state
     */
    public function getAppointments(Request $request, $hospitalId = null)
    {
        try {
            // Get hospital ID from authenticated user if not provided
            if (!$hospitalId && $request->user()) {
                $user = $request->user();
                if ($user->role === 'manager' && $user->healthCenterManager) {
                    $hospitalId = $user->healthCenterManager->hospital_id;
                }
            }

            if (!$hospitalId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital ID required'
                ], 400);
            }

            $hospital = Hospital::find($hospitalId);
            if (!$hospital) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital not found'
                ], 404);
            }

            // Get filters from request
            $dateRange = $request->input('dateRange', 'all');
            $donationType = $request->input('donationType', 'all');
            $urgency = $request->input('urgency', 'all'); // appointment_type
            $state = $request->input('state', 'all');
            $phlebotomist = $request->input('phlebotomist', 'all');

            // Set up date range filter
            $today = Carbon::today();
            $startDate = null;
            $endDate = null;

            switch ($dateRange) {
                case 'today':
                    $startDate = $today->copy();
                    $endDate = $today->copy();
                    break;
                case 'week':
                    $startDate = $today->copy()->startOfWeek();
                    $endDate = $today->copy()->endOfWeek();
                    break;
                case 'month':
                    $startDate = $today->copy()->startOfMonth();
                    $endDate = $today->copy()->endOfMonth();
                    break;
                case 'all':
                default:
                    // No date filtering
                    break;
            }

            // Fetch Hospital Appointments
            $hospitalAppointmentsQuery = HospitalAppointment::where('hospital_Id', $hospitalId)
                ->with([
                    'donor.user',
                    'donor.bloodType',
                    'appointment' // Use singular relationship name
                ]);

            // Apply state filter
            if ($state !== 'all') {
                $hospitalAppointmentsQuery->where('state', $state);
            }

            // Filter by appointment type and donation type through appointments relationship
            if ($urgency !== 'all' || $donationType !== 'all') {
                $hospitalAppointmentsQuery->whereHas('appointment', function($query) use ($urgency, $donationType, $startDate, $endDate) {
                    if ($urgency !== 'all') {
                        $query->where('appointment_type', $urgency);
                    }
                    if ($donationType !== 'all') {
                        $query->where('donation_type', $donationType);
                    }
                    if ($startDate && $endDate) {
                        $query->whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()]);
                    } elseif ($startDate) {
                        $query->whereDate('appointment_date', '>=', $startDate->toDateString());
                    } elseif ($endDate) {
                        $query->whereDate('appointment_date', '<=', $endDate->toDateString());
                    }
                });
            } elseif ($startDate || $endDate) {
                $hospitalAppointmentsQuery->whereHas('appointment', function($query) use ($startDate, $endDate) {
                    if ($startDate && $endDate) {
                        $query->whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()]);
                    } elseif ($startDate) {
                        $query->whereDate('appointment_date', '>=', $startDate->toDateString());
                    } elseif ($endDate) {
                        $query->whereDate('appointment_date', '<=', $endDate->toDateString());
                    }
                });
            }

            $hospitalAppointments = $hospitalAppointmentsQuery->get();

            // Fetch Home Appointments
            $homeAppointmentsQuery = HomeAppointment::where('hospital_id', $hospitalId)
                ->with([
                    'donor.user',
                    'donor.bloodType',
                    'appointment',
                    'mobilePhlebotomist.user'
                ]);

            // Apply state filter
            if ($state !== 'all') {
                $homeAppointmentsQuery->where('state', $state);
            }

            // Filter by phlebotomist
            if ($phlebotomist !== 'all') {
                $homeAppointmentsQuery->where('phlebotomist_id', $phlebotomist);
            }

            // Filter by appointment type and donation type through appointment relationship
            if ($urgency !== 'all' || $donationType !== 'all') {
                $homeAppointmentsQuery->whereHas('appointment', function($query) use ($urgency, $donationType, $startDate, $endDate) {
                    if ($urgency !== 'all') {
                        $query->where('appointment_type', $urgency);
                    }
                    if ($donationType !== 'all') {
                        $query->where('donation_type', $donationType);
                    }
                    if ($startDate && $endDate) {
                        $query->whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()]);
                    } elseif ($startDate) {
                        $query->whereDate('appointment_date', '>=', $startDate->toDateString());
                    } elseif ($endDate) {
                        $query->whereDate('appointment_date', '<=', $endDate->toDateString());
                    }
                });
            } elseif ($startDate || $endDate) {
                $homeAppointmentsQuery->whereHas('appointment', function($query) use ($startDate, $endDate) {
                    if ($startDate && $endDate) {
                        $query->whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()]);
                    } elseif ($startDate) {
                        $query->whereDate('appointment_date', '>=', $startDate->toDateString());
                    } elseif ($endDate) {
                        $query->whereDate('appointment_date', '<=', $endDate->toDateString());
                    }
                });
            }

            $homeAppointments = $homeAppointmentsQuery->get();

            // Transform Hospital Appointments to unified format
            $hospitalApptsFormatted = $hospitalAppointments->map(function($apt) {
                // Get appointment - the relationship is belongsTo (singular) but named plural
                $appointment = null;
                $appointment = $apt->appointment;
                $donor = $apt->donor;
                $user = $donor ? $donor->user : null;

                return [
                    'id' => $apt->id,
                    'code' => $apt->code,
                    'type' => 'hospital',
                    'appointment_date' => $appointment ? $appointment->appointment_date : null,
                    'appointment_time' => $apt->appointment_time ?? ($appointment ? $appointment->appointment_time : null),
                    'appointment_type' => $appointment ? $appointment->appointment_type : null,
                    'donation_type' => $appointment ? $appointment->donation_type : null,
                    'state' => $apt->state,
                    'donor' => [
                        'id' => $donor ? $donor->id : null,
                        'code' => $donor ? $donor->code : null,
                        'user' => $user ? [
                            'id' => $user->id,
                            'first_name' => $user->first_name,
                            'middle_name' => $user->middle_name,
                            'last_name' => $user->last_name,
                            'email' => $user->email,
                            'phone_nb' => $user->phone_nb,
                        ] : null,
                        'bloodType' => $donor && $donor->bloodType ? [
                            'id' => $donor->bloodType->id,
                            'type' => $donor->bloodType->type,
                            'rh_factor' => $donor->bloodType->rh_factor,
                        ] : null,
                    ],
                    'mobilePhlebotomist' => null, // Hospital appointments don't have phlebotomists
                    'created_at' => $apt->created_at,
                    'updated_at' => $apt->updated_at,
                ];
            });

            // Transform Home Appointments to unified format
            $homeApptsFormatted = $homeAppointments->map(function($apt) {
                $appointment = $apt->appointment;
                $donor = $apt->donor;
                $user = $donor ? $donor->user : null;
                $phlebotomist = $apt->mobilePhlebotomist;
                $phlebotomistUser = $phlebotomist ? $phlebotomist->user : null;

                return [
                    'id' => $apt->id,
                    'code' => $apt->code,
                    'type' => 'home',
                    'appointment_date' => $appointment ? $appointment->appointment_date : null,
                    'appointment_time' => $apt->appointment_time ?? ($appointment ? $appointment->appointment_time : null),
                    'appointment_type' => $appointment ? $appointment->appointment_type : null,
                    'donation_type' => $appointment ? $appointment->donation_type : null,
                    'state' => $apt->state,
                    'donor' => [
                        'id' => $donor ? $donor->id : null,
                        'code' => $donor ? $donor->code : null,
                        'user' => $user ? [
                            'id' => $user->id,
                            'first_name' => $user->first_name,
                            'middle_name' => $user->middle_name,
                            'last_name' => $user->last_name,
                            'email' => $user->email,
                            'phone_nb' => $user->phone_nb,
                        ] : null,
                        'bloodType' => $donor && $donor->bloodType ? [
                            'id' => $donor->bloodType->id,
                            'type' => $donor->bloodType->type,
                            'rh_factor' => $donor->bloodType->rh_factor,
                        ] : null,
                    ],
                    'mobilePhlebotomist' => $phlebotomist ? [
                        'id' => $phlebotomist->id,
                        'code' => $phlebotomist->code,
                        'user' => $phlebotomistUser ? [
                            'id' => $phlebotomistUser->id,
                            'first_name' => $phlebotomistUser->first_name,
                            'middle_name' => $phlebotomistUser->middle_name,
                            'last_name' => $phlebotomistUser->last_name,
                            'phone_nb'=> $phlebotomistUser->phone_nb,
                        ] : null,
                    ] : null,
                    'created_at' => $apt->created_at,
                    'updated_at' => $apt->updated_at,
                ];
            });

            // Merge and sort by appointment date
            // Convert both to regular collections since they contain arrays, not model instances
            $hospitalCollection = \Illuminate\Support\Collection::make($hospitalApptsFormatted->toArray());
            $homeCollection = \Illuminate\Support\Collection::make($homeApptsFormatted->toArray());
            
            $allAppointments = $hospitalCollection->merge($homeCollection)
                ->sortBy(function($apt) {
                    return $apt['appointment_date'] ?? '';
                })
                ->values();

            return response()->json([
                'success' => true,
                'appointments' => $allAppointments,
                'total' => $allAppointments->count(),
                'filters' => [
                    'dateRange' => $dateRange,
                    'donationType' => $donationType,
                    'urgency' => $urgency,
                    'state' => $state,
                    'phlebotomist' => $phlebotomist,
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching hospital appointments:', [
                'hospital_id' => $hospitalId ?? 'unknown',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch appointments',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Update a single booking (home/hospital appointment record) for the authenticated hospital manager.
     * This edits the booking state/time, not the underlying Appointment template.
     */
    public function updateAppointmentBooking(Request $request, string $type, int $id)
    {
        $validated = $request->validate([
            'state' => 'sometimes|required|in:pending,completed,canceled',
            'appointment_time' => 'sometimes|nullable|string|max:20',
        ]);

        $hospitalId = $this->resolveHospitalId($request, null);
        if (!$hospitalId) {
            return response()->json([
                'success' => false,
                'message' => 'Hospital ID not found. Please ensure you are logged in as a hospital manager.',
            ], 403);
        }

        $type = strtolower($type);
        if (!in_array($type, ['home', 'hospital'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid booking type',
            ], 422);
        }

        try {
            if ($type === 'home') {
                $booking = HomeAppointment::where('hospital_id', $hospitalId)->findOrFail($id);
            } else {
                $booking = HospitalAppointment::where('hospital_Id', $hospitalId)->findOrFail($id);
            }

            if (array_key_exists('state', $validated)) {
                $prevState = $booking->state;
                $booking->state = $validated['state'];

                // Store completion moment (do not rely on updated_at since other edits can change it)
                if ($validated['state'] === 'completed' && $prevState !== 'completed') {
                    $booking->completed_at = now();
                    // expiry: collectedAt + 42 days (whole blood)
                    try {
                        $booking->expires_at = Carbon::parse($booking->completed_at)->addDays(42)->toDateString();
                    } catch (\Exception $e) {
                        $booking->expires_at = null;
                    }
                }
                if ($validated['state'] !== 'completed') {
                    $booking->completed_at = null;
                    $booking->expires_at = null;
                }
            }
            if (array_key_exists('appointment_time', $validated)) {
                $booking->appointment_time = $validated['appointment_time'];
            }
            $booking->save();

            return response()->json([
                'success' => true,
                'message' => 'Booking updated successfully',
                'booking' => [
                    'id' => $booking->id,
                    'code' => $booking->code,
                    'type' => $type,
                    'state' => $booking->state,
                    'appointment_time' => $booking->appointment_time,
                    'completed_at' => $booking->completed_at,
                    'expires_at' => $booking->expires_at,
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found',
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error updating booking:', [
                'type' => $type,
                'id' => $id,
                'hospital_id' => $hospitalId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update booking',
            ], 500);
        }
    }

    /**
     * Delete a single booking (home/hospital appointment record) for the authenticated hospital manager.
     * This deletes the booking record, not the underlying Appointment template.
     */
    public function deleteAppointmentBooking(Request $request, string $type, int $id)
    {
        $hospitalId = $this->resolveHospitalId($request, null);
        if (!$hospitalId) {
            return response()->json([
                'success' => false,
                'message' => 'Hospital ID not found. Please ensure you are logged in as a hospital manager.',
            ], 403);
        }

        $type = strtolower($type);
        if (!in_array($type, ['home', 'hospital'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid booking type',
            ], 422);
        }

        try {
            if ($type === 'home') {
                $booking = HomeAppointment::where('hospital_id', $hospitalId)->findOrFail($id);
            } else {
                $booking = HospitalAppointment::where('hospital_Id', $hospitalId)->findOrFail($id);
            }

            $booking->delete();

            return response()->json([
                'success' => true,
                'message' => 'Booking deleted successfully',
                'deleted' => [
                    'id' => $id,
                    'type' => $type,
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found',
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting booking:', [
                'type' => $type,
                'id' => $id,
                'hospital_id' => $hospitalId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete booking',
            ], 500);
        }
    }

    /**
     * Update blood usage state for a completed booking (home/hospital).
     * This is used by the Inventory page to mark collected units as used/unused.
     */
    public function updateBookingBloodUsage(Request $request, string $type, int $id)
    {
        $validated = $request->validate([
            'usage_status' => 'required|in:used,unused',
            'units_collected' => 'sometimes|integer|min:1|max:10',
        ]);

        $hospitalId = $this->resolveHospitalId($request, null);
        if (!$hospitalId) {
            return response()->json([
                'success' => false,
                'message' => 'Hospital ID not found. Please ensure you are logged in as a hospital manager.',
            ], 403);
        }

        $type = strtolower($type);
        if (!in_array($type, ['home', 'hospital'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid booking type',
            ], 422);
        }

        try {
            if ($type === 'home') {
                $booking = HomeAppointment::where('hospital_id', $hospitalId)->findOrFail($id);
            } else {
                $booking = HospitalAppointment::where('hospital_Id', $hospitalId)->findOrFail($id);
            }

            // Restrict to completed bookings for blood donations
            if (($booking->state ?? '') !== 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only completed bookings can be updated in inventory usage.',
                ], 422);
            }

            // Optional: update units collected (defaults to 1)
            if (array_key_exists('units_collected', $validated)) {
                $booking->blood_units_collected = (int)$validated['units_collected'];
            }

            // Prevent expired blood units from being marked as "used"
            // We treat a booking's expires_at as the unit/batch expiry.
            $expiresAt = $booking->expires_at;
            if (!$expiresAt && $booking->completed_at) {
                try {
                    $expiresAt = Carbon::parse($booking->completed_at)->addDays(42)->toDateString();
                    $booking->expires_at = $expiresAt; // self-heal missing data
                } catch (\Exception $e) {
                    $expiresAt = null;
                }
            }
            if ($validated['usage_status'] === 'used' && $expiresAt) {
                try {
                    $expDate = Carbon::parse($expiresAt)->startOfDay();
                    if (Carbon::today()->greaterThanOrEqualTo($expDate)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'This blood unit is expired and cannot be marked as used.',
                        ], 422);
                    }
                } catch (\Exception $e) {
                    // ignore parse errors
                }
            }

            $booking->blood_usage_status = $validated['usage_status'];
            if ($validated['usage_status'] === 'used') {
                $booking->blood_used_at = now();
            } else {
                $booking->blood_used_at = null;
            }

            $booking->save();

            return response()->json([
                'success' => true,
                'message' => 'Usage updated',
                'booking' => [
                    'type' => $type,
                    'id' => $booking->id,
                    'code' => $booking->code,
                    'blood_units_collected' => (int)($booking->blood_units_collected ?? 1),
                    'blood_usage_status' => $booking->blood_usage_status ?? 'unused',
                    'blood_used_at' => $booking->blood_used_at,
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating booking blood usage:', [
                'type' => $type,
                'id' => $id,
                'hospital_id' => $hospitalId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update usage',
            ], 500);
        }
    }
}
