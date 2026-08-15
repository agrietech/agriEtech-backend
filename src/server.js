const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');

const server = http.createServer(app);
const PORT = env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Initialize background services
(async () => {
  try {
    initSocket(server);
    await connectDB();
  } catch (err) {
    logger.warn(`Service startup notice: ${err.message}`);
  }
})();

module.exports = server;
