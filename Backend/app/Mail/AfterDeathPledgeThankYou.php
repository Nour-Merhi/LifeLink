<?php

namespace App\Mail;

use App\Models\AfterDeathPledge;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AfterDeathPledgeThankYou extends Mailable
{
    use Queueable, SerializesModels;

    public AfterDeathPledge $pledge;

    /**
     * Create a new message instance.
     */
    public function __construct(AfterDeathPledge $pledge)
    {
        $this->pledge = $pledge;
    }

    public function build()
    {
        return $this->subject('Thank You for Registering – After-Death Organ Pledge | LifeLink')
            ->view('emails.after_death_pledge_thank_you')
            ->with(['pledge' => $this->pledge]);
    }
}
