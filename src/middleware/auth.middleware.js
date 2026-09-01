const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { isTokenBlacklisted } = require('../modules/auth/auth.service');

// Build API key whitelist from environment (comma-separated)
function buildApiKeySet() {
  const raw = [
    ...(env.SENSOR_API_KEYS || '').split(','),
    ...(env.IOT_API_KEYS || '').split(','),
  ];
  return new Set(raw.map((k) => k.trim()).filter(Boolean));
}

let _apiKeySet = null;
function getApiKeySet() {
  if (!_apiKeySet) _apiKeySet = buildApiKeySet();
  return _apiKeySet;
}

// Authenticate JWT bearer token or API Key
async function authenticate(req, res, next) {
  try {
    // 1. IoT Sensor API Key authentication — validated against whitelist
    const apiKey = req.headers['x-api-key'] || req.headers['api-key'] || req.query.apiKey || req.query.api_key;
    if (apiKey) {
      const validKeys = getApiKeySet();
      if (!validKeys.size || !validKeys.has(apiKey)) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid API key', code: 'UNAUTHORIZED' },
        });
      }
      // Grant sensor role only — not ADMIN — to IoT devices
      req.user = { id: `iot_${apiKey.substring(0, 8)}`, role: 'SENSOR', fullName: 'IoT Sensor Device' };
      return next();
    }

    // 2. Dev Bypass — only in development environment
    if (
      process.env.NODE_ENV === 'development' &&
      (process.env.ADMIN_DEV_BYPASS === 'true' || process.env.ADMIN_BYPASS === 'true') &&
      !req.headers.authorization
    ) {
      req.user = { id: 'usr_admin_01', email: 'admin@agrietech.et', fullName: 'System Administrator', role: 'ADMIN' };
      return next();
    }


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

    // Check token blacklist (async Redis check)
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
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
    if (['ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER'].includes(req.user.role)) {
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

// Scope authorization to region
function authorizeRegionScope(paramName = 'regionId') {
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
    const requestedRegion =
      req.params?.[paramName] || req.query?.[paramName] || req.body?.[paramName];
    if (req.user.regionId && requestedRegion && req.user.regionId !== requestedRegion) {
      return res
        .status(403)
        .json({
          success: false,
          error: { message: 'Regional scope violation', code: 'OUT_OF_SCOPE' },
        });
    }
    next();
  };
}

// Optional authentication (attaches user if valid token present, allows through if not)
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const isBlacklisted = await isTokenBlacklisted(token);
      if (!isBlacklisted) {
        req.user = jwt.verify(token, env.JWT_SECRET);
      }
    }
  } catch (_) {
    // Gracefully ignore token errors for optional routes
  }
  next();
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  authorizeWoredaScope,
  authorizeRegionScope,
};

