<?php

namespace App\Mail;

use App\Models\LivingDonor;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LivingOrganAppointmentCancelled extends Mailable
{
    use Queueable, SerializesModels;

    public LivingDonor $livingDonor;
    public ?string $reason;

    public function __construct(LivingDonor $livingDonor, ?string $reason = null)
    {
        $this->livingDonor = $livingDonor;
        $this->reason = $reason;
    }

    public function build()
    {
        return $this->subject('LifeLink: Appointment Cancelled')
            ->view('emails.living_organ_appointment_cancelled')
            ->with([
                'livingDonor' => $this->livingDonor,
                'reason' => $this->reason,
            ]);
    }
}

