<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    @php
      $donorName = $certificate->donor_name;
      $description = $certificate->description_option;
      $certificateDate = $certificate->certificate_date 
        ? \Carbon\Carbon::parse($certificate->certificate_date)->format('d/m/Y')
        : ($certificate->created_at ? $certificate->created_at->format('d/m/Y') : 'N/A');
    @endphp

    <h2 style="margin: 0 0 12px 0;">Certificate Issued</h2>

    <p>Dear {{ $donorName }},</p>

    <p>
      We are pleased to inform you that a certificate has been issued to you in recognition of your contribution.
    </p>

    <p>
      <strong>Your certificate details:</strong>
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 14px 0;">
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Certificate Type</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $description }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Date Issued</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $certificateDate }}</td>
      </tr>
    </table>

    <p>
      You can view and download your certificate from your donor dashboard. Log in to your account and navigate to your <strong>Rewards</strong> page to access it.
    </p>

    <p style="margin-top: 20px;">
      Thank you for your continued support and dedication to saving lives.
    </p>

    <p style="margin-top: 20px;">Warm regards,<br><strong>The LifeLink Team</strong></p>
  </body>
</html>
