<?php

namespace App\Mail;

use App\Models\Donor;
use App\Models\HomeAppointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class HomeDonationRegistered extends Mailable
{
    use Queueable, SerializesModels;

    public Donor $donor;
    public HomeAppointment $homeAppointment;
    /**
     * Create a new message instance.
     */
    public function __construct(Donor $donor, HomeAppointment $homeAppointment)
    {
        $this->donor = $donor;
        $this->homeAppointment = $homeAppointment;
    }

   public function build(){
    return $this->subject('LifeLink: Home Donation Confirmation')
    ->view('emails.home_donation_registered')
    ->with([
        'donor' => $this->donor,
        'homeAppointment' => $this->homeAppointment,
    ]);
   }

}
