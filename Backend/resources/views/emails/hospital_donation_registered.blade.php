<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="margin: 0 0 12px 0;">Hospital Donation Confirmation</h2>

    @php
      $firstName = $donor->user->first_name ?? null;
      $fullName = trim(implode(' ', array_filter([
        $donor->user->first_name ?? null,
        $donor->user->middle_name ?? null,
        $donor->user->last_name ?? null,
      ])));
      $greetingName = $firstName ?: ($fullName ?: 'Donor');

      $bloodType = $donor->bloodType ? trim(($donor->bloodType->type ?? '') . ($donor->bloodType->rh_factor ?? '')) : null;
      $bloodType = $bloodType ?: 'N/A';

      $appointmentDate = $hospitalAppointment->appointment->appointment_date ?? null;
      $appointmentTime = $hospitalAppointment->appointment_time ?? null;
      $hospitalName = $hospitalAppointment->hospital->name ?? 'N/A';
      $hospitalAddress = $hospitalAppointment->hospital->address ?? null;
      $note = $hospitalAppointment->note ?? null;
    @endphp

    <p>Dear {{ $greetingName }},</p>

    <p>Your <strong>Hospital Donation</strong> registration has been received successfully.</p>

    <h4 style="margin: 16px 0 0 0;">Your Donation Details</h4>
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Name</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $fullName ?: $greetingName }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Phone</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $donor->user->phone_nb ?? 'N/A' }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Blood Type</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $bloodType }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Appointment Date</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $appointmentDate ?: 'N/A' }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Appointment Time</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">{{ $appointmentTime ?: 'N/A' }}</td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left; border-bottom: 1px solid #eee;">Hospital</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #eee;">
          {{ $hospitalName }}@if($hospitalAddress) — {{ $hospitalAddress }}@endif
        </td>
      </tr>
      <tr>
        <td style="padding: 6px 14px 6px 0; font-weight: bold; text-align: left;">Note</td>
        <td style="padding: 6px 0;">{{ $note ?: 'N/A' }}</td>
      </tr>
    </table>

    <p style="margin-top: 20px;">Thank you for your support.<br><strong>The LifeLink Team</strong></p>
  </body>
</html>

