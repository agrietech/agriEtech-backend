const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;

// Initialize WebSocket server
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    logger.info(`WebSocket connected: ${socket.id}`);

    // Join woreda channel room
    socket.on('subscribe:woreda', (woredaId) => {
      socket.join(`woreda:${woredaId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Access initialized Socket.IO instance
function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
