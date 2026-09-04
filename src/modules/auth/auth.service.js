const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma, isConnected } = require('../../config/db');
const env = require('../../config/env');
const {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} = require('../../utils/errors');
const {
  sendPasswordResetEmail,
  sendVerificationEmail: _sendVerificationEmail,
} = require('../../delivery/email/emailDispatcher');
const logger = require('../../utils/logger');
const redis = require('../../config/redis');

// Helper to validate email format
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function sanitizeUser(user) {
  if (!user) return null;
  const {
    passwordHash: _passwordHash,
    resetPasswordToken: _resetPasswordToken,
    resetPasswordExpires: _resetPasswordExpires,
    verificationToken: _verificationToken,
    ...sanitized
  } = user;

  return {
    ...sanitized,
    email: sanitized.email || null,
    phoneNumber: sanitized.phoneNumber || null,
    fullName: sanitized.fullName,
    role: sanitized.role,
    regionId: sanitized.regionId || null,
    zoneId: sanitized.zoneId || null,
    woredaId: sanitized.woredaId || null,
    kebeleId: sanitized.kebeleId || null,
    kebeleName: sanitized.kebeleName || null,
    preferredLang: sanitized.preferredLang || 'en',
    isEmailVerified: Boolean(sanitized.isEmailVerified),
    createdAt: sanitized.createdAt,
    updatedAt: sanitized.updatedAt,
  };
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email || null,
      phoneNumber: user.phoneNumber || null,
      fullName: user.fullName,
      role: user.role,
      regionId: user.regionId || null,
      zoneId: user.zoneId || null,
      woredaId: user.woredaId || null,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN || '7d' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    env.JWT_REFRESH_SECRET || env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// In-memory rate limiting for login attempts
const loginAttemptsMap = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function _checkLoginLockout(identifier) {
  const record = loginAttemptsMap.get(identifier);
  if (!record) return;
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const remainingMin = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    throw new UnauthorizedError(
      `Account temporarily locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`
    );
  }
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    loginAttemptsMap.delete(identifier);
  }
}

function _recordLoginFailure(identifier) {
  const record = loginAttemptsMap.get(identifier) || { count: 0, lockedUntil: null };
  record.count += 1;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
    logger.warn(`[Auth Service] Account locked for 15 minutes after ${record.count} failed attempts: ${identifier}`);
  }
  loginAttemptsMap.set(identifier, record);
}

// In-memory rate limiting for OTP reset attempts
const resetAttemptsMap = new Map();
const MAX_RESET_ATTEMPTS = 5;

/**
 * Register a new user
 */
async function registerUser({
  email,
  phoneNumber,
  phone,
  fullName,
  name,
  password,
  role = 'FARMER',
  regionId,
  zoneId,
  woredaId,
  kebeleId,
  kebeleName,
  preferredLang = 'en',
  deviceToken,
  fcmToken,
  staffIdNumber,
  organizationName,
  officialRole,
}) {
  const resolvedEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
  const resolvedPhone = (phoneNumber || phone || '').toString().trim() || null;
  const resolvedName = (fullName || name || '').toString().trim();
  const resolvedRole = (role || 'FARMER').toString().trim().toUpperCase();

  if (!resolvedEmail && !resolvedPhone) {
    throw new BadRequestError('Either an email address or phone number is required');
  }
  if (resolvedEmail && !isValidEmail(resolvedEmail)) {
    throw new BadRequestError('Invalid email format');
  }
  if (!resolvedName) {
    throw new BadRequestError('Full name is required');
  }
  if (!password || password.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters long');
  }
  if (!/\d/.test(password)) {
    throw new BadRequestError('Password must contain at least one number');
  }

  // Enforce staff credentials for professional roles
  const requiresStaffCredentials = [
    'DEVELOPMENT_AGENT',
    'WOREDA_OFFICER',
    'ZONAL_OFFICER',
    'REGIONAL_OFFICER',
    'RESEARCHER',
    'ADMIN',
  ].includes(resolvedRole);

  if (requiresStaffCredentials) {
    const staffId = staffIdNumber || officialRole;
    const org = organizationName;
    if (!staffId || !org) {
      throw new BadRequestError(
        `Official Staff ID / Badge Number and Organization are required for '${resolvedRole}' registration.`
      );
    }
  }

  // Check if email already exists
  if (resolvedEmail) {
    const existingEmail = await prisma.user.findFirst({
      where: { email: { equals: resolvedEmail, mode: 'insensitive' } },
    });
    if (existingEmail) {
      throw new ConflictError('User with this email already exists');
    }
  }

  // Check if phone already exists
  if (resolvedPhone) {
    const existingPhone = await prisma.user.findFirst({
      where: { phoneNumber: resolvedPhone },
    });
    if (existingPhone) {
      throw new ConflictError('User with this phone number already exists');
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = `${crypto.randomBytes(24).toString('hex')}_${Date.now()}`;

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: resolvedEmail || (resolvedPhone ? `user_${resolvedPhone.replace(/[^0-9]/g, '')}@phone.agrietech.et` : null),
        phoneNumber: resolvedPhone || null,
        fullName: resolvedName,
        passwordHash,
        role: resolvedRole,
        regionId: (regionId && String(regionId).trim()) || null,
        zoneId: (zoneId && String(zoneId).trim()) || null,
        woredaId: (woredaId && String(woredaId).trim()) || null,
        kebeleId: (kebeleId && String(kebeleId).trim()) || null,
        kebeleName: (kebeleName && String(kebeleName).trim()) || null,
        preferredLang: (preferredLang && String(preferredLang).trim()) || 'en',
        deviceToken: (deviceToken && String(deviceToken).trim()) || null,
        fcmToken: (fcmToken && String(fcmToken).trim()) || null,
        verificationToken,
      },
    });
  } catch (dbErr) {
    if (dbErr.code === 'P2002') {
      const targetField = Array.isArray(dbErr.meta?.target) ? dbErr.meta.target.join(', ') : 'email or phone';
      throw new ConflictError(`User with this ${targetField} already exists`);
    }
    throw dbErr;
  }

  // Send verification email asynchronously if real email was provided (non-blocking)
  if (resolvedEmail && !resolvedEmail.includes('@phone.')) {
    setImmediate(async () => {
      try {
        await _sendVerificationEmail(resolvedEmail, verificationToken);
        logger.info(`[Auth Service] Verification email dispatched to ${resolvedEmail}`);
      } catch (emailErr) {
        logger.warn(`[Auth Service] Verification email notice: ${emailErr.message}`);
      }
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: sanitizeUser(user),
    token: accessToken,
    accessToken,
    refreshToken,
  };
}

/**
 * Log in an existing user
 */
async function loginUser({ email, phoneNumber, identifier, password }) {
  const rawIdentifier = (identifier || email || phoneNumber || '').toString().trim();
  if (!rawIdentifier) {
    throw new BadRequestError('Email address or phone number is required');
  }
  if (!password) {
    throw new BadRequestError('Password is required');
  }

  const isEmail = rawIdentifier.includes('@');
  const normalizedIdentifier = isEmail ? rawIdentifier.toLowerCase() : rawIdentifier;

  _checkLoginLockout(normalizedIdentifier);

  let user = null;
  if (isEmail) {
    user = await prisma.user.findFirst({
      where: { email: { equals: normalizedIdentifier, mode: 'insensitive' } },
    });
  } else {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: rawIdentifier },
          { phoneNumber: rawIdentifier.startsWith('+251') ? '0' + rawIdentifier.slice(4) : rawIdentifier },
          { phoneNumber: rawIdentifier.startsWith('0') ? '+251' + rawIdentifier.slice(1) : rawIdentifier },
        ],
      },
    });
  }

  if (!user) {
    _recordLoginFailure(normalizedIdentifier);
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash || '').catch(() => false);
  if (!isMatch) {
    _recordLoginFailure(normalizedIdentifier);
    throw new UnauthorizedError('Invalid email or password');
  }

  // Clear failed login attempts on success
  loginAttemptsMap.delete(normalizedIdentifier);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: sanitizeUser(user),
    token: accessToken,
    accessToken,
    refreshToken,
  };
}

/**
 * Request Password Reset OTP
 */
async function requestPasswordReset(identifierOrPayload) {
  let rawIdentifier = '';
  if (typeof identifierOrPayload === 'string') {
    rawIdentifier = identifierOrPayload.trim();
  } else if (identifierOrPayload && typeof identifierOrPayload === 'object') {
    rawIdentifier = (
      identifierOrPayload.email ||
      identifierOrPayload.identifier ||
      identifierOrPayload.phoneNumber ||
      identifierOrPayload.phone ||
      ''
    ).toString().trim();
  }

  if (!rawIdentifier) {
    throw new BadRequestError('Email address or phone number is required');
  }

  const isEmail = rawIdentifier.includes('@');
  const normalizedEmail = isEmail ? rawIdentifier.toLowerCase() : null;
  const normalizedPhone = !isEmail ? rawIdentifier : null;

  let user = null;
  if (isEmail) {
    user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
  } else if (normalizedPhone) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: normalizedPhone },
          { phoneNumber: normalizedPhone.startsWith('+251') ? '0' + normalizedPhone.slice(4) : normalizedPhone },
          { phoneNumber: normalizedPhone.startsWith('0') ? '+251' + normalizedPhone.slice(1) : normalizedPhone },
        ],
      },
    });
  }

  // Generate a secure 6-digit numeric OTP code with 5-minute validation
  const resetToken = crypto.randomInt(100000, 999999).toString();
  const AUTH_VALIDATION_TTL_MS = 5 * 60 * 1000;
  const resetExpires = new Date(Date.now() + AUTH_VALIDATION_TTL_MS);

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    logger.info(`[Auth Service] Password reset OTP generated for ${user.email || user.phoneNumber} (valid 5 min)`);

    // Dispatch via Email if real email exists
    if (user.email && !user.email.includes('@phone.')) {
      setImmediate(async () => {
        try {
          const resetLink = `${env.APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
          await sendPasswordResetEmail(user.email, resetToken, resetLink);
          logger.info(`[Auth Service] Password reset email dispatched to ${user.email}`);
        } catch (emailErr) {
          logger.warn(`[Auth Service] Password reset email notice: ${emailErr.message}`);
        }
      });
    }

    // Dispatch via SMS if phone number exists
    if (user.phoneNumber) {
      setImmediate(async () => {
        try {
          const { sendSms } = require('../../delivery/sms/africasTalkingClient');
          const smsText = `EthioFarm: Your 6-digit password reset OTP is ${resetToken}. Valid for 5 minutes. Do not share this code with anyone.`;
          await sendSms([user.phoneNumber], smsText);
          logger.info(`[Auth Service] Password reset SMS dispatched to ${user.phoneNumber}`);
        } catch (smsErr) {
          logger.warn(`[Auth Service] Password reset SMS notice: ${smsErr.message}`);
        }
      });
    }
  }

  return {
    message: 'If an account matches that identifier, a password reset code has been sent.',
    expiresInSeconds: 300,
  };
}

const forgotPassword = requestPasswordReset;

/**
 * Reset password with OTP code
 */
async function resetPassword({ token, resetToken, code, resetCode, newPassword, password } = {}) {
  const resolvedToken = (token || resetToken || code || resetCode || '').toString().trim();
  const resolvedPassword = (newPassword || password || '').toString();

  if (!resolvedToken) {
    throw new BadRequestError('Password reset code is required');
  }
  if (!resolvedPassword || resolvedPassword.length < 8) {
    throw new BadRequestError('New password must be at least 8 characters long');
  }
  if (!/\d/.test(resolvedPassword)) {
    throw new BadRequestError('New password must contain at least one number');
  }

  const attempts = resetAttemptsMap.get(resolvedToken) || 0;
  if (attempts >= MAX_RESET_ATTEMPTS) {
    throw new BadRequestError('Too many failed reset attempts. Please request a new code.');
  }

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: resolvedToken,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    resetAttemptsMap.set(resolvedToken, attempts + 1);
    throw new BadRequestError('Password reset code is invalid or has expired');
  }

  resetAttemptsMap.delete(resolvedToken);

  const newHash = await bcrypt.hash(resolvedPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return {
    message: 'Password has been reset successfully. You can now log in with your new password.',
  };
}

/**
 * Verify Email with Verification Token
 */
async function verifyEmail(token) {
  if (!token) {
    throw new BadRequestError('Verification token is required');
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired verification token');
  }

  const tokenParts = token.split('_');
  if (tokenParts.length >= 2) {
    const tokenTimestamp = parseInt(tokenParts[tokenParts.length - 1], 10);
    const maxAgeMs = 24 * 60 * 60 * 1000;
    if (!isNaN(tokenTimestamp) && Date.now() - tokenTimestamp > maxAgeMs) {
      throw new BadRequestError('Verification token has expired. Please request a new verification email.');
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      verificationToken: null,
    },
  });

  return {
    message: 'Email address verified successfully',
  };
}

/**
 * Resend Email Verification Link
 */
async function resendVerificationEmail(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    throw new BadRequestError('A valid email address is required');
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });

  if (!user) {
    return { message: 'If an account with this email exists, a verification link has been sent.' };
  }

  if (user.isEmailVerified) {
    return { message: 'This email address is already verified.' };
  }

  const newToken = `${crypto.randomBytes(24).toString('hex')}_${Date.now()}`;
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken: newToken },
  });

  setImmediate(async () => {
    try {
      await _sendVerificationEmail(user.email, newToken);
      logger.info(`[Auth Service] Verification email resent to ${user.email}`);
    } catch (emailErr) {
      logger.warn(`[Auth Service] Resend verification email failed: ${emailErr.message}`);
    }
  });

  return {
    message: 'A new verification link has been sent to your email address.',
  };
}

const localBlacklist = new Set();

async function logout(token) {
  if (token) localBlacklist.add(token);
  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0 && redis && typeof redis.setex === 'function') {
          await redis.setex(`blacklist:${token}`, ttl, '1');
        }
      }
    } catch (err) {
      logger.warn(`[Auth Service] Failed to blacklist token: ${err.message}`);
    }
  }
  return { message: 'Logged out successfully' };
}

async function logoutUser(accessToken, refreshToken) {
  const promises = [];
  if (accessToken) promises.push(logout(accessToken));
  if (refreshToken) promises.push(logout(refreshToken));
  await Promise.all(promises);
  return { message: 'Logged out successfully' };
}

async function isTokenBlacklisted(token) {
  if (token && localBlacklist.has(token)) return true;
  if (!token) return false;
  try {
    if (redis && typeof redis.get === 'function') {
      const result = await redis.get(`blacklist:${token}`);
      return result !== null;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      logger.error(`[SECURITY ALERT] Redis token blacklist check failed in production: ${err.message}`);
    } else {
      logger.warn(`[Auth Service] Redis blacklist check failed: ${err.message}`);
    }
  }
  return false;
}

/**
 * Refresh access token with token rotation & blacklist protection
 */
async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  // Check if refresh token has been revoked
  if (await isTokenBlacklisted(refreshToken)) {
    throw new UnauthorizedError('Refresh token has been revoked');
  }

  let decoded;
  try {
    // Try separate refresh secret first
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET || env.JWT_SECRET);
    if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  } catch (err) {
    // Graceful backward compatibility fallback to JWT_SECRET
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET);
      if (decoded.type !== 'refresh') throw new Error('Invalid token type');
    } catch (_fallbackErr) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    throw new UnauthorizedError('User account not found');
  }

  // Token Rotation (M4): Invalidate the consumed refresh token
  await logout(refreshToken);

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  return {
    token: newAccessToken,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: sanitizeUser(user),
  };
}

async function getUserProfile(userId) {
  if (!userId) throw new BadRequestError('User ID required');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      region: true,
      zone: true,
      woreda: true,
      kebele: true,
    },
  });

  if (!user) {
    throw new NotFoundError(`User '${userId}' not found`);
  }

  return sanitizeUser(user);
}

async function updatePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Current and new passwords required');
  }
  if (newPassword.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters long');
  }
  if (!/\d/.test(newPassword)) {
    throw new BadRequestError('Password must contain at least one number');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError(`User '${userId}' not found`);
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash || '');
  if (!valid) {
    throw new UnauthorizedError('Current password incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return true;
}

async function updateUserProfile(userId, data = {}) {
  if (!userId) throw new BadRequestError('User ID required');

  const allowedFields = [
    'fullName',
    'preferredLang',
    'role',
    'deviceToken',
    'fcmToken',
    'regionId',
    'zoneId',
    'woredaId',
    'kebeleId',
    'kebeleName',
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (data.token && !updateData.deviceToken) {
    updateData.deviceToken = data.token;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      region: true,
      zone: true,
      woreda: true,
    },
  });

  return sanitizeUser(user);
}

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logout,
  logoutUser,
  generateAccessToken,
  generateRefreshToken,
  getUserProfile,
  updateUserProfile,
  updatePassword,
  isTokenBlacklisted,
};
