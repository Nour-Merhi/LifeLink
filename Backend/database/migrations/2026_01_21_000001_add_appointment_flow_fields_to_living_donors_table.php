<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('living_donors', function (Blueprint $table) {
            // Appointment workflow for living donor pledges (separate from blood donation appointments)
            $table->enum('appointment_status', [
                'awaiting_approval',
                'awaiting_scheduling',
                'awaiting_donor_choice',
                'in_progress',
                'completed',
                'cancelled',
            ])->default('awaiting_approval')->after('ethics_status');

            // Suggested appointment options (ISO strings or objects) and donor selection
            $table->json('suggested_appointments')->nullable()->after('appointment_status');
            $table->timestamp('suggestions_sent_at')->nullable()->after('suggested_appointments');
            $table->timestamp('selected_appointment_at')->nullable()->after('suggestions_sent_at');
            $table->timestamp('selected_at')->nullable()->after('selected_appointment_at');

            // Finalization timestamps (separate from updated_at)
            $table->timestamp('appointment_completed_at')->nullable()->after('selected_at');
            $table->timestamp('appointment_cancelled_at')->nullable()->after('appointment_completed_at');
            $table->string('appointment_cancel_reason', 255)->nullable()->after('appointment_cancelled_at');
        });
    }

    public function down(): void
    {
        Schema::table('living_donors', function (Blueprint $table) {
            $table->dropColumn([
                'appointment_status',
                'suggested_appointments',
                'suggestions_sent_at',
                'selected_appointment_at',
                'selected_at',
                'appointment_completed_at',
                'appointment_cancelled_at',
                'appointment_cancel_reason',
            ]);
        });
    }
};

