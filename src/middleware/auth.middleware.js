const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { isTokenBlacklisted } = require('../modules/auth/auth.service');

// Authenticate JWT bearer token
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({
          success: false,
          error: { message: 'Authentication token required', code: 'UNAUTHORIZED' },
        });
    }

    const token = authHeader.substring(7);

    if (isTokenBlacklisted(token)) {
      return res
        .status(401)
        .json({
          success: false,
          error: { message: 'Token has been revoked. Please log in again.', code: 'TOKEN_REVOKED' },
        });
    }

    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch (_err) {
    return res
      .status(401)
      .json({
        success: false,
        error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' },
      });
  }
}

// Role-based access control check
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          success: false,
          error: { message: 'Insufficient permissions', code: 'FORBIDDEN' },
        });
    }
    next();
  };
}

// Scope authorization to woreda
function authorizeWoredaScope(paramName = 'woredaId') {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({
          success: false,
          error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
        });
    }
    if (req.user.role === 'ADMIN' || req.user.role === 'RESEARCHER') {
      return next();
    }
    const requestedWoreda =
      req.params?.[paramName] || req.query?.[paramName] || req.body?.[paramName];
    if (req.user.woredaId && requestedWoreda && req.user.woredaId !== requestedWoreda) {
      return res
        .status(403)
        .json({
          success: false,
          error: { message: 'Woreda scope violation', code: 'OUT_OF_SCOPE' },
        });
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorize,
  authorizeWoredaScope,
};
