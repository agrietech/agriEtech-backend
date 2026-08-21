const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');
const env = require('../../config/env');

// In-memory record of sent emails for testing / dev inspection
const sentEmailsLog = [];

// Reserved / dummy domains that should never be sent via real SMTP to avoid "Address not found" bounce emails
const DUMMY_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.org',
  'invalid',
  'localhost',
  'dummy.com',
  'sample.com',
]);

// Initialize Nodemailer transporter if SMTP credentials are provided
let transporter = null;
if (env.SMTP_USER && env.SMTP_PASS) {
  const isSecure = Number(env.SMTP_PORT) === 465;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(env.SMTP_PORT) || (isSecure ? 465 : 587),
    secure: isSecure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed/proxy cert issues
    },
  });
  logger.info(`[Email Dispatcher] Initialized SMTP transporter for ${env.SMTP_USER} on ${env.SMTP_HOST}:${env.SMTP_PORT}`);
}

/**
 * Send an email message.
 * Uses real SMTP transport for valid real addresses, with safe in-memory fallback for dummy/test domains.
 *
 * @param {object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<{ success: boolean, messageId: string, to: string }>}
 */
async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    throw new Error('Recipient email address is required');
  }

  const from = env.EMAIL_FROM || (env.SMTP_USER ? `AgriEtech <${env.SMTP_USER}>` : 'no-reply@agrietech.et');
  let messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const recipientDomain = (to.split('@')[1] || '').toLowerCase().trim();
  const isDummy = DUMMY_DOMAINS.has(recipientDomain) || recipientDomain.endsWith('.invalid') || recipientDomain.endsWith('.test');

  if (transporter && !isDummy) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html || text,
      });
      messageId = info.messageId;
      logger.info(`[Email Dispatcher] Sent real email to ${to} (MessageId: ${messageId})`);
    } catch (error) {
      logger.error(`[Email Dispatcher] Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  } else {
    // Log in-memory for testing/dummy domains to avoid "Address not found" bounce emails
    logger.info(`[Email Dispatcher Mock/Test] To: ${to} | Subject: "${subject}" | MessageId: ${messageId}`);
  }

  const record = {
    messageId,
    to,
    from,
    subject,
    text,
    html: html || text,
    sentAt: new Date().toISOString(),
  };

  sentEmailsLog.push(record);
  if (sentEmailsLog.length > 100) sentEmailsLog.shift();

  return {
    success: true,
    messageId,
    to,
  };
}

/**
 * Dispatch a Password Reset Email with link and token
 */
async function sendPasswordResetEmail(email, resetToken, resetLink) {
  const subject = '🔒 Reset Your AgriEtech Account Password';
  const resolvedLink = resetLink || `${env.APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
  const text = `AgriEtech Multi-Hazard Early Warning Platform\n\nPassword Reset Request\n\nHello,\n\nWe received a request to reset the password for your AgriEtech account associated with ${email}.\n\nYour 6-Digit Verification Code:\n>>> ${resetToken} <<<\n\nPlease click the link below or enter the 6-digit code on the reset page:\n${resolvedLink}\n\nThis code and link are valid for 1 hour.\n\nIf you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.\n\nBest regards,\nAgriEtech Platform Team\nAddis Ababa, Ethiopia\n${env.APP_URL}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password - AgriEtech</title>
      <style>
        @media only screen and (max-width: 620px) {
          .email-container { width: 100% !important; }
          .header-pad { padding: 24px 20px !important; }
          .body-pad { padding: 24px 20px !important; }
          .cta-btn { width: 100% !important; text-align: center !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <!-- Hidden Preheader Text -->
      <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        Reset your AgriEtech password with your 6-digit verification code: ${resetToken}.
      </div>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <tr>
                <td class="header-pad" style="background: linear-gradient(135deg, #0f3914 0%, #1b5e20 50%, #2e7d32 100%); padding: 36px 40px; text-align: left;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <div style="display: inline-block; background-color: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.25); border-radius: 20px; padding: 6px 14px; margin-bottom: 14px;">
                          <span style="color: #86efac; font-weight: 700; font-size: 12px; letter-spacing: 0.8px; text-transform: uppercase;">🌱 AgriEtech Security</span>
                        </div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.25;">
                          Password Reset Request
                        </h1>
                        <p style="margin: 6px 0 0 0; color: #dcfce7; font-size: 14px; font-weight: 400;">
                          Multi-Hazard Early Warning & Precision Agronomy System
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td class="body-pad" style="padding: 40px; color: #334155; line-height: 1.65; font-size: 15px;">
                  <p style="margin-top: 0; font-size: 16px; font-weight: 600; color: #0f172a;">
                    Hello,
                  </p>
                  <p style="margin: 0 0 16px 0;">
                    We received a request to reset the password for your account associated with <strong style="color: #0f172a;">${email}</strong>.
                  </p>

                  <!-- 6-Digit Numeric OTP Code Box -->
                  <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 24px 20px; text-align: center; margin: 24px 0;">
                    <div style="font-size: 12px; color: #15803d; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                      Your 6-Digit Verification Code
                    </div>
                    <div style="font-size: 38px; font-weight: 900; color: #166534; letter-spacing: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                      ${resetToken}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                      ⏱️ Valid for 1 hour
                    </div>
                  </div>

                  <p style="margin: 0 0 20px 0;">
                    You can either enter the 6-digit code above on the password reset screen or click the button below directly:
                  </p>

                  <!-- CTA Button -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
                    <tr>
                      <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); box-shadow: 0 4px 14px rgba(46,125,50,0.4);">
                              <a href="${resolvedLink}" target="_blank" class="cta-btn" style="display: inline-block; padding: 15px 36px; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; letter-spacing: 0.2px;">
                                🔒 Reset My Password &rarr;
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Fallback Link Card -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 28px 0 20px 0;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      Alternative link:
                    </p>
                    <p style="margin: 0; word-break: break-all; font-size: 13px; color: #2e7d32;">
                      <a href="${resolvedLink}" style="color: #2e7d32; text-decoration: underline;">${resolvedLink}</a>
                    </p>
                  </div>

                  <!-- Security Advisory -->
                  <div style="background-color: #fefce8; border-left: 4px solid #eab308; border-radius: 6px; padding: 14px 16px; margin-top: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #854d0e; line-height: 1.5;">
                      <strong>Security Notice:</strong> If you did not initiate this request, you can safely ignore this email. Your password will not change until you click the link and set a new one.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 28px 40px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
                  <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">
                    AgriEtech Multi-Hazard Early Warning & Precision Agronomy System
                  </p>
                  <p style="margin: 0 0 10px 0;">
                    Addis Ababa, Ethiopia &bull; <a href="${env.APP_URL}" style="color: #2e7d32; text-decoration: none; font-weight: 600;">${env.APP_URL}</a>
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    This is an automated security transmission. Please do not reply directly to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, text, html });
}

/**
 * Dispatch an Email Verification Link
 */
async function sendVerificationEmail(email, verificationToken, verificationLink) {
  const subject = '🌿 Verify Your AgriEtech Account';
  const resolvedLink = verificationLink || `${env.APP_URL}/api/v1/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

  const text = `Welcome to AgriEtech Multi-Hazard Early Warning Platform!\n\nHello,\n\nThank you for registering. Please verify your email address by clicking the link below:\n${resolvedLink}\n\nThis verification link is valid for 24 hours.\n\nOnce verified, you will unlock full access to:\n- Woreda-level climate & drought early warnings\n- AI crop disease diagnosis & treatments\n- Satellite vegetation vigor (NDVI) monitoring\n\nThank you,\nAgriEtech Platform Team\nAddis Ababa, Ethiopia\n${env.APP_URL}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - AgriEtech</title>
      <style>
        @media only screen and (max-width: 620px) {
          .email-container { width: 100% !important; }
          .header-pad { padding: 24px 20px !important; }
          .body-pad { padding: 24px 20px !important; }
          .cta-btn { width: 100% !important; text-align: center !important; }
          .feature-col { display: block !important; width: 100% !important; margin-bottom: 12px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <!-- Hidden Preheader Text -->
      <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        Welcome to AgriEtech! Please verify your email address to activate your account.
      </div>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <tr>
                <td class="header-pad" style="background: linear-gradient(135deg, #0f3914 0%, #1b5e20 50%, #2e7d32 100%); padding: 36px 40px; text-align: left;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <div style="display: inline-block; background-color: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.25); border-radius: 20px; padding: 6px 14px; margin-bottom: 14px;">
                          <span style="color: #86efac; font-weight: 700; font-size: 12px; letter-spacing: 0.8px; text-transform: uppercase;">🌱 Ethiopia Early Warning</span>
                        </div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.25;">
                          Welcome to AgriEtech!
                        </h1>
                        <p style="margin: 6px 0 0 0; color: #dcfce7; font-size: 14px; font-weight: 400;">
                          Multi-Hazard Early Warning & Precision Agronomy System
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td class="body-pad" style="padding: 40px; color: #334155; line-height: 1.65; font-size: 15px;">
                  <p style="margin-top: 0; font-size: 16px; font-weight: 600; color: #0f172a;">
                    Hello and welcome,
                  </p>
                  <p style="margin: 0 0 18px 0;">
                    Thank you for creating an account on <strong>AgriEtech</strong> with <strong style="color: #0f172a;">${email}</strong>.
                  </p>
                  <p style="margin: 0 0 24px 0;">
                    Please confirm your email address by clicking the button below. This step verifies your identity and activates all platform capabilities.
                  </p>

                  <!-- Feature Highlights Box -->
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
                      ✨ What you can do once verified:
                    </p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #14532d;">
                          🛰️ <strong>Drought & Flood Alerts:</strong> Real-time satellite hazard forecasting for your woreda.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #14532d;">
                          🌿 <strong>AI Crop Diagnosis:</strong> Instant disease identification and treatment plans.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #14532d;">
                          📊 <strong>Precision Agronomy:</strong> Soil moisture & rainfall analytics tailored to Ethiopian crops.
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA Button -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); box-shadow: 0 4px 14px rgba(46,125,50,0.4);">
                              <a href="${resolvedLink}" target="_blank" class="cta-btn" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; letter-spacing: 0.2px;">
                                ✅ Verify Email Address &rarr;
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Expiration & Validity Note -->
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span style="display: inline-block; background-color: #f1f5f9; border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 600; color: #475569;">
                      ⏱️ Link expires in 24 hours
                    </span>
                  </div>

                  <!-- Fallback Link Card -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      If the button doesn't open, copy and paste this link:
                    </p>
                    <p style="margin: 0; word-break: break-all; font-size: 13px; color: #2e7d32;">
                      <a href="${resolvedLink}" style="color: #2e7d32; text-decoration: underline;">${resolvedLink}</a>
                    </p>
                  </div>

                  <!-- Amharic Bilingual Summary -->
                  <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #64748b; font-style: italic; line-height: 1.6;">
                      🇪🇹 <strong>ማሳሰቢያ፦</strong> የአግሪኢቴክ መለያዎን ለማረጋገጥ እና የአየር ንብረትና የሰብል በሽታ ማስጠንቀቂያዎችን ለማግኘት ከላይ ያለውን አረንጓዴ ቁልፍ ይጫኑ።
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 28px 40px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
                  <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">
                    AgriEtech Multi-Hazard Early Warning & Precision Agronomy System
                  </p>
                  <p style="margin: 0 0 10px 0;">
                    Addis Ababa, Ethiopia &bull; <a href="${env.APP_URL}" style="color: #2e7d32; text-decoration: none; font-weight: 600;">${env.APP_URL}</a>
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    If you did not register for an AgriEtech account, please disregard this email or contact support.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, text, html });
}

/**
 * Get in-memory email log (for tests)
 */
function getSentEmailsLog() {
  return sentEmailsLog;
}

/**
 * Clear email log (for tests)
 */
function clearSentEmailsLog() {
  sentEmailsLog.length = 0;
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  getSentEmailsLog,
  clearSentEmailsLog,
};
