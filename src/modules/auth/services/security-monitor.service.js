const { prisma } = require('../../../config/db');
const redis = require('../../../config/redis');
const logger = require('../../../utils/logger');

class SecurityMonitorService {
  /**
   * Record a login attempt
   */
  async recordLoginAttempt(identifier, userId, success, ipAddress, userAgent, failReason = null) {
    // Get location
    const sessionService = require('./session.service');
    const location = await sessionService.getLocationFromIP(ipAddress);

    // Record in database
    await prisma.loginAttempt.create({
      data: {
        userId: userId || undefined,
        identifier,
        success,
        ipAddress,
        userAgent,
        location: location || undefined,
        failReason,
        attemptedAt: new Date()
      }
    });

    if (!success) {
      // Increment failed attempts counter
      const key = `login:attempts:${identifier}`;
      const attempts = await redis.incr(key);
      await redis.expire(key, 15 * 60); // 15 minute window

      logger.warn(`[Security] Failed login attempt #${attempts} for ${identifier} from ${ipAddress}`);

      // Lock account after 5 failed attempts
      if (attempts >= 5) {
        await this.lockAccount(identifier, 'MULTIPLE_FAILED_LOGIN_ATTEMPTS');
        logger.error(`[Security] Account locked for ${identifier} after ${attempts} failed attempts`);
        return { locked: true, attempts };
      }

      return { locked: false, attempts };
    } else {
      // Reset counter on success
      await redis.del(`login:attempts:${identifier}`);
      
      // Check for suspicious activity
      if (userId) {
        const suspicious = await this.detectSuspiciousActivity(userId, ipAddress, location);
        if (suspicious.suspicious) {
          logger.warn(`[Security] Suspicious login detected for user ${userId}: ${suspicious.reason}`);
        }
        return { locked: false, attempts: 0, suspicious };
      }
    }

    return { locked: false, attempts: 0 };
  }

  /**
   * Detect suspicious activity
   */
  async detectSuspiciousActivity(userId, ipAddress, location) {
    // Get recent login history
    const recentLogins = await prisma.loginAttempt.findMany({
      where: {
        userId,
        success: true,
        attemptedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      orderBy: { attemptedAt: 'desc' },
      take: 10
    });

    if (recentLogins.length === 0) {
      return { suspicious: false };
    }

    // Check for new location
    if (location && location.country) {
      const knownCountries = recentLogins
        .map(l => l.location?.country)
        .filter(Boolean);
      
      const isNewCountry = knownCountries.length > 0 && !knownCountries.includes(location.country);
      
      if (isNewCountry) {
        return {
          suspicious: true,
          reason: 'NEW_LOCATION',
          details: `Login from new country: ${location.country}`,
          requiresVerification: true
        };
      }
    }

    // Check for impossible travel
    const lastLogin = recentLogins[0];
    if (lastLogin && lastLogin.location && location) {
      const timeDiff = Date.now() - new Date(lastLogin.attemptedAt).getTime();
      const distance = this.calculateDistance(
        lastLogin.location.lat,
        lastLogin.location.lng,
        location.lat,
        location.lng
      );

      // If traveled >1000km in <1 hour
      if (distance > 1000 && timeDiff < 60 * 60 * 1000) {
        return {
          suspicious: true,
          reason: 'IMPOSSIBLE_TRAVEL',
          details: `Traveled ${Math.round(distance)}km in ${Math.round(timeDiff / 60000)} minutes`,
          requiresVerification: true
        };
      }
    }

    // Check for unusual time (if user typically logs in during certain hours)
    const hour = new Date().getHours();
    const typicalHours = recentLogins.map(l => new Date(l.attemptedAt).getHours());
    const avgHour = typicalHours.reduce((a, b) => a + b, 0) / typicalHours.length;
    
    if (Math.abs(hour - avgHour) > 8) {
      return {
        suspicious: true,
        reason: 'UNUSUAL_TIME',
        details: `Login at unusual hour: ${hour}:00`,
        requiresVerification: false
      };
    }

    return { suspicious: false };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Lock user account
   */
  async lockAccount(identifier, reason) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phoneNumber: identifier }
          ]
        }
      });

      if (!user) {
        logger.warn(`[Security] Attempted to lock non-existent account: ${identifier}`);
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          accountLocked: true,
          lockedAt: new Date(),
          lockReason: reason
        }
      });

      // Send notification
      await this.sendLockNotification(user);

      logger.info(`[Security] Account locked: ${user.id} - ${reason}`);
    } catch (err) {
      logger.error(`[Security] Failed to lock account ${identifier}: ${err.message}`);
    }
  }

  /**
   * Unlock user account
   */
  async unlockAccount(userId, reason = 'ADMIN_UNLOCK') {
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountLocked: false,
        lockedAt: null,
        lockReason: null
      }
    });

    // Reset failed attempts
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      if (user.email) await redis.del(`login:attempts:${user.email}`);
      if (user.phoneNumber) await redis.del(`login:attempts:${user.phoneNumber}`);
    }

    // Log unlock
    await prisma.auditLog.create({
      data: {
        action: 'ACCOUNT_UNLOCKED',
        details: JSON.stringify({ userId, reason })
      }
    });

    logger.info(`[Security] Account unlocked: ${userId} - ${reason}`);
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(identifier) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phoneNumber: identifier }
        ]
      },
      select: {
        id: true,
        accountLocked: true,
        lockedAt: true,
        lockReason: true
      }
    });

    if (!user) {
      return { locked: false };
    }

    if (user.accountLocked) {
      // Auto-unlock after 24 hours
      if (user.lockedAt && Date.now() - new Date(user.lockedAt).getTime() > 24 * 60 * 60 * 1000) {
        await this.unlockAccount(user.id, 'AUTO_UNLOCK_24H');
        return { locked: false };
      }

      return {
        locked: true,
        reason: user.lockReason,
        lockedAt: user.lockedAt
      };
    }

    return { locked: false };
  }

  /**
   * Send account lock notification
   */
  async sendLockNotification(user) {
    try {
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          titleEn: 'Account Locked',
          titleAm: 'መለያ ተዘግቷል',
          bodyEn: 'Your account has been locked due to multiple failed login attempts. Please contact support or wait 24 hours for automatic unlock.',
          bodyAm: 'በተከታታይ የመግቢያ ሙከራ ስህተቶች ምክንያት መለያዎ ተዘግቷል። እባክዎን ድጋፍን ያግኙ ወይም ለራስ-ሰር መክፈት 24 ሰዓት ይጠብቁ።',
          type: 'SYSTEM'
        }
      });

      // Send email if available
      if (user.email) {
        const { sendEmail } = require('../../../utils/emailService');
        await sendEmail({
          to: user.email,
          subject: 'Account Security Alert - Account Locked',
          text: `Your EthioFarm account has been locked due to multiple failed login attempts.\n\nIf this was you, please wait 24 hours for automatic unlock or contact support.\n\nIf this wasn't you, your account may be under attack. Please contact support immediately.`,
          html: `<p>Your EthioFarm account has been locked due to multiple failed login attempts.</p><p>If this was you, please wait 24 hours for automatic unlock or contact support.</p><p>If this wasn't you, your account may be under attack. Please contact support immediately.</p>`
        });
      }
    } catch (err) {
      logger.error(`[Security] Failed to send lock notification: ${err.message}`);
    }
  }

  /**
   * Get security events for a user
   */
  async getSecurityEvents(userId, limit = 20) {
    const events = await prisma.loginAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: 'desc' },
      take: limit,
      select: {
        success: true,
        ipAddress: true,
        location: true,
        failReason: true,
        attemptedAt: true
      }
    });

    return events;
  }

  /**
   * Get security statistics (admin)
   */
  async getSecurityStatistics(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalAttempts, failedAttempts, lockedAccounts, suspiciousLogins] = await Promise.all([
      prisma.loginAttempt.count({
        where: { attemptedAt: { gte: since } }
      }),
      prisma.loginAttempt.count({
        where: {
          attemptedAt: { gte: since },
          success: false
        }
      }),
      prisma.user.count({
        where: { accountLocked: true }
      }),
      prisma.loginAttempt.count({
        where: {
          attemptedAt: { gte: since },
          success: true,
          failReason: { contains: 'SUSPICIOUS' }
        }
      })
    ]);

    return {
      period: `Last ${days} days`,
      totalLoginAttempts: totalAttempts,
      failedAttempts: failedAttempts,
      successRate: totalAttempts > 0 ? ((totalAttempts - failedAttempts) / totalAttempts * 100).toFixed(2) + '%' : '0%',
      lockedAccounts: lockedAccounts,
      suspiciousLogins: suspiciousLogins
    };
  }

  /**
   * Monitor for brute force attacks
   */
  async checkBruteForce(ipAddress) {
    const key = `bruteforce:${ipAddress}`;
    const attempts = await redis.get(key);
    
    if (attempts && parseInt(attempts) > 20) {
      logger.error(`[Security] Potential brute force attack from ${ipAddress}: ${attempts} attempts`);
      return {
        blocked: true,
        reason: 'Too many login attempts from this IP address',
        attempts: parseInt(attempts)
      };
    }

    return { blocked: false };
  }

  /**
   * Record IP-based login attempt for brute force detection
   */
  async recordIPAttempt(ipAddress) {
    const key = `bruteforce:${ipAddress}`;
    const attempts = await redis.incr(key);
    await redis.expire(key, 60 * 60); // 1 hour window
    return attempts;
  }
}

module.exports = new SecurityMonitorService();
