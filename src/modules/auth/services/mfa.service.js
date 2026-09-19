const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('../../../config/db');
const { BadRequestError, UnauthorizedError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

// Encryption helpers for TOTP secrets
const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

class MFAService {
  /**
   * Generate TOTP secret and QR code for authenticator app setup
   */
  async setupTOTP(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestError('User not found');

    if (user.mfaEnabled) {
      throw new BadRequestError('MFA is already enabled. Disable it first to reconfigure.');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `EthioFarm (${user.email || user.phoneNumber})`,
      issuer: 'EthioFarm',
      length: 32
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Store encrypted secret (but don't enable yet)
    await prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: encrypt(secret.base32),
        backupCodes: hashedBackupCodes,
        mfaMethod: 'TOTP',
        mfaEnabled: false // Will be enabled after verification
      }
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    logger.info(`[MFA] TOTP setup initiated for user ${userId}`);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: backupCodes, // Show once only
      otpauthUrl: secret.otpauth_url
    };
  }

  /**
   * Verify TOTP token and enable MFA
   */
  async verifyAndEnableTOTP(userId, token) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) {
      throw new BadRequestError('TOTP setup not found. Please run setup first.');
    }

    const secret = decrypt(user.totpSecret);
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps tolerance (±60 seconds)
    });

    if (!verified) {
      throw new UnauthorizedError('Invalid verification code. Please try again.');
    }

    // Enable MFA
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true }
    });

    logger.info(`[MFA] TOTP enabled for user ${userId}`);

    return {
      success: true,
      message: 'Two-factor authentication enabled successfully',
      mfaEnabled: true
    };
  }

  /**
   * Verify TOTP token during login
   */
  async verifyTOTP(userId, token) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || !user.mfaEnabled || !user.totpSecret) {
      throw new BadRequestError('MFA not configured for this user');
    }

    // Try TOTP verification
    const secret = decrypt(user.totpSecret);
    const totpVerified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (totpVerified) {
      logger.info(`[MFA] TOTP verification successful for user ${userId}`);
      return { verified: true, method: 'TOTP' };
    }

    // Try backup codes
    const backupVerified = await this.verifyBackupCode(userId, token);
    if (backupVerified) {
      logger.info(`[MFA] Backup code verification successful for user ${userId}`);
      return { verified: true, method: 'BACKUP_CODE' };
    }

    throw new UnauthorizedError('Invalid authentication code');
  }

  /**
   * Verify and consume a backup code
   */
  async verifyBackupCode(userId, code) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.backupCodes || user.backupCodes.length === 0) {
      return false;
    }

    // Check each backup code
    for (let i = 0; i < user.backupCodes.length; i++) {
      const match = await bcrypt.compare(code, user.backupCodes[i]);
      if (match) {
        // Remove used backup code
        const newBackupCodes = [...user.backupCodes];
        newBackupCodes.splice(i, 1);

        await prisma.user.update({
          where: { id: userId },
          data: { backupCodes: newBackupCodes }
        });

        logger.warn(`[MFA] Backup code used for user ${userId}. ${newBackupCodes.length} codes remaining.`);
        return true;
      }
    }

    return false;
  }

  /**
   * Send SMS OTP
   */
  async sendSMSOTP(userId, phoneNumber) {
    if (!phoneNumber) {
      throw new BadRequestError('Phone number required for SMS OTP');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash and store OTP
    const hashedOTP = await bcrypt.hash(otp, 10);

    await prisma.oTPVerification.create({
      data: {
        userId: userId || undefined,
        phoneNumber,
        code: hashedOTP,
        type: 'MFA',
        attempts: 0,
        expiresAt
      }
    });

    // Send SMS via delivery service
    try {
      const { sendSMS } = require('../../../delivery/sms/smsDispatcher');
      await sendSMS({
        to: phoneNumber,
        message: `Your EthioFarm verification code is: ${otp}\n\nValid for 10 minutes. Do not share this code.`
      });

      logger.info(`[MFA] SMS OTP sent to ${phoneNumber}`);
    } catch (err) {
      logger.error(`[MFA] Failed to send SMS OTP: ${err.message}`);
      throw new Error('Failed to send SMS. Please try again.');
    }

    return {
      success: true,
      message: 'Verification code sent via SMS',
      expiresIn: 600 // seconds
    };
  }

  /**
   * Verify SMS OTP
   */
  async verifySMSOTP(phoneNumber, code) {
    // Find recent OTP for this phone
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        phoneNumber,
        type: 'MFA',
        verified: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      throw new UnauthorizedError('No valid verification code found. Please request a new one.');
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      throw new UnauthorizedError('Too many failed attempts. Please request a new code.');
    }

    // Verify code
    const match = await bcrypt.compare(code, otpRecord.code);

    if (!match) {
      // Increment attempts
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      });

      throw new UnauthorizedError('Invalid verification code');
    }

    // Mark as verified
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: {
        verified: true,
        verifiedAt: new Date()
      }
    });

    logger.info(`[MFA] SMS OTP verified for ${phoneNumber}`);

    return {
      verified: true,
      userId: otpRecord.userId
    };
  }

  /**
   * Disable MFA for a user
   */
  async disableMFA(userId, password) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestError('User not found');

    // Verify password before disabling MFA
    if (!user.passwordHash) {
      throw new BadRequestError('Cannot disable MFA: No password set');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid password');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        totpSecret: null,
        backupCodes: [],
        mfaMethod: null
      }
    });

    logger.info(`[MFA] MFA disabled for user ${userId}`);

    return {
      success: true,
      message: 'Two-factor authentication has been disabled'
    };
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId, password) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestError('User not found');

    if (!user.mfaEnabled) {
      throw new BadRequestError('MFA is not enabled');
    }

    // Verify password
    if (password && user.passwordHash) {
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        throw new UnauthorizedError('Invalid password');
      }
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    await prisma.user.update({
      where: { id: userId },
      data: { backupCodes: hashedBackupCodes }
    });

    logger.info(`[MFA] Backup codes regenerated for user ${userId}`);

    return {
      success: true,
      backupCodes: backupCodes, // Show once only
      message: 'New backup codes generated. Store them securely.'
    };
  }

  /**
   * Generate random backup codes
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Get MFA status for a user
   */
  async getMFAStatus(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaEnabled: true,
        mfaMethod: true,
        backupCodes: true
      }
    });

    if (!user) throw new BadRequestError('User not found');

    return {
      mfaEnabled: user.mfaEnabled,
      mfaMethod: user.mfaMethod,
      backupCodesRemaining: user.backupCodes ? user.backupCodes.length : 0
    };
  }
}

module.exports = new MFAService();
