<?php

namespace App\Mail;

use App\Models\LivingDonor;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LivingOrganPledgeSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public LivingDonor $livingDonor;

    public function __construct(LivingDonor $livingDonor)
    {
        $this->livingDonor = $livingDonor;
    }

    public function build()
    {
        return $this->subject('LifeLink: Living Organ Pledge Received')
            ->view('emails.living_organ_pledge_submitted')
            ->with([
                'livingDonor' => $this->livingDonor,
            ]);
    }
}

