const morgan = require('morgan');
const logger = require('../utils/logger');

// Stream Morgan HTTP logs into Winston
const stream = {
  write: (message) => logger.info(message.trim()),
};

const requestLogger = morgan(':method :url :status :response-time ms - :res[content-length]', {
  stream,
});

module.exports = requestLogger;
