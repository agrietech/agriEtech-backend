const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma, isConnected } = require('../../config/db');
const env = require('../../config/env');

// Sign JWT token
function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

// Register user
async function registerUser({ name, phone, email, password, role = 'FARMER', woredaId }) {
  const passwordHash = await bcrypt.hash(password || '123456', 10);

  if (isConnected()) {
    return await prisma.user.create({
      data: { name, phone, email, passwordHash, role, woredaId },
    });
  }

  return { id: `usr_${Date.now()}`, name, phone, email, role, woredaId };
}

// Authenticate user credentials
async function loginUser({ phone, password }) {
  if (isConnected()) {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid phone or password');
    }
    const token = generateToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
      woredaId: user.woredaId,
    });
    return { user, token };
  }

  const mockUser = { id: 'usr_01', name: 'Demo User', phone, role: 'FARMER' };
  return { user: mockUser, token: generateToken(mockUser) };
}

module.exports = {
  generateToken,
  registerUser,
  loginUser,
};
