const base = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mwasalat Learning Platform</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F9FB;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F9FB;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#1F5E63;border-radius:12px;padding:10px 20px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1px;">MWASALAT</span>
                    <span style="color:#A7D1D4;font-size:13px;font-weight:400;margin-left:6px;">Learning Platform</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
              ${content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                © ${new Date().getFullYear()} Mwasalat Learning Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const btn = (url, label) => `
<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td align="left">
      <a href="${url}"
         style="display:inline-block;background-color:#1F5E63;color:#ffffff;font-size:14px;font-weight:700;
                text-decoration:none;padding:13px 28px;border-radius:10px;letter-spacing:0.3px;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;

export const instructorInviteTemplate = ({ name, setPasswordUrl }) =>
  base(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1E293B;">You're invited as an instructor</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, an administrator has invited you to join the Mwasalat Learning Platform as an instructor.
      Set your password to activate your account.
    </p>
    ${btn(setPasswordUrl, 'Set Your Password')}
    <p style="margin:20px 0 0;font-size:13px;color:#94A3B8;line-height:1.6;">
      This link expires in <strong>7 days</strong>. If the button doesn't work, copy and paste this URL into your browser:
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:#94A3B8;word-break:break-all;">${setPasswordUrl}</p>
  `);

export const mwasalatResetPasswordTemplate = ({ resetUrl }) =>
  base(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1E293B;">Reset your password</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      You requested a password reset for your Mwasalat Learning Platform account. Click the button below to choose a new password.
    </p>
    ${btn(resetUrl, 'Reset Password')}
    <p style="margin:20px 0 0;font-size:13px;color:#94A3B8;line-height:1.6;">
      This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
    </p>
  `);

export const certificateIssuedTemplate = ({ name, courseTitle, certificateNumber, issuedAt, certificateUrl }) =>
  base(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1E293B;">Congratulations, ${name}! 🎉</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      You've successfully completed <strong>${courseTitle}</strong> and earned your certificate on the Mwasalat Learning Platform.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:2px solid #1F5E63;border-radius:14px;">
      <tr>
        <td style="padding:24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Certificate of Completion</p>
          <p style="margin:10px 0 2px;font-size:19px;font-weight:700;color:#1E293B;">${name}</p>
          <p style="margin:0 0 10px;font-size:13px;color:#475569;">${courseTitle}</p>
          <p style="margin:0;font-size:11px;color:#94A3B8;">Issued ${new Date(issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · No. ${certificateNumber}</p>
        </td>
      </tr>
    </table>
    ${btn(certificateUrl, 'View & Download Certificate')}
    <p style="margin:20px 0 0;font-size:13px;color:#94A3B8;line-height:1.6;">
      Keep up the momentum — browse more courses from your dashboard.
    </p>
  `);

export const accountBlockedTemplate = ({ name, reason }) =>
  base(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1E293B;">Your account has been blocked</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, an administrator has blocked your access to the Mwasalat Learning Platform.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background-color:#FBE9E7;border-radius:12px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.5px;color:#A94E43;text-transform:uppercase;font-weight:700;">Reason</p>
          <p style="margin:0;font-size:14px;color:#1E293B;line-height:1.5;">${reason}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;">
      If you believe this is a mistake, please contact your Mwasalat administrator.
    </p>
  `);
