const { v4: uuidv4 } = require('uuid');

/**
 * Security and Request Tracking Middleware
 */

// Injects unique correlation ID into request context and response headers
function correlationIdMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
}

// Request timeout middleware
function requestTimeout(seconds = 30) {
  return (req, res, next) => {
    req.setTimeout(seconds * 1000, () => {
      const err = new Error('Request Timeout');
      err.statusCode = 408;
      next(err);
    });
    next();
  };
}

// Sanitizes query and body parameters to strip null bytes
function sanitizeInput(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/\0/g, '').trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

module.exports = {
  correlationIdMiddleware,
  requestTimeout,
  sanitizeInput,
};
