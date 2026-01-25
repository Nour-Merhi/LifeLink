<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    @php
      $fullName = $livingDonor->full_name ?? trim(implode(' ', array_filter([$livingDonor->first_name ?? null, $livingDonor->middle_name ?? null, $livingDonor->last_name ?? null])));
      $greetingName = $livingDonor->first_name ?? ($fullName ?: 'Donor');
      $organ = $livingDonor->organ ?? 'organ';
    @endphp

    <h2 style="margin: 0 0 12px 0;">You’re Medically Cleared</h2>

    <p>Dear {{ $greetingName }},</p>

    <p>
      We’re happy to let you know that your living {{ $organ }} donation case has been marked as <strong>Medically Cleared</strong>.
    </p>

    <p>
      Thank you for your generous contribution and for the big decision you made.
      Your commitment and courage mean a lot — you are making a real difference.
    </p>

    <p style="margin-top: 20px;">Warm regards,<br><strong>The LifeLink Team</strong></p>
  </body>
</html>

