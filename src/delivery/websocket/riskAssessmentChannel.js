const { getIO } = require('../../config/socket');
const logger = require('../../utils/logger');

// Broadcast risk assessment update to woreda channel subscribers
function broadcastRiskUpdate(woredaId, assessmentData) {
  try {
    const io = getIO();
    io.to(`woreda:${woredaId}`).emit('risk:update', {
      woredaId,
      timestamp: new Date().toISOString(),
      data: assessmentData,
    });
  } catch (err) {
    logger.warn(`WebSocket broadcast skipped: ${err.message}`);
  }
}

// Broadcast critical emergency alert to all connected clients
function broadcastEmergencyAlert(alertPayload) {
  try {
    const io = getIO();
    io.emit('emergency:alert', {
      timestamp: new Date().toISOString(),
      alert: alertPayload,
    });
  } catch (err) {
    logger.warn(`WebSocket alert skipped: ${err.message}`);
  }
}

module.exports = {
  broadcastRiskUpdate,
  broadcastEmergencyAlert,
};
