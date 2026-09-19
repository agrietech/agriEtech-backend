const crypto = require('crypto');
const { prisma } = require('../../../config/db');
const redis = require('../../../config/redis');
const logger = require('../../../utils/logger');
const axios = require('axios');

class SessionService {
  /**
   * Create a new session for user
   */
  async createSession(userId, deviceInfo, ipAddress, userAgent) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Get location from IP
    const location = await this.getLocationFromIP(ipAddress);

    // Parse device info
    const device = this.parseUserAgent(userAgent);

    // Create session in database
    const session = await prisma.userSession.create({
      data: {
        userId,
        sessionToken,
        device: device.device,
        browser: device.browser,
        os: device.os,
        ipAddress,
        location: location || undefined,
        isActive: true,
        expiresAt
      }
    });

    // Cache session in Redis for fast lookup
    await redis.setex(
      `session:${sessionToken}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify({
        userId,
        sessionId: session.id,
        device: device.device,
        browser: device.browser,
        os: device.os,
        ipAddress,
        location,
        createdAt: session.createdAt
      })
    );

    // Add to user's active sessions set
    await redis.sadd(`user:${userId}:sessions`, sessionToken);
    await redis.expire(`user:${userId}:sessions`, 7 * 24 * 60 * 60);

    logger.info(`[Session] New session created for user ${userId} from ${ipAddress}`);

    return {
      sessionToken,
      sessionId: session.id,
      expiresAt
    };
  }

  /**
   * Get session from token
   */
  async getSession(sessionToken) {
    // Try cache first
    const cached = await redis.get(`session:${sessionToken}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to database
    const session = await prisma.userSession.findUnique({
      where: { sessionToken },
      include: { user: { select: { id: true, email: true, role: true } } }
    });

    if (!session || !session.isActive) {
      return null;
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      await this.terminateSession(sessionToken);
      return null;
    }

    return session;
  }

  /**
   * Update session activity
   */
  async updateActivity(sessionToken) {
    // Update last activity in DB (async, don't block)
    prisma.userSession.updateMany({
      where: { sessionToken, isActive: true },
      data: { lastActivity: new Date() }
    }).catch(err => {
      logger.error(`[Session] Failed to update activity: ${err.message}`);
    });

    // Update TTL in Redis
    await redis.expire(`session:${sessionToken}`, 7 * 24 * 60 * 60);
  }

  /**
   * List all sessions for a user
   */
  async getUserSessions(userId) {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gte: new Date() }
      },
      orderBy: { lastActivity: 'desc' },
      select: {
        id: true,
        sessionToken: true,
        device: true,
        browser: true,
        os: true,
        ipAddress: true,
        location: true,
        lastActivity: true,
        createdAt: true
      }
    });

    return sessions.map(s => ({
      ...s,
      isCurrent: false, // Will be set by controller if matches current request
      sessionToken: s.sessionToken.slice(0, 8) + '...' // Partial token for display
    }));
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(sessionToken, userId = null) {
    // Get session to verify ownership
    const session = await prisma.userSession.findUnique({
      where: { sessionToken }
    });

    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    // If userId provided, verify ownership
    if (userId && session.userId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Deactivate in database
    await prisma.userSession.update({
      where: { sessionToken },
      data: { isActive: false }
    });

    // Remove from Redis
    await redis.del(`session:${sessionToken}`);
    await redis.srem(`user:${session.userId}:sessions`, sessionToken);

    // Add to blacklist
    await redis.setex(`blacklist:session:${sessionToken}`, 86400, '1');

    logger.info(`[Session] Session terminated: ${sessionToken.slice(0, 8)}...`);

    return { success: true, message: 'Session terminated' };
  }

  /**
   * Terminate all sessions for a user except current
   */
  async terminateOtherSessions(userId, currentSessionToken) {
    // Get all active sessions
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        sessionToken: { not: currentSessionToken }
      }
    });

    // Terminate each session
    for (const session of sessions) {
      await this.terminateSession(session.sessionToken);
    }

    logger.info(`[Session] Terminated ${sessions.length} other sessions for user ${userId}`);

    return {
      success: true,
      message: `${sessions.length} other session(s) terminated`,
      count: sessions.length
    };
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllSessions(userId) {
    const sessions = await prisma.userSession.findMany({
      where: { userId, isActive: true }
    });

    for (const session of sessions) {
      await this.terminateSession(session.sessionToken);
    }

    logger.info(`[Session] Terminated all ${sessions.length} sessions for user ${userId}`);

    return {
      success: true,
      message: `All ${sessions.length} session(s) terminated`,
      count: sessions.length
    };
  }

  /**
   * Check if session is blacklisted
   */
  async isSessionBlacklisted(sessionToken) {
    const blacklisted = await redis.get(`blacklist:session:${sessionToken}`);
    return !!blacklisted;
  }

  /**
   * Clean up expired sessions (run as cron job)
   */
  async cleanupExpiredSessions() {
    const result = await prisma.userSession.updateMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { lastActivity: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 days inactive
        ],
        isActive: true
      },
      data: { isActive: false }
    });

    logger.info(`[Session] Cleaned up ${result.count} expired sessions`);

    return result.count;
  }

  /**
   * Get location from IP address
   */
  async getLocationFromIP(ipAddress) {
    // Skip for local/private IPs
    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.')) {
      return { country: 'Local', city: 'Local', lat: 0, lng: 0 };
    }

    try {
      // Use free IP geolocation service
      const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
        timeout: 3000
      });

      if (response.data && response.data.status === 'success') {
        return {
          country: response.data.country,
          countryCode: response.data.countryCode,
          city: response.data.city,
          region: response.data.regionName,
          lat: response.data.lat,
          lng: response.data.lon,
          timezone: response.data.timezone
        };
      }
    } catch (err) {
      logger.warn(`[Session] Failed to get location for IP ${ipAddress}: ${err.message}`);
    }

    return null;
  }

  /**
   * Parse user agent string
   */
  parseUserAgent(userAgent) {
    if (!userAgent) {
      return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
    }

    let device = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect device
    if (/mobile/i.test(userAgent)) {
      device = 'Mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      device = 'Tablet';
    }

    // Detect browser
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) {
      browser = 'Chrome';
    } else if (/firefox/i.test(userAgent)) {
      browser = 'Firefox';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      browser = 'Safari';
    } else if (/edge/i.test(userAgent)) {
      browser = 'Edge';
    } else if (/opera|opr/i.test(userAgent)) {
      browser = 'Opera';
    }

    // Detect OS
    if (/windows/i.test(userAgent)) {
      os = 'Windows';
    } else if (/mac os/i.test(userAgent)) {
      os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      os = 'Linux';
    } else if (/android/i.test(userAgent)) {
      os = 'Android';
    } else if (/ios|iphone|ipad/i.test(userAgent)) {
      os = 'iOS';
    }

    return { device, browser, os };
  }

  /**
   * Get session statistics for admin
   */
  async getSessionStatistics() {
    const [totalActive, totalUsers, recentSessions] = await Promise.all([
      prisma.userSession.count({
        where: {
          isActive: true,
          expiresAt: { gte: new Date() }
        }
      }),
      prisma.userSession.groupBy({
        by: ['userId'],
        where: {
          isActive: true,
          expiresAt: { gte: new Date() }
        }
      }),
      prisma.userSession.groupBy({
        by: ['device'],
        where: {
          isActive: true,
          expiresAt: { gte: new Date() }
        },
        _count: true
      })
    ]);

    return {
      totalActiveSessions: totalActive,
      totalActiveUsers: totalUsers.length,
      byDevice: recentSessions.reduce((acc, item) => {
        acc[item.device || 'Unknown'] = item._count;
        return acc;
      }, {})
    };
  }
}

module.exports = new SessionService();
