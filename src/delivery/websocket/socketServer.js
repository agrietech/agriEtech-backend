const { initSocket, getIO } = require('../../config/socket');

function setupWebSocketServer(httpServer) {
  return initSocket(httpServer);
}

module.exports = {
  setupWebSocketServer,
  getIO,
};
