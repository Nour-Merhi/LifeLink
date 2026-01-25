<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    @php
      $fullName = $livingDonor->full_name ?? trim(implode(' ', array_filter([$livingDonor->first_name ?? null, $livingDonor->middle_name ?? null, $livingDonor->last_name ?? null])));
      $greetingName = $livingDonor->first_name ?? ($fullName ?: 'Donor');
    @endphp

    <h2 style="margin: 0 0 12px 0;">Appointment Cancelled</h2>

    <p>Dear {{ $greetingName }},</p>

    <p>
      We’re sorry to inform you that your living organ donation appointment has been <strong>cancelled</strong>.
    </p>

    @if(!empty($reason))
      <p><strong>Reason:</strong> {{ $reason }}</p>
    @endif

    <p>
      At this point, no further actions will be taken for this appointment.
      Thank you for your willingness to contribute — your support matters.
    </p>

    <p style="margin-top: 20px;">Warm regards,<br><strong>The LifeLink Team</strong></p>
  </body>
</html>

