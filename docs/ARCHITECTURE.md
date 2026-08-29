# AgriEtech Backend System Architecture

## 1. Architectural Overview

AgriEtech backend is built on an asynchronous, event-driven Node.js and Express architecture designed for high-throughput sensor telemetry ingestion, planetary satellite computing, and resilient multi-channel early warning dispatch.

---

## 2. Layered Architecture Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                          API Gateway & Ingestion                       │
│      (Express 4, Helmet, Tiered Rate Limiter, CORS, Compression)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Authentication & Geographic RBAC                    │
│   (JWT Bearer, Redis Revocation, Woreda/Regional Boundary Scoping)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                     Core Business & Hazard Engines                     │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ GEE Planetary Connector │  │ USGS Real-Time Seismology Engine    │  │
│  ├─────────────────────────┤  ├─────────────────────────────────────┤  │
│  │ RUSLE Soil Loss Engine  │  │ Multi-Hazard Predictor (6 Pillars)  │  │
│  ├─────────────────────────┤  ├─────────────────────────────────────┤  │
│  │ IoT Sensor Ingestion    │  │ Multimodal AI Agronomy (OpenRouter) │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                 Multi-Channel Alert Dispatch Pipeline                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ USSD *212# State Engine │  │ SMS Character Budgeting (UCS2/GSM7) │  │
│  ├─────────────────────────┤  ├─────────────────────────────────────┤  │
│  │ FCM Push Notification   │  │ SMTP / Nodemailer Email Dispatcher  │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                       Data & Persistence Layer                         │
│   (PostgreSQL 15 + PostGIS, Prisma ORM, Upstash / Redis Cache)         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Persistence & Spatial Models

- **PostgreSQL 15 with PostGIS**: Stores user profiles, geofenced farm boundaries, IoT sensor readings, disease diagnosis logs, and historical early warning alerts.
- **Prisma ORM**: Type-safe schema definition and query client (`prisma/schema.prisma`).
- **Redis In-Memory Data Store**:
  - JWT Token Revocation Blacklist (`auth:blacklist:<token>`).
  - Planetary raster tile cache with 6-hour TTL.
  - Spatial 2D Bounding Box query accelerator.

---

## 4. Ingestion & Analytical Pipelines

1. **Planetary Remote Sensing Pipeline**:
   - Automated scheduled cron jobs query Google Earth Engine compute endpoints for Sentinel-2, Sentinel-1 SAR, Landsat 8/9, MODIS, and SRTM DEM rasters.
2. **Seismology & Fault Line Monitoring Pipeline**:
   - Queries USGS Earthquake Hazards API on an hourly frequency across Ethiopia's bounding box ($3.0-15.5^\circ\text{N}, 32.5-48.5^\circ\text{E}$) and computes Peak Ground Acceleration ($PGA$) along the Wonji Fault Belt.
3. **Hyper-Local Agronomy Engine**:
   - Synthesizes sensor telemetry, satellite moisture indices, and weather forecasts into actionable advice in English, Amharic, and Afaan Oromoo.
