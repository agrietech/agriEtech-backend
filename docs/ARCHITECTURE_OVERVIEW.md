# Architecture Overview & System Design

## 1. System Purpose

AgriEtech is a **Multi-Hazard Agricultural Early Warning System** for Ethiopia that monitors:
- **Drought** (rainfall deficits via CHIRPS satellite)
- **Floods** (river discharge via Copernicus GloFAS)
- **Desert Locust** infestations (FAO Locust Watch)
- **Vegetation stress** (NDVI from MODIS/Sentinel-2)
- **Weather** forecasts (Open-Meteo, NASA POWER)

The system serves farmers, agricultural extension agents, woreda officers, and researchers through:
- Mobile app (Flutter)
- SMS alerts (Africa's Talking)
- USSD menu (*804# - for 2G feature phones)
- Real-time WebSocket updates
- RESTful API

---

## 2. Architectural Principles

### Core Design Pillars

1. **Separation of Concerns**
   - Ingestion, risk processing, API, and delivery are independent layers
   - Each module has clear responsibilities

2. **Event-Driven Architecture**
   - BullMQ job queues handle satellite data ingestion asynchronously
   - WebSocket broadcasts enable real-time risk updates
   - No blocking operations in HTTP request handlers

3. **Multi-Channel Delivery**
   - Smartphone users: Mobile app + push notifications
   - Feature phone users: SMS + USSD menu
   - Web dashboard: Socket.IO real-time updates

4. **Geospatial First**
   - All data indexed by Ethiopian administrative boundaries (Region → Zone → Woreda)
   - PostGIS for polygon queries and spatial intersections
   - Turf.js for geospatial calculations

5. **Offline Resilience**
   - Mobile app caches data locally (Hive)
   - Background sync when connectivity restored
   - SMS/USSD work on 2G networks

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL DATA SOURCES                        │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ CHIRPS       │ NASA POWER   │ GloFAS       │ FAO Locust Watch  │
│ (Rainfall)   │ (Weather)    │ (Hydrology)  │ (Pest Tracking)   │
│              │              │              │                   │
│ MODIS/       │ Open-Meteo   │ Sentinel-1/2 │ SoilGrids         │
│ Sentinel     │ (Forecasts)  │ (NDVI)       │ (Soil Data)       │
└──────────────┴──────────────┴──────────────┴───────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                      INGESTION LAYER                             │
│  • 15 Connector Clients (HTTP APIs)                              │
│  • BullMQ Job Schedulers (Cron-based)                            │
│  • Data Normalization & Validation                               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER                              │
│  • PostgreSQL 15 + PostGIS 3.3                                   │
│  • Tables: Users, Farms, Sensors, SatelliteObservations,        │
│            RiskAssessments, Alerts, AlertDeliveryLogs            │
│  • Redis 7 (Job Queue + Caching)                                 │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PROCESSING LAYER                               │
│  • SPI Calculator (Drought risk via Gamma distribution)          │
│  • Flood Risk Evaluator (GloFAS discharge thresholds)            │
│  • VCI Analyzer (Vegetation stress from NDVI)                    │
│  • Locust Zone Matcher (Spatial intersection)                    │
│  • Risk Aggregator (Multi-hazard composite scoring)              │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                   │
│  • Express.js REST API (/api/v1/*)                               │
│  • Socket.IO WebSocket Server                                    │
│  • JWT Authentication + RBAC                                     │
│  • Request Validation & Error Handling                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ↓            ↓            ↓
    ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
    │ MOBILE APP       │  │ SMS/USSD     │  │ WEB DASHBOARD    │
    │ (Flutter)        │  │ (2G Phones)  │  │ (Socket.IO)      │
    │                  │  │              │  │                  │
    │ • FCM Push       │  │ • Africa's   │  │ • Real-time      │
    │ • WebSocket      │  │   Talking    │  │   Updates        │
    │ • Offline Cache  │  │ • USSD Menu  │  │ • Analytics      │
    └──────────────────┘  └──────────────┘  └──────────────────┘
```

---

## 4. Data Flow Pipeline

### Automated Ingestion Cycle

1. **BullMQ Schedulers** trigger connectors based on data availability:
   - `01:00 UTC` - NASA POWER (daily agroclimatology)
   - `03:00 UTC` - CHIRPS (dekadal rainfall)
   - `04:00 UTC` - GloFAS (river discharge forecasts)
   - `06:00 UTC` - FAO Locust Watch (pest bulletins)
   - `Hourly` - Open-Meteo (16-day weather forecasts)

2. **Connectors** fetch, normalize, and persist to `SatelliteObservation` table

3. **Risk Processing Engine** runs automatically:
   ```
   Raw Observations
         ↓
   Calculate Anomalies (SPI, VCI, Discharge)
         ↓
   Compute Composite Risk Score (0.0 - 1.0)
         ↓
   Persist to RiskAssessment table
         ↓
   If Risk ≥ HIGH → Generate Alert
   ```

4. **Alert Dispatch**:
   - Socket.IO: Broadcast to connected clients in woreda room
   - FCM: Push notification to mobile apps
   - SMS: Send to farmers in affected woreda
   - USSD: Available in interactive menu

---

## 5. Security & Access Control

### Authentication
- **JWT tokens** (7-day expiration)
- Bcrypt password hashing
- Phone number-based registration

### Authorization (RBAC)

| Role | Permissions |
|------|-------------|
| `FARMER` | Manage own farms, view local weather, receive alerts |
| `DEVELOPMENT_AGENT` | Manage multiple farms, trigger disease diagnosis |
| `WOREDA_OFFICER` | View aggregate woreda risks, review reports |
| `RESEARCHER` | Query historical data, export analytics |
| `ADMIN` | System management, manual ingestion triggers |

---

## 6. Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15 + PostGIS 3.3
- **Cache/Queue**: Redis 7 + BullMQ
- **WebSocket**: Socket.IO
- **ORM**: Prisma

### External Integrations
- **SMS/USSD**: Africa's Talking API
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Disease Diagnosis**: Plant.id / Kindwise AI
- **Geospatial**: Turf.js, PostGIS

### Satellite Data Sources
- CHIRPS, NASA POWER, Copernicus GloFAS, MODIS, Sentinel-1/2, FAO WaPOR, FAO Locust Watch, SoilGrids, Open-Meteo

---

## 7. Scalability Considerations

- **Horizontal scaling**: Stateless API servers behind load balancer
- **Worker isolation**: BullMQ workers can run on separate instances
- **Caching**: Redis for frequently accessed risk scores (24h TTL)
- **Database**: Connection pooling, read replicas for analytics
- **Rate limiting**: Prevent API abuse
- **Async processing**: No blocking operations in HTTP handlers
