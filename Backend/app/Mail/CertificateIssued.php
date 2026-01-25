<?php

namespace App\Mail;

use App\Models\Certificate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CertificateIssued extends Mailable
{
    use Queueable, SerializesModels;

    public Certificate $certificate;

    /**
     * Create a new message instance.
     */
    public function __construct(Certificate $certificate)
    {
        $this->certificate = $certificate;
    }

    public function build()
    {
        return $this->subject('Your Certificate Has Been Issued | LifeLink')
            ->view('emails.certificate_issued')
            ->with(['certificate' => $this->certificate]);
    }
}
