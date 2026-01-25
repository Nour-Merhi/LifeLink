<?php

namespace App\Mail;

use App\Models\LivingDonor;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LivingOrganAppointmentCompleted extends Mailable
{
    use Queueable, SerializesModels;

    public LivingDonor $livingDonor;

    public function __construct(LivingDonor $livingDonor)
    {
        $this->livingDonor = $livingDonor;
    }

    public function build()
    {
        return $this->subject('LifeLink: Appointment Completed — Next Steps')
            ->view('emails.living_organ_appointment_completed')
            ->with([
                'livingDonor' => $this->livingDonor,
            ]);
    }
}

