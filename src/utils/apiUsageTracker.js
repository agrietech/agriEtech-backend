const { prisma } = require('../config/db');
const logger = require('./logger');

/**
 * API Usage Tracker
 * Tracks external API calls for monitoring, rate limiting, and cost analysis
 */
class ApiUsageTracker {
  constructor() {
    this.pendingLogs = [];
    this.flushInterval = 60000; // Flush every minute
    this.maxPendingLogs = 100;

    // Start auto-flush
    this.startAutoFlush();
  }

  /**
   * Log API usage
   */
  async logUsage(service, endpoint, duration, success, error = null) {
    const log = {
      service,
      endpoint: endpoint || 'default',
      duration,
      success,
      error: error ? error.message : null,
      timestamp: new Date(),
    };

    this.pendingLogs.push(log);

    // Flush if we have too many pending logs
    if (this.pendingLogs.length >= this.maxPendingLogs) {
      await this.flush();
    }
  }

  /**
   * Flush pending logs to database
   */
  async flush() {
    if (this.pendingLogs.length === 0) {
      return;
    }

    const logs = [...this.pendingLogs];
    this.pendingLogs = [];

    try {
      // Aggregate logs by service, endpoint, and date
      const aggregated = this._aggregateLogs(logs);

      // Upsert to database
      for (const agg of aggregated) {
        await prisma.apiUsageLog.upsert({
          where: {
            service_endpoint_date: {
              service: agg.service,
              endpoint: agg.endpoint,
              date: agg.date,
            },
          },
          update: {
            requestCount: { increment: agg.requestCount },
            successCount: { increment: agg.successCount },
            failureCount: { increment: agg.failureCount },
            totalLatencyMs: { increment: agg.totalLatencyMs },
          },
          create: {
            service: agg.service,
            endpoint: agg.endpoint,
            date: agg.date,
            requestCount: agg.requestCount,
            successCount: agg.successCount,
            failureCount: agg.failureCount,
            totalLatencyMs: agg.totalLatencyMs,
          },
        });
      }

      logger.debug(`Flushed ${logs.length} API usage logs`);
    } catch (error) {
      logger.error('Failed to flush API usage logs', { error: error.message });

      // Put logs back if flush failed
      this.pendingLogs = [...logs, ...this.pendingLogs];
    }
  }

  /**
   * Aggregate logs by service, endpoint, and date
   */
  _aggregateLogs(logs) {
    const map = new Map();

    for (const log of logs) {
      const dateStr = log.timestamp.toISOString().split('T')[0];
      const key = `${log.service}:${log.endpoint}:${dateStr}`;

      if (!map.has(key)) {
        map.set(key, {
          service: log.service,
          endpoint: log.endpoint,
          date: new Date(dateStr),
          requestCount: 0,
          successCount: 0,
          failureCount: 0,
          totalLatencyMs: 0,
        });
      }

      const agg = map.get(key);
      agg.requestCount++;
      agg.totalLatencyMs += log.duration;

      if (log.success) {
        agg.successCount++;
      } else {
        agg.failureCount++;
      }
    }

    return Array.from(map.values());
  }

  /**
   * Get usage statistics for a service
   */
  async getServiceStats(service, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const logs = await prisma.apiUsageLog.findMany({
        where: {
          service,
          date: { gte: startDate },
        },
        orderBy: { date: 'desc' },
      });

      const totalRequests = logs.reduce((sum, log) => sum + log.requestCount, 0);
      const totalSuccess = logs.reduce((sum, log) => sum + log.successCount, 0);
      const totalFailure = logs.reduce((sum, log) => sum + log.failureCount, 0);
      const totalLatency = logs.reduce((sum, log) => sum + log.totalLatencyMs, 0);

      return {
        service,
        period: `${days} days`,
        totalRequests,
        successRate: totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0,
        totalSuccess,
        totalFailure,
        avgLatencyMs: totalRequests > 0 ? totalLatency / totalRequests : 0,
        dailyBreakdown: logs,
      };
    } catch (error) {
      logger.error('Failed to get service stats', { service, error: error.message });
      return null;
    }
  }

  /**
   * Get all services usage summary
   */
  async getAllServicesStats(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const logs = await prisma.apiUsageLog.groupBy({
        by: ['service'],
        where: {
          date: { gte: startDate },
        },
        _sum: {
          requestCount: true,
          successCount: true,
          failureCount: true,
          totalLatencyMs: true,
        },
      });

      return logs.map((log) => ({
        service: log.service,
        totalRequests: log._sum.requestCount || 0,
        totalSuccess: log._sum.successCount || 0,
        totalFailure: log._sum.failureCount || 0,
        successRate:
          log._sum.requestCount > 0
            ? ((log._sum.successCount / log._sum.requestCount) * 100).toFixed(2)
            : 0,
        avgLatencyMs:
          log._sum.requestCount > 0
            ? Math.round(log._sum.totalLatencyMs / log._sum.requestCount)
            : 0,
      }));
    } catch (error) {
      logger.error('Failed to get all services stats', { error: error.message });
      return [];
    }
  }

  /**
   * Start auto-flush timer
   */
  startAutoFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop auto-flush and flush remaining logs
   */
  async stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

// Create singleton instance
const apiUsageTracker = new ApiUsageTracker();

// Handle process exit
process.on('SIGINT', async () => {
  await apiUsageTracker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await apiUsageTracker.stop();
  process.exit(0);
});

module.exports = apiUsageTracker;
