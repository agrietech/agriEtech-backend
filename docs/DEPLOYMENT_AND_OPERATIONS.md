# AgriEtech Production Deployment & Operations Guide

## 1. Executive Summary

This guide outlines production hardening, container orchestration, caching strategies, rate limiting, and monitoring for the AgriEtech platform.

---

## 2. Infrastructure Architecture

- **Runtime**: Node.js 18+ LTS / Alpine Linux Container.
- **Relational Database**: PostgreSQL 15+ with PostGIS spatial extensions managed via Prisma ORM.
- **In-Memory Cache & Session Store**: Upstash / Redis for token blacklisting, spatial bounding box caching, and satellite tile caching.
- **Reverse Proxy & SSL**: Nginx with TLS 1.3 termination, HTTP/2, and security headers.
- **Task Scheduling**: Node-Cron background workers executing daily satellite passes and live USGS seismic polling.

---

## 3. Environment Configuration

*File:* `.env` (validated via `src/config/env.js`)

| Variable | Type | Description |
| :--- | :--- | :--- |
| `PORT` | Number | HTTP listener port (default `5000`). |
| `DATABASE_URL` | URI | PostgreSQL connection string with PostGIS. |
| `REDIS_URL` | URI | Upstash / Redis connection string. |
| `JWT_SECRET` | String | Cryptographic key for signing access tokens. |
| `OPENROUTER_API_KEY` | String | API key for Gemini 2.5 Flash multimodal agronomy. |
| `PLANT_ID_API_KEY` | String | Botanical classification API key. |
| `AFRICAS_TALKING_API_KEY` | String | SMS and USSD gateway credentials. |
| `SENSOR_API_KEYS` | String | Comma-separated whitelist of IoT device API keys. |

---

## 4. Container Orchestration

### Docker Compose
```bash
docker-compose up -d --build
```

### Health Check Endpoint
- **URL**: `GET /api/v1/health`
- **Output**: JSON payload reporting database connectivity, Redis ping, active memory usage, and background scheduler status.

---

## 5. Security & Rate Limiting

- **Helmet.js**: Injects strict CSP, HSTS, and X-Content-Type headers.
- **CORS**: Whitelisted origins for mobile and web clients.
- **Tiered Rate Limiter** (`src/middleware/rateLimiter.js`):
  - Public / Auth Endpoints: 10 requests / minute.
  - Telemetry & Queries: 120 requests / minute.
  - Sensor Ingestion: 600 requests / minute per API key.
