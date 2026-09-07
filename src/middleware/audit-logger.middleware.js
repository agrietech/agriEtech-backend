/**
 * @file audit-logger.middleware.js
 * @description Enterprise Audit Logger Middleware for EthioFarm Platform.
 * Intercepts requests and asynchronously persists audit records to the
 * database AuditLog table when the DB is connected.
 */

const { prisma, isConnected } = require('../config/db');
const logger = require('../utils/logger');

const dbConnected = isConnected;

/**
 * Determine a high-level action category based on method and route
 */
function resolveAction(method, path) {
  const m = method.toUpperCase();
  if (path.includes('/auth/login')) return 'LOGIN';
  if (path.includes('/auth/register')) return 'REGISTER';
  if (path.includes('/auth/logout')) return 'LOGOUT';
  if (path.includes('/admin')) return 'ADMIN_ACCESS';
  if (path.includes('/farms')) return `${m}_FARM`;
  if (path.includes('/sensors')) return `${m}_SENSOR`;
  if (path.includes('/alerts')) return `${m}_ALERT`;
  if (path.includes('/diagnose')) return 'DIAGNOSE_CROP';
  if (path.includes('/ai')) return 'AI_QUERY';
  if (path.includes('/ussd')) return 'USSD_INTERACTION';
  return `${m}_RESOURCE`;
}

/**
 * Persist audit log entry to database if connected
 */
async function persistAuditLog(entry) {
  if (!prisma || typeof dbConnected !== 'function' || !dbConnected()) return;
  try {
    if (!prisma.auditLog) return;
    await prisma.auditLog.create({
      data: {
        action: entry.action || 'SYSTEM_AUDIT',
        adminId: entry.userId && entry.userId !== 'anonymous' ? entry.userId : null,
        adminEmail: entry.userEmail || null,
        ipAddress: entry.ipAddress || null,
        details: typeof entry === 'object' ? JSON.stringify({
          resource: entry.resource,
          method: entry.method,
          path: entry.path,
          statusCode: entry.statusCode,
          durationMs: entry.durationMs,
          userRole: entry.userRole,
        }) : String(entry),
      },
    });
  } catch (_err) {
    // Non-critical: audit persist failure should not impact request flow
  }
}

/**
 * Express middleware for audit logging
 */
function auditLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const user = req.user || {};
    const userId = user.id || req.body?.email || 'anonymous';
    const userRole = user.role || 'NONE';
    const action = resolveAction(req.method, req.path);

    const entry = {
      userId,
      userRole,
      userEmail: user.email || (req.body && req.body.email) || null,
      action,
      resource: req.baseUrl ? req.baseUrl.replace('/api/v1/', '') : 'root',
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      durationMs,
      timestamp: new Date().toISOString(),
    };

    if (res.statusCode >= 400) {
      logger.warn(`[AUDIT] ${action} by ${userId} (${userRole}) -> HTTP ${res.statusCode} [${durationMs}ms]`);
    } else {
      logger.info(`[AUDIT] ${action} by ${userId} (${userRole}) -> HTTP ${res.statusCode} [${durationMs}ms]`);
    }

    setImmediate(() => persistAuditLog(entry));
  });

  next();
}

module.exports = auditLogger;
