const winston = require('winston');

const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'info');

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
        )
      ),
    }),
  ],
});

// Helper for HTTP client API telemetry logging
logger.logApiCall = function (serviceName, url, durationMs, success = true, error = null) {
  if (success) {
    logger.info(`[External API] ${serviceName} -> ${url} (${durationMs}ms) - SUCCESS`);
  } else {
    logger.warn(`[External API] ${serviceName} -> ${url} (${durationMs}ms) - FAILED: ${error?.message || 'Unknown error'}`);
  }
};

module.exports = logger;
