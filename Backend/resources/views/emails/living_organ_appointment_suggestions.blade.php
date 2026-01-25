<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    @php
      $fullName = $livingDonor->full_name ?? trim(implode(' ', array_filter([$livingDonor->first_name ?? null, $livingDonor->middle_name ?? null, $livingDonor->last_name ?? null])));
      $greetingName = $livingDonor->first_name ?? ($fullName ?: 'Donor');
    @endphp

    <h2 style="margin: 0 0 12px 0;">Choose Your Appointment</h2>

    <p>Dear {{ $greetingName }},</p>

    <p>
      Great news — your living organ donation pledge has been <strong>approved</strong>.
      Please choose one of the suggested appointment options below.
    </p>

    <h4 style="margin: 16px 0 8px 0;">Suggested appointment options</h4>
    <ul style="padding-left: 18px;">
      @foreach(($slots ?? []) as $s)
        <li>{{ $s }}</li>
      @endforeach
    </ul>

    <p>
      To select your preferred appointment, please open your dashboard and go to:
      <strong>My Appointments</strong>.
    </p>

    <div style="margin: 18px 0;">
      <a
        href="{{ $dashboardUrl }}"
        style="display: inline-block; background: #F12C31; color: #fff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;"
      >
        Open My Appointments
      </a>
    </div>

    <p style="color:#666; font-size: 13px;">
      If the button doesn’t work, copy and paste this link into your browser:<br/>
      <span>{{ $dashboardUrl }}</span>
    </p>

    <p style="margin-top: 20px;">Warm regards,<br><strong>The LifeLink Team</strong></p>
  </body>
</html>

