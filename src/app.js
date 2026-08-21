const dns = require('node:dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { correlationIdMiddleware, sanitizeInput, requestTimeout } = require('./middleware/security');
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
app.use(requestTimeout(30)); // 30 second timeout for all requests

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

// API v1 root catalog index
app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'AgriEtech Multi-Hazard Early Warning Platform API',
      version: '1.0.0',
      status: 'ONLINE',
      baseUrl: '/api/v1',
      authentication: {
        type: 'Bearer JWT',
        header: 'Authorization: Bearer <token>',
      },
      modules: {
        auth: { path: '/api/v1/auth', description: 'User registration, authentication, token refresh, password management, role upgrade requests' },
        boundaries: { path: '/api/v1/boundaries', description: 'Administrative regions, zones, and woredas with GeoJSON' },
        farms: { path: '/api/v1/farms', description: 'Farm plot registration, spatial boundaries, crop metadata' },
        sensors: { path: '/api/v1/sensors', description: 'IoT sensor registration, telemetry readings, telemetry history' },
        satelliteObservations: { path: '/api/v1/satellite-observations', description: 'CHIRPS rainfall, NASA POWER, NDVI, GloFAS river discharge' },
        riskAssessments: { path: '/api/v1/risk-assessments', description: 'Multi-hazard SPI drought, flood, locust, vegetation risk calculation' },
        alerts: { path: '/api/v1/alerts', description: 'Early warning alert generation, advisory dispatch, push notifications' },
        diseaseDiagnosis: { path: '/api/v1/disease-diagnosis', description: 'Plant.id botanical identification + Gemini 2.5 Flash multimodal vision' },
        analytics: { path: '/api/v1/analytics', description: 'Executive dashboard analytics, regional breakdown, temporal trends' },
        ai: { path: '/api/v1/ai', description: 'Bilingual AI voice assistant, farmer Q&A, text-to-speech' },
        ingestion: { path: '/api/v1/ingestion', description: 'Data connector status, manual pipeline pull triggers' },
        ussd: { path: '/api/v1/delivery/ussd', description: 'Interactive USSD menu handler (*804#)' },
        admin: { path: '/api/v1/admin', description: 'System administration, user roles, emergency broadcasts, audit logs, role request approvals' },
      },
      documentation: 'file:///c:/Users/a/Desktop/agriEtech-backend/docs/API_SPECIFICATION.md',
    },
  });
});

// Web Admin Dashboard UI
app.use('/admin', adminRoutes);

// Top-level email verification and password reset handlers (for user-friendly links)
app.get('/verify-email', (req, res, next) => {
  const authController = require('./modules/auth/auth.controller');
  return authController.verifyEmail(req, res, next);
});

app.get('/reset-password', (req, res) => {
  const authController = require('./modules/auth/auth.controller');
  return authController.renderResetPasswordPage(req, res);
});

app.get('/forgot-password', (req, res) => {
  const authController = require('./modules/auth/auth.controller');
  return authController.renderForgotPasswordPage(req, res);
});

// API feature routes with specialized rate limiters
app.use('/api/v1/auth', authRoutes);
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
