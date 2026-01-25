<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    @php
      $fullName = trim(implode(' ', array_filter([
        $pledge->first_name ?? null,
        $pledge->middle_name ?? null,
        $pledge->last_name ?? null,
      ])));
      $greetingName = $pledge->first_name ?? ($fullName ?: 'Donor');
      $pledgedList = is_array($pledge->pledged_organs) ? $pledge->pledged_organs : [];
      $organsDisplay = 'N/A';
      if (!empty($pledgedList)) {
        $organsDisplay = in_array('all-organs', $pledgedList) ? 'All organs' : implode(', ', array_map('ucfirst', $pledgedList));
      }
    @endphp

    <h2 style="margin: 0 0 12px 0;">Thank You for Your Generosity</h2>

    <p>Dear {{ $greetingName }},</p>

    <p>
      Thank you for registering your <strong>after-death organ donation pledge</strong> with LifeLink.
      Your generosity gives hope to many who are waiting for a transplant.
    </p>

    <p>
      We are grateful for your decision to leave a legacy of life. One donor can save up to 8 lives,
      and your pledge today can bring new beginnings to patients and their families in the future.
    </p>

    <h4 style="margin: 16px 0 8px 0;">Your Pledge Details</h4>
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Pledge ID</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $pledge->code ?? 'N/A' }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Name</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $fullName ?: 'N/A' }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Blood Type</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $pledge->blood_type ?? 'N/A' }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left;">Pledged Organs</td>
        <td style="padding: 6px 0;">{{ $organsDisplay ?: 'N/A' }}</td>
      </tr>
    </table>

    <p>Your registration has been received successfully. We encourage you to share your decision with your family and loved ones.</p>

    <p>Thank you again for your support and for choosing to make a difference.</p>

    <p style="margin-top: 20px;">Warm regards,<br><strong>The LifeLink Team</strong></p>
  </body>
</html>
