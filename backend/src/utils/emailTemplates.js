const base = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Eonix Solutions</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F9FB;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F9FB;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#1F5E63;border-radius:12px;padding:10px 20px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1px;">EONIX</span>
                    <span style="color:#A7D1D4;font-size:13px;font-weight:400;margin-left:6px;">Solutions</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                © ${new Date().getFullYear()} Eonix Solutions · academy@eonixsolutions.in
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#CBD5E1;">
                If you didn't request this email, you can safely ignore it.
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
         style="display:inline-block;background-color:#C76D64;color:#ffffff;font-size:14px;font-weight:700;
                text-decoration:none;padding:13px 28px;border-radius:10px;letter-spacing:0.3px;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;

const divider = `<tr><td style="border-top:1px solid #F1F5F9;padding-top:20px;"></td></tr>`;

export const verifyEmailTemplate = ({ name, verifyUrl }) =>
  base(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1E293B;">Verify your email</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, welcome to Eonix Solutions! Please verify your email address to activate your account.
    </p>
    ${btn(verifyUrl, 'Verify Email Address')}
    <table width="100%" cellpadding="0" cellspacing="0">${divider}</table>
    <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;">
      This link expires in <strong>24 hours</strong>. If the button doesn't work, copy and paste this URL into your browser:
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:#94A3B8;word-break:break-all;">${verifyUrl}</p>
  `);

export const accountActivatedTemplate = ({ name, loginUrl }) =>
  base(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1E293B;">Your account is activated!</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, great news! Your payment has been verified and your Eonix student account is now active.
      You can log in and start your learning journey.
    </p>
    ${btn(loginUrl, 'Log In to Eonix')}
    <table width="100%" cellpadding="0" cellspacing="0">${divider}</table>
    <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;">
      Need help? Reach us at <a href="mailto:academy@eonixsolutions.in" style="color:#1F5E63;">academy@eonixsolutions.in</a>
      or WhatsApp us at +91 80892 72211.
    </p>
  `);

export const resetPasswordTemplate = ({ resetUrl }) =>
  base(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1E293B;">Reset your password</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      You requested a password reset for your Eonix account. Click the button below to choose a new password.
    </p>
    ${btn(resetUrl, 'Reset Password')}
    <table width="100%" cellpadding="0" cellspacing="0">${divider}</table>
    <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;">
      This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
    </p>
  `);
