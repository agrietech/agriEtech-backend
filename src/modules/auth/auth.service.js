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
} = require('../../utils/errors');
const {
  sendPasswordResetEmail,
  sendVerificationEmail: _sendVerificationEmail,
} = require('../../delivery/email/emailDispatcher');

// In-memory token blacklist, mock users, and reset tokens for test/dev mode
const tokenBlacklist = new Set();
const mockUsers = new Map();

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
    phoneNumber: sanitized.phoneNumber || sanitized.phone || null,
    fullName: sanitized.fullName || sanitized.name,
  };
}

function generateAccessToken(user) {
  const phone = user.phoneNumber || user.phone || null;
  return jwt.sign(
    {
      id: user.id,
      email: user.email || null,
      phoneNumber: phone,
      phone: phone,
      role: user.role,
      woredaId: user.woredaId || null,
      type: 'access',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN || '24h' }
  );
}

function generateRefreshToken(user) {
  const phone = user.phoneNumber || user.phone || null;
  return jwt.sign(
    {
      id: user.id,
      email: user.email || null,
      phoneNumber: phone,
      type: 'refresh',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
}

/**
 * Register a new user with Email and/or Phone Number
 */
async function registerUser({
  email,
  phoneNumber,
  phone,
  fullName,
  name,
  password,
  role = 'FARMER',
  woredaId,
  preferredLang = 'en',
}) {
  const resolvedEmail = (email || '').trim().toLowerCase() || null;
  const resolvedPhone = (phoneNumber || phone || '').trim() || null;
  const resolvedName = (fullName || name || '').trim();

  if (!resolvedName || !password) {
    throw new BadRequestError('Full name and password are required');
  }

  if (!resolvedEmail && !resolvedPhone) {
    throw new BadRequestError('Either an email address or a phone number is required');
  }

  if (resolvedEmail && !isValidEmail(resolvedEmail)) {
    throw new BadRequestError('Please provide a valid email address');
  }

  if (password.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters long');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (isConnected()) {
    // Check duplicate email
    if (resolvedEmail) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: resolvedEmail },
      });
      if (existingEmail) {
        throw new ConflictError('User with this email already exists');
      }
    }

    // Check duplicate phone
    if (resolvedPhone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          OR: [{ phoneNumber: resolvedPhone }, { phone: resolvedPhone }],
        },
      });
      if (existingPhone) {
        throw new ConflictError('User with this phone number already exists');
      }
    }

    const verificationToken = resolvedEmail ? crypto.randomBytes(32).toString('hex') : null;

    const user = await prisma.user.create({
      data: {
        email: resolvedEmail,
        phoneNumber: resolvedPhone,
        fullName: resolvedName,
        passwordHash,
        role,
        woredaId: woredaId || null,
        preferredLang,
        verificationToken,
      },
    });

    if (resolvedEmail && verificationToken) {
      try {
        await _sendVerificationEmail(resolvedEmail, verificationToken);
      } catch (emailErr) {
        // Log error but allow registration to complete
        console.error('[Auth Service] Verification email failed to send:', emailErr.message);
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  // Standalone / in-memory test fallback
  for (const u of mockUsers.values()) {
    if (resolvedEmail && u.email && u.email.toLowerCase() === resolvedEmail) {
      throw new ConflictError('User with this email already exists');
    }
    if (resolvedPhone && (u.phoneNumber === resolvedPhone || u.phone === resolvedPhone)) {
      throw new ConflictError('User with this phone number already exists');
    }
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const verificationToken = resolvedEmail ? crypto.randomBytes(32).toString('hex') : null;
  const mockUser = {
    id: userId,
    email: resolvedEmail,
    phoneNumber: resolvedPhone,
    phone: resolvedPhone,
    fullName: resolvedName,
    name: resolvedName,
    role,
    woredaId: woredaId || null,
    preferredLang,
    isEmailVerified: false,
    verificationToken,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  if (resolvedEmail && verificationToken) {
    try {
      await _sendVerificationEmail(resolvedEmail, verificationToken);
    } catch (emailErr) {
      console.error('[Auth Service Mock] Verification email failed to send:', emailErr.message);
    }
  }

  const primaryKey = resolvedEmail || resolvedPhone || userId;
  mockUsers.set(primaryKey, mockUser);
  if (resolvedPhone && resolvedPhone !== primaryKey) {
    mockUsers.set(resolvedPhone, mockUser);
  }
  if (resolvedEmail && resolvedEmail !== primaryKey) {
    mockUsers.set(resolvedEmail, mockUser);
  }

  const accessToken = generateAccessToken(mockUser);
  const refreshToken = generateRefreshToken(mockUser);

  return {
    user: sanitizeUser(mockUser),
    accessToken,
    refreshToken,
  };
}

/**
 * User login with Email or Phone Number
 */
async function loginUser({ email, phoneNumber, phone, identifier, password }) {
  const rawIdentifier = (email || identifier || phoneNumber || phone || '').trim();

  if (!rawIdentifier || !password) {
    throw new BadRequestError('Email/phone number and password are required');
  }

  const isEmailInput = rawIdentifier.includes('@');
  const normalizedEmail = isEmailInput ? rawIdentifier.toLowerCase() : null;
  const normalizedPhone = !isEmailInput ? rawIdentifier : null;

  let user = null;

  if (isConnected()) {
    if (normalizedEmail) {
      user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      });
    } else {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ phoneNumber: normalizedPhone }, { phone: normalizedPhone }],
        },
      });
    }
  } else {
    // In-memory / dev lookup
    if (normalizedEmail) {
      user = mockUsers.get(normalizedEmail);
      if (!user) {
        for (const u of mockUsers.values()) {
          if (u.email && u.email.toLowerCase() === normalizedEmail) {
            user = u;
            break;
          }
        }
      }
    } else if (normalizedPhone) {
      user = mockUsers.get(normalizedPhone);
      if (!user) {
        for (const u of mockUsers.values()) {
          if (u.phoneNumber === normalizedPhone || u.phone === normalizedPhone) {
            user = u;
            break;
          }
        }
      }
    }

    // Default seeded demo accounts
    if (!user) {
      if (rawIdentifier === '+251911223344' || rawIdentifier === '0911223344') {
        const demoHash = await bcrypt.hash('SecurePassword123!', 10);
        user = {
          id: 'usr_demo_01',
          phoneNumber: rawIdentifier,
          email: 'farmer.demo@agrietech.et',
          fullName: 'Abebe Bikila',
          role: 'FARMER',
          woredaId: 'woreda_adama_01',
          passwordHash: demoHash,
        };
        mockUsers.set(rawIdentifier, user);
        mockUsers.set(user.email, user);
      } else if (normalizedEmail === 'admin@agrietech.et' || normalizedEmail === 'farmer@agrietech.et') {
        const demoHash = await bcrypt.hash('SecurePassword123!', 10);
        user = {
          id: normalizedEmail === 'admin@agrietech.et' ? 'usr_admin_01' : 'usr_farmer_01',
          email: normalizedEmail,
          phoneNumber: normalizedEmail === 'admin@agrietech.et' ? '+251911000001' : '+251911000002',
          fullName: normalizedEmail === 'admin@agrietech.et' ? 'Admin User' : 'Abebe Demo Farmer',
          role: normalizedEmail === 'admin@agrietech.et' ? 'ADMIN' : 'FARMER',
          woredaId: 'woreda_adama_01',
          passwordHash: demoHash,
        };
        mockUsers.set(normalizedEmail, user);
      }
    }
  }

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email/phone number or password');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid email/phone number or password');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

/**
 * Initiate Forgot Password flow via Email
 */
async function forgotPassword(emailOrIdentifier) {
  const rawInput = (emailOrIdentifier || '').trim();
  if (!rawInput) {
    throw new BadRequestError('Email address is required to reset password');
  }

  const normalizedEmail = rawInput.toLowerCase();
  let user = null;

  if (isConnected()) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedEmail, mode: 'insensitive' } },
          { phoneNumber: rawInput },
        ],
      },
    });
  } else {
    for (const u of mockUsers.values()) {
      if (
        (u.email && u.email.toLowerCase() === normalizedEmail) ||
        u.phoneNumber === rawInput ||
        u.phone === rawInput
      ) {
        user = u;
        break;
      }
    }
  }

  if (!user) {
    throw new NotFoundError('No account found with this email or phone number');
  }

  const targetEmail = user.email || (isValidEmail(rawInput) ? rawInput : null);
  if (!targetEmail) {
    throw new BadRequestError('This account does not have an associated email address for password reset');
  }

  // Generate secure random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour expiration

  if (isConnected()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });
  } else {
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
  }

  const resetLink = `${env.APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(targetEmail)}`;
  await sendPasswordResetEmail(targetEmail, resetToken, resetLink);

  return {
    message: 'Password reset link has been sent to your email address',
    email: targetEmail,
    token: resetToken, // Included for dev / testing ease
    resetLink,
  };
}

/**
 * Complete Password Reset with Reset Token
 */
async function resetPassword({ token, newPassword, email: _email }) {
  if (!token || !newPassword) {
    throw new BadRequestError('Reset token and new password are required');
  }

  if (newPassword.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters long');
  }

  let user = null;

  if (isConnected()) {
    user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });
  } else {
    for (const u of mockUsers.values()) {
      if (
        u.resetPasswordToken === token &&
        u.resetPasswordExpires &&
        new Date(u.resetPasswordExpires) > new Date()
      ) {
        user = u;
        break;
      }
    }
  }

  if (!user) {
    throw new BadRequestError('Password reset token is invalid or has expired');
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  if (isConnected()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  } else {
    user.passwordHash = newHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
  }

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

  let user = null;

  if (isConnected()) {
    user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });
  } else {
    for (const u of mockUsers.values()) {
      if (u.verificationToken === token) {
        user = u;
        break;
      }
    }
  }

  if (!user) {
    throw new BadRequestError('Invalid or expired verification token');
  }

  if (isConnected()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });
  } else {
    user.isEmailVerified = true;
    user.verificationToken = null;
  }

  return {
    message: 'Email address verified successfully',
  };
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  if (tokenBlacklist.has(refreshToken)) {
    throw new UnauthorizedError('Refresh token has been revoked. Please log in again.');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_SECRET);
  } catch (_err) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  let user = null;
  if (isConnected()) {
    user = await prisma.user.findUnique({ where: { id: decoded.id } });
  } else {
    for (const u of mockUsers.values()) {
      if (u.id === decoded.id) {
        user = u;
        break;
      }
    }
    if (!user) {
      user = {
        id: decoded.id,
        email: decoded.email || null,
        phoneNumber: decoded.phoneNumber || '+251911223344',
        fullName: 'Test User',
        role: 'FARMER',
      };
    }
  }

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const accessToken = generateAccessToken(user);
  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
}

async function logoutUser(accessToken, refreshToken) {
  if (accessToken) tokenBlacklist.add(accessToken);
  if (refreshToken) tokenBlacklist.add(refreshToken);
  return true;
}

function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

async function getUserProfile(userId) {
  if (!userId) throw new BadRequestError('User ID required');

  if (isConnected()) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { woreda: true },
    });
    if (!user) throw new NotFoundError('User not found');
    return sanitizeUser(user);
  }

  for (const u of mockUsers.values()) {
    if (u.id === userId) return sanitizeUser(u);
  }

  return {
    id: userId,
    email: 'farmer@agrietech.et',
    phoneNumber: '+251911223344',
    fullName: 'Demo Farmer',
    role: 'FARMER',
    woredaId: 'woreda_adama_01',
  };
}

async function updatePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Current and new passwords required');
  }

  if (newPassword.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters long');
  }

  if (isConnected()) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Current password incorrect');
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
  }
  return true;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  refreshAccessToken,
  logoutUser,
  getUserProfile,
  updatePassword,
  isTokenBlacklisted,
  mockUsers,
};
