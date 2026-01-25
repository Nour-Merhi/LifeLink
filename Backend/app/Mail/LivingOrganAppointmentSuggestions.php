<?php

namespace App\Mail;

use App\Models\LivingDonor;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LivingOrganAppointmentSuggestions extends Mailable
{
    use Queueable, SerializesModels;

    public LivingDonor $livingDonor;
    /** @var array<int, string> */
    public array $slots;
    public string $dashboardUrl;

    /**
     * @param array<int, string> $slots ISO datetime strings
     */
    public function __construct(LivingDonor $livingDonor, array $slots, string $dashboardUrl)
    {
        $this->livingDonor = $livingDonor;
        $this->slots = $slots;
        $this->dashboardUrl = $dashboardUrl;
    }

    public function build()
    {
        return $this->subject('LifeLink: Choose Your Organ Donation Appointment')
            ->view('emails.living_organ_appointment_suggestions')
            ->with([
                'livingDonor' => $this->livingDonor,
                'slots' => $this->slots,
                'dashboardUrl' => $this->dashboardUrl,
            ]);
    }
}

