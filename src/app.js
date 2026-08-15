const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const authRoutes = require('./modules/auth/auth.routes');
const boundariesRoutes = require('./modules/boundaries/boundaries.routes');
const farmsRoutes = require('./modules/farms/farms.routes');
const sensorsRoutes = require('./modules/sensors/sensors.routes');
const satelliteRoutes = require('./modules/satelliteObservations/satelliteObservations.routes');
const riskAssessmentsRoutes = require('./modules/riskAssessments/riskAssessments.routes');
const alertsRoutes = require('./modules/alerts/alerts.routes');
const diseaseRoutes = require('./modules/diseaseDiagnosis/diseaseDiagnosis.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const ingestionRoutes = require('./ingestion/ingestion.routes');
const ussdRoutes = require('./delivery/ussd/ussd.routes');

const app = express();

// Security and standard middlewares
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'AgriEtech Backend',
    timestamp: new Date().toISOString(),
  });
});

// API root metadata
app.get('/', (_req, res) => {
  res.status(200).json({
    project: 'AgriEtech Multi-Hazard Early Warning Platform',
    version: '1.0.0',
    status: 'ONLINE',
  });
});

// API feature routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/boundaries', boundariesRoutes);
app.use('/api/v1/farms', farmsRoutes);
app.use('/api/v1/sensors', sensorsRoutes);
app.use('/api/v1/satellite-observations', satelliteRoutes);
app.use('/api/v1/risk-assessments', riskAssessmentsRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/disease-diagnosis', diseaseRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ingestion', ingestionRoutes);
app.use('/api/v1/delivery/ussd', ussdRoutes);

// Global error handler
app.use(errorHandler);

module.exports = app;
