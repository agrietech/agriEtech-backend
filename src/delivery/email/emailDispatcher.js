const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');
const env = require('../../config/env');

// In-memory record of sent emails for testing / dev inspection
const sentEmailsLog = [];

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
 * Uses real SMTP transport if configured, with logger/in-memory fallback.
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

  if (transporter) {
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
    logger.info(`[Email Dispatcher Mock] To: ${to} | Subject: "${subject}" | MessageId: ${messageId}`);
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
  const subject = '[AgriEtech] Password Reset Request';
  const resolvedLink = resetLink || `${env.APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
  const text = `Hello,\n\nYou requested a password reset for your AgriEtech account.\n\nPlease click the link below to set a new password:\n${resolvedLink}\n\nThis link is valid for 1 hour. If you did not make this request, you can safely ignore this email.\n\nBest regards,\nAgriEtech Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2e7d32;">AgriEtech Platform</h2>
      <p>Hello,</p>
      <p>You requested a password reset for your AgriEtech account.</p>
      <p style="margin: 25px 0;">
        <a href="${resolvedLink}" style="background-color: #2e7d32; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
      </p>
      <p style="color: #666; font-size: 13px;">Or copy and paste this URL into your browser:<br/><a href="${resolvedLink}">${resolvedLink}</a></p>
      <p style="color: #888; font-size: 12px;">This reset link will expire in 1 hour. If you did not request this, please ignore this email.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}

/**
 * Dispatch an Email Verification Link
 */
async function sendVerificationEmail(email, verificationToken, verificationLink) {
  const subject = '[AgriEtech] Verify Your Email Address';
  const resolvedLink = verificationLink || `${env.APP_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

  const text = `Welcome to AgriEtech!\n\nPlease verify your email by clicking the link below:\n${resolvedLink}\n\nThank you,\nAgriEtech Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2e7d32;">Welcome to AgriEtech!</h2>
      <p>Thank you for registering. Please verify your email address to activate all features.</p>
      <p style="margin: 25px 0;">
        <a href="${resolvedLink}" style="background-color: #2e7d32; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email</a>
      </p>
      <p style="color: #666; font-size: 13px;">Or copy and paste this link:<br/><a href="${resolvedLink}">${resolvedLink}</a></p>
    </div>
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
