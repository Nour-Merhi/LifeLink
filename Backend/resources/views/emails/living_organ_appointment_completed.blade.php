<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    @php
      $fullName = $livingDonor->full_name ?? trim(implode(' ', array_filter([$livingDonor->first_name ?? null, $livingDonor->middle_name ?? null, $livingDonor->last_name ?? null])));
      $greetingName = $livingDonor->first_name ?? ($fullName ?: 'Donor');
      $slot = $livingDonor->selected_appointment_at ? $livingDonor->selected_appointment_at->format('M d, Y • H:i') : null;
    @endphp

    <h2 style="margin: 0 0 12px 0;">Appointment Completed</h2>

    <p>Dear {{ $greetingName }},</p>

    <p>
      Thank you for attending your living organ donation appointment{{ $slot ? " on ".$slot : "" }}.
      Your contribution means a lot, and we truly appreciate your commitment.
    </p>

    <p>
      Our team will contact you soon with further details regarding the next steps
      (including surgery date and time preparation).
    </p>

    <p style="margin-top: 20px;">Warm regards,<br><strong>The LifeLink Team</strong></p>
  </body>
</html>

