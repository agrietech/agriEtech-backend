const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { correlationIdMiddleware, sanitizeInput } = require('./middleware/security');
const {
  globalLimiter,
  authLimiter,
  ussdLimiter,
  telemetryLimiter,
} = require('./middleware/rateLimiter');

const authRoutes = require('./modules/auth/auth.routes');
const boundariesRoutes = require('./modules/boundaries/boundaries.routes');
const farmsRoutes = require('./modules/farms/farms.routes');
const sensorsRoutes = require('./modules/sensors/sensors.routes');
const satelliteRoutes = require('./modules/satelliteObservations/satelliteObservations.routes');
const riskAssessmentsRoutes = require('./modules/riskAssessments/riskAssessments.routes');
const alertsRoutes = require('./modules/alerts/alerts.routes');
const diseaseRoutes = require('./modules/diseaseDiagnosis/diseaseDiagnosis.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const aiRoutes = require('./modules/ai/aiVoice.routes');
const ingestionRoutes = require('./ingestion/ingestion.routes');
const ussdRoutes = require('./delivery/ussd/ussd.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const { isConnected } = require('./config/db');

const app = express();

// Security and standard middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allows inline script/styles for admin dashboard
}));

// Configurable CORS whitelist
const corsOptions = {
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id', 'x-api-key'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(compression());
app.use(requestLogger);
app.use(correlationIdMiddleware);
app.use(sanitizeInput);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter
app.use(globalLimiter);

// Health check – comprehensive
app.get('/health', (_req, res) => {
  const memUsage = process.memoryUsage();
  const status = isConnected() ? 'UP' : 'DEGRADED';
  res.status(isConnected() ? 200 : 503).json({
    status,
    service: 'AgriEtech Multi-Hazard Early Warning Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    system: {
      memoryUsageMb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
      platform: process.platform,
      nodeVersion: process.version,
    },
    dependencies: {
      database: isConnected() ? 'UP' : 'DOWN',
      redis: 'OPTIONAL',
    },
  });
});

// Liveness probe
app.get('/health/liveness', (_req, res) => {
  res.status(200).json({ status: 'LIVE', timestamp: new Date().toISOString() });
});

// Readiness probe
app.get('/health/readiness', (_req, res) => {
  const dbReady = isConnected();
  res.status(dbReady ? 200 : 503).json({
    database: dbReady ? 'UP' : 'DOWN',
    ready: dbReady,
    timestamp: new Date().toISOString(),
  });
});

// API root metadata
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      project: 'AgriEtech Multi-Hazard Early Warning Platform',
      version: '1.0.0',
      status: 'ONLINE',
      docs: '/api/v1',
      admin: '/admin/dashboard',
    },
  });
});

// Web Admin Dashboard UI
app.use('/admin', adminRoutes);

// Top-level email verification handler (for user-friendly links)
app.get('/verify-email', (req, res, next) => {
  const authController = require('./modules/auth/auth.controller');
  return authController.verifyEmail(req, res, next);
});

// API feature routes with specialized rate limiters
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/boundaries', boundariesRoutes);
app.use('/api/v1/farms', farmsRoutes);
app.use('/api/v1/sensors', telemetryLimiter, sensorsRoutes);
app.use('/api/v1/satellite-observations', satelliteRoutes);
app.use('/api/v1/risk-assessments', riskAssessmentsRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/disease-diagnosis', diseaseRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/ingestion', telemetryLimiter, ingestionRoutes);
app.use('/api/v1/delivery/ussd', ussdLimiter, ussdRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
