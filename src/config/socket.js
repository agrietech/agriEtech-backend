const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');
const logger = require('../utils/logger');

let io = null;

// Roles permitted to subscribe to any woreda's room
const PRIVILEGED_ROLES = ['ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER'];

/**
 * Validate Bearer token from Socket.IO handshake.
 * Token can arrive via:
 *   - socket.handshake.auth.token
 *   - Authorization header: Bearer <token>
 *   - socket.handshake.query.token
 */
function extractAndVerifyToken(socket) {
  try {
    const authToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
      socket.handshake.query?.token;

    if (!authToken) return null;
    return jwt.verify(authToken, env.JWT_SECRET);
  } catch (_err) {
    return null;
  }
}

// Initialize WebSocket server with JWT authentication middleware
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── JWT Authentication Middleware ──
  io.use((socket, next) => {
    const user = extractAndVerifyToken(socket);
    if (!user) {
      logger.warn(`[WebSocket] Rejected unauthenticated connection from ${socket.handshake.address}`);
      return next(new Error('UNAUTHORIZED: Valid JWT required to connect'));
    }
    socket.user = user; // attach decoded payload for downstream use
    logger.info(`[WebSocket] Authenticated connection: userId=${user.id} role=${user.role}`);
    next();
  });

  io.on('connection', (socket) => {
    const { id: userId, role, woredaId: userWoredaId } = socket.user;

    // Auto-subscribe authenticated farmer to their own woreda on connect
    if (userWoredaId && !PRIVILEGED_ROLES.includes(role)) {
      socket.join(`woreda:${userWoredaId}`);
      logger.debug(`[WebSocket] Auto-subscribed userId=${userId} to woreda:${userWoredaId}`);
    }

    // ── Woreda Subscription ──
    socket.on('subscribe:woreda', (woredaId) => {
      if (!woredaId || typeof woredaId !== 'string') {
        socket.emit('error', { code: 'INVALID_WOREDA', message: 'woredaId must be a non-empty string' });
        return;
      }

      // Privileged roles may subscribe to any woreda; others only their own
      if (!PRIVILEGED_ROLES.includes(role) && woredaId !== userWoredaId) {
        socket.emit('error', {
          code: 'FORBIDDEN',
          message: 'You can only subscribe to your assigned woreda',
        });
        logger.warn(`[WebSocket] Scope violation: userId=${userId} tried to subscribe to woreda:${woredaId}`);
        return;
      }

      socket.join(`woreda:${woredaId}`);
      socket.emit('subscribed', { woredaId });
      logger.debug(`[WebSocket] userId=${userId} joined woreda:${woredaId}`);
    });

    // ── Unsubscribe ──
    socket.on('unsubscribe:woreda', (woredaId) => {
      socket.leave(`woreda:${woredaId}`);
      socket.emit('unsubscribed', { woredaId });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`[WebSocket] Disconnected: userId=${userId} reason=${reason}`);
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

