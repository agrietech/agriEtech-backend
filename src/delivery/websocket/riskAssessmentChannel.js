const { getIO } = require('../../config/socket');
const logger = require('../../utils/logger');

// Broadcast risk assessment update to woreda channel subscribers.
// Event name must stay in sync with the frontend's socket_client.dart listener.
function broadcastRiskUpdate(woredaId, assessmentData) {
  try {
    const io = getIO();
    io.to(`woreda:${woredaId}`).emit('risk:updated', {
      woredaId,
      timestamp: new Date().toISOString(),
      data: assessmentData,
    });
  } catch (err) {
    logger.warn(`WebSocket broadcast skipped: ${err.message}`);
  }
}

// Push a new advisory to only the woreda it concerns (preferred path).
function broadcastAlertToWoreda(woredaId, alert) {
  try {
    const io = getIO();
    io.to(`woreda:${woredaId}`).emit('alert:new', {
      timestamp: new Date().toISOString(),
      alert,
    });
  } catch (err) {
    logger.warn(`WebSocket alert skipped: ${err.message}`);
  }
}

// Broadcast critical emergency alert to all connected clients regardless of
// woreda subscription — reserved for CRITICAL severity, cross-region hazards.
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
  broadcastAlertToWoreda,
  broadcastEmergencyAlert,
};
