# Backend Master File & Folder Technical Catalog

An exhaustive guide describing the exact purpose, input/output contracts, and architectural role of every single folder and file in the `agrietech-backend` repository.

---

## 📁 1. Root Configuration Files

| File Name | Purpose & Technical Responsibility | Key Technologies |
|---|---|---|
| `package.json` | Defines Node.js project metadata, build scripts (`dev`, `start`, `prisma:migrate`), and all dependencies. | Express, Prisma, BullMQ, Socket.IO, Africa's Talking, Turf.js |
| `.env.example` | Blueprint for all required environment variables: DB connection, Redis host/port, JWT secrets, Africa's Talking API keys, and third-party satellite tokens. | Dotenv |
| `.eslintrc.json` | Enforces consistent ES2022 JavaScript code standards, unused variable checks, and clean team conventions. | ESLint |
| `.prettierrc` | Code formatting rules: single quotes, trailing commas, 2-space indentation. | Prettier |
| `docker-compose.yml` | Instantiates local infrastructure: PostgreSQL 15 with PostGIS extension (port 5432) and Redis 7 (port 6379). | Docker Compose |
| `Dockerfile` | Production-ready multi-stage Alpine Docker build with Prisma generation and minimal runtime footprint. | Docker |
| `README.md` | Master technical handbook: Quickstart guide, system topology, API index, and team workflow. | Markdown |

---

## 📁 2. `prisma/` — Database Modeling & PostGIS Layer

| File Name | Purpose & Technical Responsibility |
|---|---|
| `schema.prisma` | Defines the complete relational and geospatial database schema: `User`, `Region`, `Zone`, `Woreda`, `Farm`, `Sensor`, `SensorReading`, `SatelliteObservation`, `RiskAssessment`, `Alert`, `AlertDeliveryLog`, and `DiseaseDiagnosis`. Generates the type-safe Prisma Client. |

---

## 📁 3. `src/config/` — Centralized Infrastructure Configuration

| File Name | Purpose & Technical Responsibility |
|---|---|
| `env.js` | Validates and exports `process.env` variables into strongly-typed configuration objects. Prevents runtime crashes from missing keys. |
| `db.js` | Manages the Prisma Client singleton instance and database connection pool lifecycle (`connectDB()`). |
| `redis.js` | Exports an `ioredis` connection client configured with auto-reconnect logic for BullMQ job queues and caching. |
| `socket.js` | Initializes the Socket.IO WebSocket server, registers client connections, and provides channel joining for woreda rooms (`woreda:{id}`). |

---

## 📁 4. `src/ingestion/` — Earth Observation & IoT Ingestion Subsystem

### 📂 `src/ingestion/connectors/` (15 Satellite & Climate API Clients)
| File Name | Data Source | Ingested Metrics & Purpose |
|---|---|---|
| `chirpsConnector.js` | CHIRPS (0.05° resolution) | Daily and dekadal rainfall rasters for SPI drought calculation. |
| `nasaPowerConnector.js` | NASA POWER API | Daily solar radiation ($MJ/m^2$), humidity (%), max/min temperature ($^circ C$). |
| `cpcAfricaRainfallConnector.js` | NOAA CPC Africa | Daily precipitation estimates and historical climatological baselines. |
| `fewsNetConnector.js` | FEWS NET | Food security vulnerability indices and agroclimatology alerts. |
| `openMeteoConnector.js` | Open-Meteo | Hourly current weather, 16-day numerical ensemble forecast, historical archive. |
| `openWeatherConnector.js` | OpenWeather API | Severe weather alerts and atmospheric pressure monitoring. |
| `noaaCpcSeasonalConnector.js` | NOAA CPC | Seasonal rainfall outlooks for Belg (Feb-May) and Kiremt (Jun-Sep) seasons. |
| `glofasConnector.js` | Copernicus GloFAS | River discharge forecasts ($m^3/s$) for Awash, Blue Nile, and Omo river basins. |
| `sentinel1Connector.js` | Copernicus Sentinel-1 | SAR cloud-penetrating radar for flood inundation mapping. |
| `modisNdviConnector.js` | NASA MODIS AppEEARS | 250m 16-day composite Normalized Difference Vegetation Index (NDVI). |
| `sentinel2NdviConnector.js` | Copernicus Sentinel-2 | 10m high-resolution farm-level NDVI for individual plot health tracking. |
| `faoWaporConnector.js` | FAO WaPOR | Actual evapotranspiration (AETI) and agricultural water productivity. |
| `faoLocustConnector.js` | FAO Locust Watch | Desert locust hopper band locations, swarm coordinates, and threat polygons. |
| `soilgridsConnector.js` | ISRIC SoilGrids 250m | Baseline soil chemistry: pH, clay, sand, silt, organic carbon, CEC. |
| `faoGaezConnector.js` | FAO GAEZ v4 | Agro-ecological zones and crop suitability yield potentials. |
| `index.js` | Connector Registry | Aggregates and exports all connector clients under a unified interface. |

### 📂 `src/ingestion/jobs/` (BullMQ Queue & Repeatable Schedulers)
| File Name | Purpose & Schedule |
|---|---|
| `queue.js` | Instantiates the BullMQ `ingestionQueue` and worker event listeners for completed/failed jobs. |
| `scheduler.js` | Registers repeatable cron schedules on boot (Hourly weather, Daily 01:00 NASA, 03:00 CHIRPS, 04:00 GloFAS, 06:00 Locust). |
| `pullChirpsRainfall.job.js` | Worker that executes `chirpsConnector` across all Woredas and writes to `SatelliteObservation`. |
| `pullOpenMeteoCurrent.job.js` | Worker that refreshes 16-day weather forecasts for registered farms. |
| `pullGlofasDischarge.job.js` | Worker that pulls GloFAS hydrologic discharge forecasts. |
| `pullNdviModisSentinel.job.js` | Worker that polls 16-day MODIS and 5-day Sentinel-2 vegetation indices. |
| `pullFaoLocustBulletins.job.js` | Worker that updates desert locust threat GIS polygons. |
| `pullSoilgridsStatic.job.js` | Worker that pulls static soil profiles for newly created farms. |
| `pullNasaPowerDaily.job.js` | Worker that updates daily NASA POWER solar radiation and humidity. |
| `pullNoaaSeasonalOutlook.job.js` | Worker that pulls monthly seasonal climate outlooks. |

### 📂 `src/ingestion/` (Ingest Routes & Controller)
| File Name | Purpose |
|---|---|
| `ingest.routes.js` | Express routes: `POST /trigger/:connectorName` (Admin run) and `POST /sensors/telemetry` (IoT intake). |
| `ingest.controller.js` | Controller validating payloads and queuing ingestion tasks. |
| `README.md` | Documentation detailing ingestion architecture and connector schemas. |

---

## 📁 5. `src/processing/` — Scientific Risk & Mathematics Layer

| File Name | Purpose & Algorithm |
|---|---|
| `spiCalculator.js` | Fits rolling 30/90-day rainfall to a 2-parameter Gamma distribution to output Standardized Precipitation Index. |
| `floodRiskEvaluator.js` | Compares GloFAS discharge forecasts against 2-year, 5-year, and 20-year return period thresholds ($Q_2, Q_5, Q_{20}$). |
| `vegetationStressAnalyzer.js` | Computes Vegetation Condition Index (VCI) against 10-year historical maximums and minimums. |
| `locustZoneMatcher.js` | Uses `@turf/turf` for spatial intersection of locust swarms with Woreda boundary polygons. |
| `sensorSatelliteCalibrator.js` | Calibrates ground sensor moisture readings against remote sensing satellite estimates. |
| `riskAggregator.js` | Multi-hazard composite scoring formula: $R = 0.35 R_{drought} + 0.25 R_{flood} + 0.25 R_{locust} + 0.15 R_{veg}$. |
| `statistics.js` | Pure mathematical helpers: Gamma fitting, z-scores, moving averages, standard deviation, quartiles. |
| `periodAggregation.js` | Time-series bucketing helpers for Daily, Dekadal (10-day), Monthly, Belg, and Kiremt seasons. |
| `README.md` | Processing layer overview and mathematical formulas. |

---

## 📁 6. `src/modules/` — Domain REST API Resources

Each module contains `*.routes.js`, `*.controller.js`, `*.service.js`, and validation logic:
1. **`auth/`**: User registration, login, JWT token generation, bcrypt password hashing, and role checks.
2. **`boundaries/`**: Region, Zone, and Woreda geographical queries, centroid coordinates, and PostGIS boundaries.
3. **`farms/`**: Farm plot creation, GPS polygon boundary validation, crop cataloging, and farmer plot ownership.
4. **`sensors/`**: IoT hardware registration, battery status tracking, and time-series moisture/temperature querying.
5. **`satelliteObservations/`**: Query interface for historical and daily CHIRPS, MODIS, GloFAS, and NASA records.
6. **`riskAssessments/`**: Woreda composite risk index query endpoint with bilingual advisories.
7. **`alerts/`**: Early warning advisory generation, severity threshold filtering, and alert inbox management.
8. **`diseaseDiagnosis/`**: Crop leaf photo upload, Plant.id/Kindwise AI model integration, and agronomic treatment advice.
9. **`analytics/`**: Historical weather trends, dekadal precipitation charts, and Belg/Kiremt comparative analytics.

---

## 📁 7. `src/delivery/` — Multi-Channel Dissemination

| File Name | Purpose & Channel |
|---|---|
| `websocket/socketServer.js` | Broadcasts live `risk:updated` WebSocket events to active mobile apps and web dashboards. |
| `websocket/riskAssessmentChannel.js` | Subscribes to database risk assessment events and dispatches to the socket server. |
| `sms/africasTalkingClient.js` | Africa's Talking SMS API wrapper for sending SMS to Ethiopian phone numbers. |
| `sms/smsDispatcher.js` | Dispatches localized SMS alerts in Amharic & English to farmers in affected woredas. |
| `sms/smsTemplates/*.txt` | Pre-authored SMS alert templates for Drought, Flood, Locust, and General warnings in Amharic. |
| `ussd/ussd.routes.js` | Africa's Talking / Ethio Telecom USSD callback endpoint (`POST /api/v1/delivery/ussd`). |
| `ussd/ussdMenu.controller.js` | Interactive USSD menu (*804#) for 2G feature phone users to check weather, risks, and report locusts. |
| `push/fcmDispatcher.js` | Firebase Cloud Messaging (FCM) push notification dispatcher for Flutter devices. |

---

## 📁 8. `src/middleware/`, `src/utils/`, `scripts/`, `tests/`

- **`middleware/`**: `auth.middleware.js` (JWT verification & RBAC), `errorHandler.js` (global error handler), `requestLogger.js` (Morgan/Winston auditor), `validate.js` (express-validator).
- **`utils/`**: `geoUtils.js` (Turf.js point-in-polygon & distance), `dateUtils.js` (Ethiopian dekads & dates), `logger.js` (Winston JSON logging).
- **`scripts/`**: `loadHdxBoundaries.js` (HDX GeoJSON boundary importer), `seedDemoFarms.js` (demo seed data), `backfillHistoricalWeather.js` (historical weather backfill).
- **`tests/`**: Unit and integration test suites for connectors, risk calculations, and auth routes.
