<?php

namespace App\Mail;

use App\Models\LivingDonor;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LivingOrganMedicalClearedThankYou extends Mailable
{
    use Queueable, SerializesModels;

    public LivingDonor $livingDonor;

    public function __construct(LivingDonor $livingDonor)
    {
        $this->livingDonor = $livingDonor;
    }

    public function build()
    {
        return $this->subject('LifeLink: You’re Medically Cleared — Thank You')
            ->view('emails.living_organ_medical_cleared_thank_you')
            ->with([
                'livingDonor' => $this->livingDonor,
            ]);
    }
}

