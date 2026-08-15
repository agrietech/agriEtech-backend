const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Authenticate JWT bearer token
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication token required' });
    }

    const token = authHeader.substring(7);
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch (_err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Role-based access control check
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
