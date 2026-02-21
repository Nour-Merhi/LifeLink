<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Donor;
use App\Models\HospitalAppointment;

class HospitalDonationRegistered extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Donor $donor;
    public HospitalAppointment $hospitalAppointment;

    public function __construct(Donor $donor, HospitalAppointment $hospitalAppointment)
    {
        $this->donor = $donor;
        $this->hospitalAppointment = $hospitalAppointment;
    }

    public function build()
    {
        return $this->subject('LifeLink: Hospital Donation Confirmation')
            ->view('emails.hospital_donation_registered')
            ->with([
                'donor' => $this->donor,
                'hospitalAppointment' => $this->hospitalAppointment,
            ]);
    }
}
