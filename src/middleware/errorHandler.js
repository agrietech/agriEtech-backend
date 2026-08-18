const logger = require('../utils/logger');

// Global error handler
function errorHandler(err, req, res, _next) {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const defaultCode =
    statusCode === 409
      ? 'CONFLICT'
      : statusCode === 404
        ? 'NOT_FOUND'
        : statusCode === 401
          ? 'UNAUTHORIZED'
          : statusCode === 403
            ? 'FORBIDDEN'
            : statusCode === 422
              ? 'VALIDATION_ERROR'
              : statusCode === 400
                ? 'BAD_REQUEST'
                : 'INTERNAL_ERROR';

  const code = err.errorCode || err.code || defaultCode;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(err.details && { details: err.details }),
    },
    message, // for legacy flat format compatibility
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
