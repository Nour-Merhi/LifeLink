<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    @php
      $fullName = $livingDonor->full_name ?? trim(implode(' ', array_filter([$livingDonor->first_name ?? null, $livingDonor->middle_name ?? null, $livingDonor->last_name ?? null])));
      $greetingName = $livingDonor->first_name ?? ($fullName ?: 'Donor');
    @endphp

    <h2 style="margin: 0 0 12px 0;">Living Organ Pledge Received</h2>

    <p>Dear {{ $greetingName }},</p>

    <p>
      Thank you for registering a <strong>Living Organ Donation Pledge</strong> with LifeLink.
      We’ve successfully received your registration.
    </p>

    <p>
      Your pledge is currently under review. Please wait for <strong>ethics approval</strong> before proceeding.
      Once approved, you will receive another email with appointment options to choose from.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 14px 0;">
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; border-bottom: 1px solid #eee;">Pledge ID</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $livingDonor->code ?? 'N/A' }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; border-bottom: 1px solid #eee;">Organ</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $livingDonor->organ ?? 'N/A' }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold;">Current Status</td>
        <td style="padding: 6px 0;">Pending approval</td>
      </tr>
    </table>

    <p>Thank you for contributing and helping save lives.</p>

    <p style="margin-top: 20px;">Warm regards,<br><strong>The LifeLink Team</strong></p>
  </body>
</html>

