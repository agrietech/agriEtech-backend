# AgriEtech Backend

**Multi-Hazard Agricultural Early Warning System for Ethiopia**

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Team Members & Roles](#team-members--roles)
4. [System Architecture](#system-architecture)
5. [Technology Stack](#technology-stack)
6. [Database Schema](#database-schema)
7. [API Specification](#api-specification)
8. [Data Ingestion Pipeline](#data-ingestion-pipeline)
9. [Risk Calculation Engine](#risk-calculation-engine)
10. [Alert Delivery System](#alert-delivery-system)
11. [Installation & Setup](#installation--setup)
12. [Configuration](#configuration)
13. [Deployment](#deployment)
14. [Development Guide](#development-guide)

---

## Problem Statement

### 1. Context & Vulnerability Baseline
Ethiopia's economy is predominantly agrarian, with agriculture employing **~79% of the labor force**, generating **~34% of national GDP**, and contributing **~85% of total export earnings** (Central Statistical Agency / World Bank). Over **95% of agricultural production is rainfed**, leaving smallholder farmers with an average landholding of less than 1.2 hectares directly vulnerable to weather volatility and climate shocks.

### 2. Empirical Hazard Statistics

#### A. Drought & Rainfall Volatility
- **Population Impacted**: The 2020–2023 drought (five consecutive failed rainy seasons in the Horn of Africa) left **over 24.1 million Ethiopians** food insecure, with severe impacts across Oromia (Borena zone), Somali, Afar, and southern regions (UN OCHA / NDRMC).
- **Asset & Crop Losses**: Over **4.5 million livestock died** between 2021 and 2023, and staple crop yields (Teff, Maize, Wheat, Sorghum) declined by **50% to 80%** across drought-declared woredas.
- **Seasonal Dependency**: The short *Belg* (February–May) rains contribute 15–20% of annual crop production, while the main *Kiremt* (June–September) rains supply over 80%. A delay of just 15 days in rainfall onset reduces final cereal yields by up to 30%.

#### B. Riverine & Flash Flooding
- **Annual Displacement**: River overflow along the Awash, Omo, and Baro-Akobo basins displaces between **300,000 and 700,000 individuals annually** during peak Kiremt rainfall.
- **Agricultural Land Damage**: Flooding regularly inundates **over 240,000 hectares of cropland**, destroying irrigation infrastructure and standing crops right before harvest.

#### C. Desert Locust Infestations (*Schistocerca gregaria*)
- **Cereal Destruction**: The 2019–2021 Horn of Africa locust upsurge invaded **197 woredas** across Afar, Amhara, Oromia, Somali, and Tigray, damaging **over 356,000 metric tons of cereal crops** (FAO / Ministry of Agriculture).
- **Pasture Depletion**: Over **1.35 million hectares of pasture and rangeland** were destroyed, severely accelerating livestock malnutrition.

#### D. Crop Diseases & Pest Pressure
- Crop pests and fungal pathogens (e.g., Maize Lethal Necrosis, Wheat Stem Rust Ug99, Fall Armyworm) cause estimated post-planting yield losses of **25% to 40%** in vulnerable farming clusters without timely diagnostic support.

### 3. The Last-Mile Communication Bottleneck
- **Feature Phone Dominance**: Over **65% of rural smallholders** only own 2G basic feature phones. Mobile data internet penetration in remote kebeles is **below 25%**.
- **Extension Agent Capacity**: Development Agents (DAs) face an average ratio of **1 agent per 450–600 farming households**, making physical advisory dissemination too slow for rapid hazard events.
- **Information Fragmentation**: Satellite data from NOAA, NASA, and Copernicus exist in research repositories but are not translated into localized, actionable advice delivered via SMS/USSD in local languages (Amharic, Afaan Oromoo).

---

## Solution Overview

AgriEtech is a comprehensive early warning system that:

### Core Capabilities

1. **Multi-Hazard Monitoring**
   - Continuous monitoring of 6 major agricultural hazards
   - Integration of 15+ satellite and climate data sources
   - Real-time risk assessment at woreda (district) level

2. **Predictive Analytics**
   - Drought risk via Standardized Precipitation Index (SPI)
   - Flood forecasting using GloFAS discharge models
   - Vegetation stress analysis from NDVI satellite imagery
   - Spatial locust tracking and proximity alerts
   - Weather forecasting (16-day ahead)

3. **Multi-Channel Delivery**
   - **Smartphone App** - Flutter mobile app with offline support
   - **SMS** - Bulk messaging via Africa's Talking
   - **USSD** - Interactive menu (*804#) for 2G feature phones
   - **Web Dashboard** - Real-time monitoring for officials
   - **Push Notifications** - Instant alerts via Firebase

4. **Bilingual Support**
   - All content available in English and Amharic
   - Culturally appropriate advisory messages
   - Local agricultural terminology

5. **Decision Support**
   - Actionable recommendations for each hazard
   - Best practices for crop protection
   - AI-powered crop disease diagnosis

### Target Users

| User Type               | Count | Primary Needs                                  |
| ----------------------- | ----- | ---------------------------------------------- |
| **Smallholder Farmers** | 12M+  | Timely alerts, weather forecasts, crop advice  |
| **Development Agents**  | 15K+  | Multi-farm monitoring, advisory dispatch       |
| **Woreda Officers**     | 800+  | Aggregate risk monitoring, decision support    |
| **Researchers**         | 500+  | Historical data analysis, trend identification |

---

## Team Members & Roles

| # | Full Name | Student ID | Project Role | Core Responsibilities & Assigned Modules |
|---|---|---|---|---|
| 1 | **Abenezer Endrias** | `CTC-1826-26` | **Ingestion & Data Pipeline** | Satellite and climate API connectors (CHIRPS, Open-Meteo, GloFAS, NASA POWER), BullMQ background queues, and cron schedulers. |
| 2 | **Abinu Mathewos** | `CTC-1258-26` | **REST API & Database Modules** | Farm plot management, administrative boundaries, IoT sensor registration, crop disease intake, and regional analytics. |
| 3 | **Abraham Amogne** | `CTC-329-26` | **Team Lead & Core Backend** | System architecture, server setup, database schema (Prisma/PostGIS), auth/middleware, code review, and project coordination. |
| 4 | **Alen Biruk** | `CTC-2176-26` | **Risk Processing & Analytics** | Drought SPI calculation, GloFAS flood return thresholds, VCI vegetation index, locust zone matching, and composite risk scoring. |
| 5 | **Banchamlak Golla** | `CTC-2952-26` | **Alert Delivery & Multi-Channel** | Africa's Talking SMS alerts (Amharic, Afaan Oromoo, English), USSD (*804#) menu, Firebase push notifications, and WebSocket broadcast. |

---

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL DATA SOURCES (15+ APIs)               │
├─────────────┬──────────────┬──────────────┬────────────────┤
│ CHIRPS      │ NASA POWER   │ GloFAS       │ FAO Locust     │
│ MODIS       │ Sentinel-1/2 │ Open-Meteo   │ SoilGrids      │
└─────────────┴──────────────┴──────────────┴────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                   INGESTION LAYER                            │
│  • 15 Connector Clients (HTTP APIs)                          │
│  • BullMQ Job Schedulers (Cron-based)                        │
│  • Redis Queue Management                                    │
└─────────────────────────────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                  PROCESSING LAYER                            │
│  • SPI Calculator (Drought)                                  │
│  • Flood Risk Evaluator (GloFAS thresholds)                  │
│  • VCI Analyzer (Vegetation stress)                          │
│  • Locust Zone Matcher (Spatial intersection)                │
│  • Risk Aggregator (Multi-hazard scoring)                    │
└─────────────────────────────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL + PostGIS)                 │
│  Users • Farms • Sensors • Observations • Risks • Alerts     │
└─────────────────────────────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│  Express REST API • Socket.IO WebSocket • JWT Auth           │
└─────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ↓           ↓           ↓
        ┌────────────────┐  ┌───────────┐  ┌──────────────┐
        │ Mobile App     │  │ SMS/USSD  │  │ Web Dashboard│
        │ (Flutter)      │  │ (2G)      │  │ (Officials)  │
        └────────────────┘  └───────────┘  └──────────────┘
```

### Data Flow Pipeline

**1. Scheduled Ingestion**

```
BullMQ Scheduler → Connector → External API → Normalize → Database
```

**Schedule:**

- `01:00 UTC` - NASA POWER (daily agroclimatology)
- `03:00 UTC` - CHIRPS (dekadal rainfall)
- `04:00 UTC` - GloFAS (river discharge)
- `06:00 UTC` - FAO Locust (pest bulletins)
- `Hourly` - Open-Meteo (weather forecasts)

**2. Risk Processing**

```
Raw Observations → Calculate Anomalies → Compute Composite Score → Generate Alerts
```

**3. Alert Dispatch**

```
Alert Created → Route to Channels → Deliver (WebSocket/FCM/SMS/USSD)
```

### Architectural Principles

1. **Event-Driven** - Asynchronous processing with BullMQ
2. **Multi-Channel** - Reach users via multiple delivery methods
3. **Geospatial First** - PostGIS for spatial queries
4. **Offline Resilient** - Mobile app caches data locally
5. **Modular** - Independent ingestion, processing, delivery layers
6. **Scalable** - Horizontal scaling via stateless API servers

---

## Technology Stack

### Backend

- **Runtime**: Node.js 18+ / 20+
- **Framework**: Express.js 4.x
- **ORM**: Prisma 5.x
- **WebSocket**: Socket.IO 4.x
- **Queue**: BullMQ 5.x
- **Geospatial**: Turf.js 6.x

### Infrastructure

- **Database**: PostgreSQL 15 + PostGIS 3.3
- **Cache/Queue**: Redis 7
- **Container**: Docker + Docker Compose
- **Process Manager**: PM2 (production)

### External Integrations

- **SMS/USSD**: Africa's Talking API
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Disease Diagnosis**: Plant.id / Kindwise AI API
- **Image Storage**: Local filesystem (future: AWS S3)

### Data Sources (15+ APIs)

- CHIRPS (rainfall)
- NASA POWER (agroclimatology)
- Copernicus GloFAS (hydrology)
- MODIS (250m NDVI)
- Sentinel-1/2 (SAR, 10m NDVI)
- FAO Locust Watch (pest tracking)
- FAO WaPOR (evapotranspiration)
- Open-Meteo (weather forecasts)
- OpenWeather (severe weather)
- NOAA CPC (seasonal outlooks)
- FEWS NET (food security)
- SoilGrids (soil properties)
- FAO GAEZ (agro-ecological zones)

---

## Database Schema

### Entity Relationship Overview

```
Region (1) ─→ (N) Zone (1) ─→ (N) Woreda
                                    │
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
                  User            Farm         SatelliteObservation
                    │               │               │
                    ↓               ↓               ↓
            AlertDeliveryLog    Sensor         RiskAssessment
                                    │               │
                                    ↓               ↓
                              SensorReading      Alert
                              DiseaseDiagnosis
```

### Core Tables

#### User

User accounts with role-based access control.

| Field         | Type   | Description                                                  |
| ------------- | ------ | ------------------------------------------------------------ |
| id            | UUID   | Primary key                                                  |
| phoneNumber   | String | Unique phone (E.164 format)                                  |
| fullName      | String | User's full name                                             |
| passwordHash  | String | Bcrypt hashed password                                       |
| role          | Enum   | FARMER, DEVELOPMENT_AGENT, WOREDA_OFFICER, RESEARCHER, ADMIN |
| preferredLang | String | 'am' (Amharic) or 'en' (English)                             |
| woredaId      | UUID   | Foreign key to Woreda                                        |

#### Woreda (District)

Ethiopian administrative districts with geospatial boundaries.

| Field     | Type   | Description         |
| --------- | ------ | ------------------- |
| id        | UUID   | Primary key         |
| zoneId    | UUID   | Foreign key to Zone |
| nameEn    | String | English name        |
| nameAm    | String | Amharic name        |
| geojson   | JSON   | Polygon boundary    |
| centerLat | Float  | Centroid latitude   |
| centerLng | Float  | Centroid longitude  |

#### Farm

Farmer-owned agricultural plots with GPS boundaries.

| Field          | Type   | Description                          |
| -------------- | ------ | ------------------------------------ |
| id             | UUID   | Primary key                          |
| userId         | UUID   | Foreign key to User                  |
| woredaId       | UUID   | Foreign key to Woreda                |
| farmName       | String | Plot name                            |
| areaHectares   | Float  | Farm size                            |
| polygonGeojson | JSON   | GPS boundary polygon                 |
| latitude       | Float  | Centroid latitude                    |
| longitude      | Float  | Centroid longitude                   |
| primaryCrop    | String | Main crop (wheat, teff, maize, etc.) |

#### SatelliteObservation

Ingested satellite and climate data.

| Field            | Type     | Description                       |
| ---------------- | -------- | --------------------------------- |
| id               | UUID     | Primary key                       |
| woredaId         | UUID     | Foreign key to Woreda             |
| observationDate  | DateTime | Observation timestamp             |
| source           | String   | Data source (CHIRPS, MODIS, etc.) |
| chirpsRainfallMm | Float    | Rainfall in millimeters           |
| nasaPowerTempMax | Float    | Max temperature (°C)              |
| nasaPowerTempMin | Float    | Min temperature (°C)              |
| modisNdvi        | Float    | MODIS NDVI value                  |
| sentinel2Ndvi    | Float    | Sentinel-2 NDVI value             |
| glofasDischarge  | Float    | River discharge (m³/s)            |
| locustPresence   | Boolean  | Locust detected flag              |

#### RiskAssessment

Calculated multi-hazard risk scores.

| Field             | Type     | Description                                    |
| ----------------- | -------- | ---------------------------------------------- |
| id                | UUID     | Primary key                                    |
| woredaId          | UUID     | Foreign key to Woreda                          |
| assessmentDate    | DateTime | Risk calculation date                          |
| hazardType        | Enum     | DROUGHT, FLOOD, LOCUST_PEST, VEGETATION_STRESS |
| riskLevel         | Enum     | LOW, MODERATE, HIGH, CRITICAL                  |
| riskScore         | Float    | Composite score (0.0 - 1.0)                    |
| spi30Day          | Float    | 30-day SPI value                               |
| spi90Day          | Float    | 90-day SPI value                               |
| dischargeAnomaly  | Float    | Flood discharge deviation                      |
| ndviAnomaly       | Float    | Vegetation anomaly                             |
| locustRiskRadius  | Float    | Distance to nearest swarm (km)                 |
| recommendationsEn | String   | Advisory in English                            |
| recommendationsAm | String   | Advisory in Amharic                            |

#### Alert

Generated early warning alerts.

| Field      | Type   | Description             |
| ---------- | ------ | ----------------------- |
| id         | UUID   | Primary key             |
| woredaId   | UUID   | Foreign key to Woreda   |
| hazardType | Enum   | Hazard type             |
| severity   | Enum   | Alert severity level    |
| titleEn    | String | Alert title (English)   |
| titleAm    | String | Alert title (Amharic)   |
| messageEn  | String | Alert message (English) |
| messageAm  | String | Alert message (Amharic) |

### Indexes & Performance

**Spatial Indexes** (PostGIS GIST):

- `Region.geojson`
- `Zone.geojson`
- `Woreda.geojson`

**Composite Indexes**:

- `SatelliteObservation(woredaId, observationDate)` - Time-series queries
- `RiskAssessment(woredaId, assessmentDate)` - Latest risk lookups
- `SensorReading(sensorId, recordedAt)` - IoT telemetry
- `Alert(woredaId, severity)` - Alert filtering

---

## API Specification

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

Most endpoints require JWT authentication via `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "data": { ... },
  "message": "Optional message",
  "error": "Error details (if success=false)"
}
```

---

### Authentication Endpoints

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "phoneNumber": "+251911223344",
  "fullName": "Abebe Bikila",
  "password": "SecurePassword123!",
  "role": "FARMER",
  "preferredLang": "am",
  "woredaId": "uuid-of-woreda"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "phoneNumber": "+251911223344",
      "fullName": "Abebe Bikila",
      "role": "FARMER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "phoneNumber": "+251911223344",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "user-uuid",
      "fullName": "Abebe Bikila",
      "role": "FARMER",
      "preferredLang": "am"
    }
  }
}
```

---

### Boundaries Endpoints

#### Get All Regions

```http
GET /boundaries/regions

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "region-uuid",
      "code": "ET-OR",
      "nameEn": "Oromia",
      "nameAm": "ኦሮሚያ"
    }
  ]
}
```

#### Get Woredas by Zone

```http
GET /boundaries/woredas?zoneId={zone-uuid}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "woreda-uuid",
      "nameEn": "Bishoftu",
      "nameAm": "ብሾፍቱ",
      "centerLat": 8.7523,
      "centerLng": 38.9785
    }
  ]
}
```

---

### Farm Endpoints

#### Register Farm

```http
POST /farms
Authorization: Bearer <token>
Content-Type: application/json

{
  "farmName": "Bishoftu Wheat Plot A",
  "woredaId": "woreda-uuid",
  "areaHectares": 2.5,
  "primaryCrop": "Wheat",
  "latitude": 8.7523,
  "longitude": 38.9785,
  "polygonGeojson": {
    "type": "Polygon",
    "coordinates": [[
      [38.978, 8.752],
      [38.980, 8.752],
      [38.980, 8.755],
      [38.978, 8.755],
      [38.978, 8.752]
    ]]
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "farm-uuid",
    "farmName": "Bishoftu Wheat Plot A",
    "userId": "user-uuid",
    "woredaId": "woreda-uuid"
  }
}
```

#### Get User Farms

```http
GET /farms
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "farm-uuid",
      "farmName": "Bishoftu Wheat Plot A",
      "areaHectares": 2.5,
      "primaryCrop": "Wheat",
      "latitude": 8.7523,
      "longitude": 38.9785
    }
  ]
}
```

---

### Risk Assessment Endpoints

#### Get Woreda Risk Assessment

```http
GET /risk-assessments/woreda/{woreda-id}
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "woredaId": "woreda-uuid",
    "assessmentDate": "2026-08-13T00:00:00Z",
    "compositeRiskLevel": "HIGH",
    "compositeScore": 0.74,
    "hazards": {
      "drought": {
        "riskLevel": "HIGH",
        "spi30Day": -1.65,
        "spi90Day": -1.82
      },
      "flood": {
        "riskLevel": "LOW",
        "dischargeAnomaly": 0.12
      },
      "locust": {
        "riskLevel": "CRITICAL",
        "nearestSwarmKm": 14.2
      },
      "vegetation": {
        "riskLevel": "MODERATE",
        "ndviAnomaly": -0.18
      }
    },
    "recommendations": {
      "en": "Prepare supplemental irrigation. Inspect boundaries for locust hopper bands.",
      "am": "ተጨማሪ መስኖ ያዘጋጁ። የበረሃ አንበጣ መንጋ ስለተስተዋለ ጥንቃቄ ያድርጉ።"
    }
  }
}
```

---

### Alert Endpoints

#### Get User Alerts

```http
GET /alerts
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "alert-uuid",
      "hazardType": "DROUGHT",
      "severity": "HIGH",
      "titleAm": "የድርቅ ማስጠንቀቂያ",
      "messageAm": "ላለፉት 3 አስርት ቀናት ከባድ የዝናብ እጥረት ተመዝግቧል።",
      "createdAt": "2026-08-13T08:30:00Z"
    }
  ]
}
```

---

### WebSocket Events

**Connection:**

```javascript
const socket = io('http://localhost:5000');
socket.emit('subscribe:woreda', woredaId);
```

**Event: `risk:updated`**

```json
{
  "woredaId": "woreda-uuid",
  "hazardType": "DROUGHT",
  "riskLevel": "CRITICAL",
  "messageEn": "Severe rainfall deficit detected.",
  "messageAm": "ከባድ የዝናብ እጥረት ተመዝግቧል።"
}
```

**Event: `alert:new`**

```json
{
  "alertId": "alert-uuid",
  "woredaId": "woreda-uuid",
  "severity": "HIGH",
  "titleAm": "የድርቅ ማስጠንቀቂያ",
  "messageAm": "ተጨማሪ መስኖ ያዘጋጁ።"
}
```

---

## Data Ingestion Pipeline

### Connector Architecture

Each connector implements a standard interface:

```javascript
class BaseConnector {
  async fetch() {
    /* Fetch from external API */
  }
  async normalize() {
    /* Standardize data format */
  }
  async persist() {
    /* Save to database */
  }
}
```

### Data Sources & Schedule

| Source     | Connector                     | Schedule        | Data Type                              |
| ---------- | ----------------------------- | --------------- | -------------------------------------- |
| CHIRPS     | `chirpsConnector.js`          | Daily 03:00 UTC | Rainfall (0.05° resolution)            |
| NASA POWER | `nasaPowerConnector.js`       | Daily 01:00 UTC | Temperature, humidity, solar radiation |
| Open-Meteo | `openMeteoConnector.js`       | Hourly          | Weather forecasts (16-day)             |
| GloFAS     | `glofasConnector.js`          | Daily 04:00 UTC | River discharge forecasts              |
| MODIS      | `modisNdviConnector.js`       | 16-day          | 250m NDVI composite                    |
| Sentinel-2 | `sentinel2NdviConnector.js`   | 5-day           | 10m high-res NDVI                      |
| Sentinel-1 | `sentinel1Connector.js`       | On-demand       | SAR flood mapping                      |
| FAO Locust | `faoLocustConnector.js`       | Daily 06:00 UTC | Locust swarm locations                 |
| SoilGrids  | `soilgridsConnector.js`       | Static          | Soil properties                        |
| FAO WaPOR  | `faoWaporConnector.js`        | Monthly         | Evapotranspiration                     |
| FEWS NET   | `fewsNetConnector.js`         | Monthly         | Food security indicators               |
| NOAA CPC   | `noaaCpcSeasonalConnector.js` | Monthly         | Seasonal outlooks                      |

### BullMQ Job Queue

Jobs are defined in `src/ingestion/jobs/` and registered in `scheduler.js`:

```javascript
// Example job definition
ingestionQueue.add(
  'pullChirpsRainfall',
  {},
  {
    repeat: { pattern: '0 3 * * *' }, // Daily at 03:00 UTC
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  }
);
```

**Features:**

- Automatic retry with exponential backoff
- Dead-letter queue for failed jobs
- Rate limiting to prevent API throttling
- Job priority management
- Redis-backed persistence

---

## Risk Calculation Engine

### 1. Drought Risk - Standardized Precipitation Index (SPI)

**Algorithm**: `spiCalculator.js`

SPI quantifies precipitation anomalies using Gamma distribution fitting:

1. Fit rainfall data to Gamma distribution:

   ```
   g(x) = (1 / (β^α * Γ(α))) * x^(α-1) * e^(-x/β)
   ```

   Where:
   - α = shape parameter
   - β = scale parameter
   - Γ(α) = gamma function

2. Transform to standard normal distribution to get SPI value

**Classification:**

| SPI Range      | Classification | System Level |
| -------------- | -------------- | ------------ |
| ≥ +2.00        | Extremely Wet  | LOW          |
| -0.99 to +0.99 | Near Normal    | LOW          |
| -1.00 to -1.49 | Moderately Dry | MODERATE     |
| -1.50 to -1.99 | Severely Dry   | HIGH         |
| ≤ -2.00        | Extremely Dry  | CRITICAL     |

**Implementation:**

- 30-day rolling window for short-term drought
- 90-day rolling window for seasonal drought
- Historical baseline: 30-year climatology

---

### 2. Flood Risk - GloFAS Discharge Evaluation

**Algorithm**: `floodRiskEvaluator.js`

Compares forecasted river discharge against return period thresholds:

```
Risk Level = f(Q_forecast, Q_threshold)
```

**Thresholds:**

- `Q ≥ Q_20` → CRITICAL (20-year flood)
- `Q ≥ Q_5` → HIGH (5-year flood)
- `Q ≥ Q_2` → MODERATE (2-year flood)
- `Q < Q_2` → LOW (normal flow)

**River Basins Monitored:**

- Awash River
- Blue Nile (Abbay)
- Omo River

---

### 3. Vegetation Stress - Vegetation Condition Index (VCI)

**Algorithm**: `vegetationStressAnalyzer.js`

VCI calculates NDVI deviation from historical range:

```
VCI = ((NDVI - NDVI_min) / (NDVI_max - NDVI_min)) × 100
```

**Classification:**

- `VCI < 20%` → CRITICAL (Severe stress)
- `VCI < 35%` → HIGH (Moderate stress)
- `VCI < 50%` → MODERATE (Mild stress)
- `VCI ≥ 50%` → LOW (Normal vegetation)

**Baseline:** 10-year historical NDVI maximum and minimum

---

### 4. Locust Risk - Spatial Proximity

**Algorithm**: `locustZoneMatcher.js`

Uses Turf.js for geospatial analysis:

1. Get active locust swarm polygons from FAO
2. Check intersection with woreda boundaries
3. Calculate minimum distance to nearest swarm
4. Apply buffer zones (25km radius)

**Classification:**

- `Swarm inside woreda` → CRITICAL
- `Distance < 25km` → HIGH
- `Distance < 50km` → MODERATE
- `Distance ≥ 50km` → LOW

---

### 5. Multi-Hazard Composite Risk

**Algorithm**: `riskAggregator.js`

Weighted aggregation of individual hazard scores:

```
R_composite = (0.35 × R_drought) + (0.25 × R_flood) +
              (0.25 × R_locust) + (0.15 × R_vegetation)
```

**Weights Rationale:**

- Drought: 35% (primary concern in Ethiopia)
- Flood: 25% (significant damage potential)
- Locust: 25% (rapid crop destruction)
- Vegetation: 15% (indicator, not direct cause)

**Final Classification:**

```
R_composite ≥ 0.75 → CRITICAL
R_composite ≥ 0.50 → HIGH
R_composite ≥ 0.25 → MODERATE
R_composite < 0.25 → LOW
```

---

## Alert Delivery System

### Multi-Channel Strategy

```
Alert Generated → Router → Channel Selection → Delivery
```

### Delivery Channels

#### 1. WebSocket (Socket.IO)

**Use Case:** Real-time updates for connected mobile/web clients

**Implementation:**

```javascript
io.to(`woreda:${woredaId}`).emit('alert:new', {
  alertId,
  severity,
  titleAm,
  messageAm,
});
```

**Advantages:**

- Instant delivery
- Two-way communication
- Low latency

---

#### 2. Push Notifications (Firebase FCM)

**Use Case:** Mobile app users (even when app is closed)

**Implementation:**

```javascript
admin.messaging().send({
  token: deviceToken,
  notification: {
    title: alert.titleAm,
    body: alert.messageAm,
  },
  data: { alertId, hazardType, severity },
});
```

---

#### 3. SMS (Africa's Talking)

**Use Case:** Feature phone users, critical alerts

**Implementation:**

```javascript
africastalking.SMS.send({
  to: ['+251911223344'],
  message: smsTemplate,
  from: 'AgriEtech',
});
```

**SMS Templates:**

- Drought: `droughtAlert.am.txt`
- Flood: `floodAlert.am.txt`
- Locust: `locustAlert.am.txt`

---

#### 4. USSD (*804#)

**Use Case:** 2G feature phone users, interactive queries

**Menu Structure:**

```
*804#
├── 1. Weather Forecast
├── 2. Active Alerts
├── 3. Report Locust
└── 4. Crop Advice
```

**Implementation:** Session-based state machine

---

### Channel Selection Logic

```javascript
if (user.hasSmartphone && user.isOnline) {
  → WebSocket + FCM
} else if (user.phoneNumber && severity >= HIGH) {
  → SMS
} else {
  → USSD (pull-based)
}
```

---

## Installation & Setup

### Prerequisites

- Node.js 18+ or 20+
- Docker Desktop (for PostgreSQL + Redis)
- Git
- 4GB RAM minimum
- 10GB disk space

### Step-by-Step Installation

#### 1. Clone Repository

```bash
git clone https://github.com/your-org/agrietech-backend.git
cd agrietech-backend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings (see [Configuration](#configuration) section)

#### 4. Start Infrastructure

```bash
docker compose up -d
```

This starts:

- PostgreSQL 15 with PostGIS (port 5432)
- Redis 7 (port 6379)

#### 5. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

#### 6. Seed Data (Optional)

```bash
# Load Ethiopian administrative boundaries
node scripts/loadHdxBoundaries.js

# Seed demo farms
node scripts/seedDemoFarms.js
```

#### 7. Start Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:5000`

---

## Configuration

### Environment Variables

Create `.env` file with the following:

```env
# Application
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://agrietech_user:agrietech_password@localhost:5432/agrietech_db

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=7d

# Africa's Talking
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_USERNAME=your_username
AFRICAS_TALKING_SENDER_ID=AgriEtech

# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# External APIs (Optional - connectors will skip if not provided)
PLANT_ID_API_KEY=your_plantid_key
NASA_EARTHDATA_TOKEN=your_nasa_token
COPERNICUS_API_KEY=your_copernicus_key

# Logging
LOG_LEVEL=info
```

### Docker Compose Configuration

The `docker-compose.yml` defines local infrastructure:

```yaml
services:
  postgres:
    image: postgis/postgis:15-3.3
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: agrietech_user
      POSTGRES_PASSWORD: agrietech_password
      POSTGRES_DB: agrietech_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
```

---

## Deployment

### Production Considerations

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use managed PostgreSQL (AWS RDS, Azure Database)
3. **Redis**: Use managed Redis (AWS ElastiCache, Redis Cloud)
4. **Process Management**: Use PM2 or Kubernetes
5. **Reverse Proxy**: Use Nginx or AWS ALB
6. **SSL/TLS**: Enable HTTPS
7. **Monitoring**: Set up logging and metrics
8. **Backups**: Regular database backups

### Docker Production Build

```bash
# Build image
docker build -t agrietech-backend:latest .

# Run container
docker run -d \
  --name agrietech-api \
  -p 5000:5000 \
  --env-file .env.production \
  agrietech-backend:latest
```

### PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start src/server.js --name agrietech-backend

# Enable startup script
pm2 startup
pm2 save
```

### Health Checks

```bash
# HTTP health endpoint
curl http://localhost:5000/health

# Expected response
{
  "status": "UP",
  "service": "AgriEtech Backend",
  "timestamp": "2026-08-14T...",
  "uptimeSeconds": 12345
}
```

---

## Development Guide

### Project Structure

```
agrietech-backend/
├── src/
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── utils/               # Utility functions
│   ├── modules/             # API feature modules
│   ├── ingestion/           # Data ingestion system
│   ├── processing/          # Risk calculation engine
│   ├── delivery/            # Alert delivery system
│   ├── app.js              # Express app setup
│   └── server.js           # Application entry point
├── prisma/
│   └── schema.prisma        # Database schema
├── scripts/                 # Utility scripts
├── tests/                   # Test files
├── docker-compose.yml       # Local infrastructure
├── Dockerfile              # Production container
└── package.json
```

### Development Scripts

```bash
# Development with hot-reload
npm run dev

# Production mode
npm start

# Code quality
npm run lint              # ESLint check
npm run format            # Prettier format

# Database
npx prisma studio         # GUI for database
npx prisma migrate dev    # Create migration
npx prisma generate       # Generate Prisma client

# Testing
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Adding New Features

#### 1. Create Module Structure

```bash
mkdir -p src/modules/new-feature
cd src/modules/new-feature
touch routes.js controller.js service.js
```

#### 2. Implement Routes

```javascript
// routes.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, controller.create);

module.exports = router;
```

#### 3. Implement Controller

```javascript
// controller.js
const service = require('./service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.findAll();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
```

#### 4. Implement Service

```javascript
// service.js
const { prisma } = require('../../config/db');

exports.findAll = async () => {
  return await prisma.yourModel.findMany();
};
```

#### 5. Register Routes

```javascript
// src/app.js
const newFeatureRoutes = require('./modules/new-feature/routes');
app.use('/api/v1/new-feature', newFeatureRoutes);
```

### Testing Guidelines

```javascript
// tests/modules/new-feature/controller.test.js
const request = require('supertest');
const app = require('../../../src/app');

describe('New Feature API', () => {
  it('should return all items', async () => {
    const response = await request(app)
      .get('/api/v1/new-feature')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Code Style

- **ES6+** syntax (async/await, arrow functions)
- **camelCase** for variables and functions
- **PascalCase** for classes
- **UPPER_SNAKE_CASE** for constants
- **2 spaces** indentation
- **Single quotes** for strings
- **Semicolons** required

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request on GitHub
```

---

## Troubleshooting

### Common Issues

**Issue: Database connection fails**

```
Error: Can't reach database server
```

Solution:

```bash
# Check if PostgreSQL is running
docker ps

# Restart containers
docker compose restart postgres
```

**Issue: Redis connection fails**

```
Error: Redis connection refused
```

Solution:

```bash
# Check Redis status
docker logs agrietech-redis

# Restart Redis
docker compose restart redis
```

**Issue: BullMQ jobs not running**

```
Jobs remain in queue but don't process
```

Solution:

```bash
# Check Redis is accessible
redis-cli ping

# Restart application
npm run dev
```

---

## Support & Contributing

### Getting Help

- Review this README thoroughly
- Check `/scripts` folder for utility scripts
- Inspect Prisma schema for database structure
- Review existing module implementations

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Ensure linting passes
5. Submit pull request with clear description

---

## License

Proprietary - AgriEtech Development Team

All rights reserved. This software is the property of the AgriEtech Development Team and may not be distributed, modified, or used without explicit permission.

---

## Project Information

**Version**: 1.0.0
**Last Updated**: August 2026
**Maintained By**: AgriEtech Development Team
**Node.js Version**: 18+ or 20+
**Database**: PostgreSQL 15 + PostGIS 3.3
