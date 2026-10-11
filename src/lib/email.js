import nodemailer from "nodemailer";

const {
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  GMAIL_FROM_NAME = "Deshi Bazar",
} = process.env;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.warn(
    "GMAIL_USER or GMAIL_APP_PASSWORD is not set. Email sending will fail.",
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

const LOCK_ICON = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

/**
 * Build a consistent, production-grade HTML email shell with the brand header,
 * content area, and footer. All emails share the same design system.
 */
function buildEmailLayout({ title, icon, eyebrow, heading, body, content, footerNote }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <title>${title} · Deshi Bazar</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width:600px; width:100%;" cellpadding="0" cellspacing="0">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1d4ed8 0%,#7c3aed 100%); padding:36px 32px; text-align:center; border-radius:16px 16px 0 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <div style="width:48px; height:48px; background-color:rgba(255,255,255,0.15); border-radius:12px; display:inline-block; line-height:48px; text-align:center; vertical-align:middle;">${icon}</div>
                        <div style="font-size:26px; font-weight:800; color:#ffffff; margin-top:14px; letter-spacing:-0.3px;">Deshi Bazar</div>
                        <div style="font-size:12px; font-weight:600; color:rgba(255,255,255,0.85); margin-top:4px; letter-spacing:1.5px;">${eyebrow}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="background-color:#ffffff; padding:40px 32px 32px 32px; text-align:center;">
                  <h1 style="margin:0 0 14px 0; font-size:22px; font-weight:700; color:#0f172a;">${heading}</h1>
                  <p style="margin:0 0 28px 0; font-size:15px; line-height:1.6; color:#64748b;">${body}</p>
                  ${content}
                  <div style="margin-top:32px; border-top:1px solid #f1f5f9; padding-top:20px;">
                    <p style="margin:0; font-size:13px; line-height:1.6; color:#94a3b8;">${footerNote}</p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color:#f8fafc; padding:24px 32px; text-align:center; border-radius:0 0 16px 16px; border-top:1px solid #e2e8f0;">
                  <p style="margin:0; font-size:13px; color:#0f172a; font-weight:700;">Deshi Bazar</p>
                  <p style="margin:4px 0 0 0; font-size:12px; color:#94a3b8;">&copy; ${new Date().getFullYear()} Deshi Bazar. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function send2FACode(email, code) {
  const mailOptions = {
    from: `${GMAIL_FROM_NAME} <${GMAIL_USER}>`,
    to: email,
    subject: `Your Deshi Bazar Verification Code · ${code}`,
    text: `Your Deshi Bazar verification code is: ${code}\n\nThis code will expire in 5 minutes. If you did not request this code, please ignore this email.`,
    html: buildEmailLayout({
      title: "Two-Factor Authentication",
      icon: LOCK_ICON,
      eyebrow: "SECURE AUTHENTICATION",
      heading: "Verify your identity",
      body: "Enter the verification code below to complete your sign-in.",
      content: `
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; border-radius:14px; border:1px solid #e2e8f0;">
                          <tr>
                            <td style="padding:18px 26px; font-family:'Courier New', monospace; font-size:42px; font-weight:700; color:#0f172a; letter-spacing:10px; line-height:1;">${code}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top:20px;">
                        <p style="margin:0; font-size:14px; color:#94a3b8;">
                          This code will expire in <strong style="color:#0f172a;">5 minutes</strong>.
                        </p>
                      </td>
                    </tr>
                  `,
      footerNote:
        "If you did not request this code, please ignore this email — your account remains secure.",
    }),
  };

  return transporter.sendMail(mailOptions);
}

export async function sendResetPasswordEmail(email, resetUrl) {
  const mailOptions = {
    from: `${GMAIL_FROM_NAME} <${GMAIL_USER}>`,
    to: email,
    subject: "Reset your Deshi Bazar password",
    text: `We received a request to reset your Deshi Bazar password.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request a password reset, please ignore this email.`,
    html: buildEmailLayout({
      title: "Reset Your Password",
      icon: LOCK_ICON,
      eyebrow: "PASSWORD RESET",
      heading: "Reset your password",
      body: "We received a request to reset your password. Click the button below to create a new password.",
      content: `
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="display: inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:15px 36px; border-radius:10px; font-size:16px; font-weight:600; letter-spacing:0.2px;">Reset Password</a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top:24px;">
                        <p style="margin:0 0 6px 0; font-size:13px; color:#94a3b8;">
                          If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <a href="${resetUrl}" style="color:#2563eb; font-size:13px; word-break:break-all; text-decoration:none;">${resetUrl}</a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top:20px;">
                        <p style="margin:0; font-size:14px; color:#64748b;">
                          This link will expire in <strong style="color:#0f172a;">1 hour</strong>.
                        </p>
                      </td>
                    </tr>
                  `,
      footerNote:
        "If you did not request a password reset, you can safely ignore this email.",
    }),
  };

  return transporter.sendMail(mailOptions);
}
