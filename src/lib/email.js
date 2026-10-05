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

export async function send2FACode(email, code) {
  const mailOptions = {
    from: `${GMAIL_FROM_NAME} <${GMAIL_USER}>`,
    to: email,
    subject: "Your Two-Factor Authentication Code",
    text: `Your verification code is: ${code}\n\nThis code will expire in 5 minutes.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Two-Factor Authentication</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Deshi Bazar</h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">Secure Authentication</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px 30px 30px; text-align: center;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 22px; font-weight: 600;">Two-Factor Authentication</h2>
                    <p style="color: #64748b; margin: 0; font-size: 15px; line-height: 1.6;">Enter the verification code below to complete your sign-in.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; border: 2px dashed #cbd5e1;">
                          <span style="font-size: 32px; font-weight: 700; color: #1e293b; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                      This code will expire in <strong style="color: #1e293b;">5 minutes</strong>.<br>
                      If you did not request this code, please ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} ${GMAIL_FROM_NAME}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email, resetUrl) {
  const mailOptions = {
    from: `${GMAIL_FROM_NAME} <${GMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password",
    text: `We received a request to reset your password.\n\nClick the link below to choose a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, please ignore this email. Your password will remain unchanged.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Deshi Bazar</h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">Account Security</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px 30px 30px; text-align: center;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 22px; font-weight: 600;">Reset Your Password</h2>
                    <p style="color: #64748b; margin: 0; font-size: 15px; line-height: 1.6;">We received a request to reset the password for your account. Click the button below to choose a new one.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 36px; border-radius: 10px;">Reset Password</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                      This link will expire in <strong style="color: #1e293b;">1 hour</strong>.<br>
                      If you did not request a password reset, please ignore this email — your password will remain unchanged.
                    </p>
                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 12px 0 0 0; word-break: break-all;">
                      If the button doesn't work, copy and paste this link into your browser:<br>
                      <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} ${GMAIL_FROM_NAME}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}
