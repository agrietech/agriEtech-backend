# AgriEtech Multi-Hazard Early Warning Platform - API Specification

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api/v1` (Production: `https://agrietech.onrender.com/api/v1`)  
**Format:** JSON (`Content-Type: application/json`)  
**Authentication:** HTTP Bearer Token (`Authorization: Bearer <jwt_token>`)

---

## Table of Contents

1. [Global Principles & Standards](#1-global-principles--standards)
2. [Authentication & User Management (`/auth`)](#2-authentication--user-management-auth)
3. [Administrative Boundaries (`/boundaries`)](#3-administrative-boundaries-boundaries)
4. [Farm Plot Registry (`/farms`)](#4-farm-plot-registry-farms)
5. [IoT Sensor Telemetry (`/sensors`)](#5-iot-sensor-telemetry-sensors)
6. [Satellite & Climate Observations (`/satellite-observations`)](#6-satellite--climate-observations-satellite-observations)
7. [Multi-Hazard Risk Assessments (`/risk-assessments`)](#7-multi-hazard-risk-assessments-risk-assessments)
8. [Early Warning Alerts (`/alerts`)](#8-early-warning-alerts-alerts)
9. [AI Crop Disease Diagnosis (`/disease-diagnosis`)](#9-ai-crop-disease-diagnosis-disease-diagnosis)
10. [Analytics & Agronomic Advisories (`/analytics`)](#10-analytics--agronomic-advisories-analytics)
11. [AI Voice & Multimodal Assistant (`/ai`)](#11-ai-voice--multimodal-assistant-ai)
12. [Data Ingestion Pipeline (`/ingestion`)](#12-data-ingestion-pipeline-ingestion)
13. [USSD Interactive Menu (`/delivery/ussd`)](#13-ussd-interactive-menu-deliveryussd)
14. [Admin & Audit Control (`/admin`)](#14-admin--audit-control-admin)
15. [WebSocket Real-Time Gateway](#15-websocket-real-time-gateway)
16. [Error Handling & Status Codes](#16-error-handling--status-codes)

---

## 1. Global Principles & Standards

### Response Format
All API endpoints return standard JSON envelopes:

#### Success Response (200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive string"
}
```

#### Error Response (4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Detailed error description",
    "details": []
  }
}
```

### Roles & RBAC Matrix
- `FARMER`: Farm registration, sensor telemetry view, alert subscription, disease diagnosis, USSD access.
- `DEVELOPMENT_AGENT`: Multi-farm advisory, woreda threat reporting, community alert dispatch.
- `WOREDA_OFFICER`: District risk assessment evaluation, emergency alert broadcast.
- `RESEARCHER`: High-resolution satellite download, climate dataset exports.
- `ADMIN`: Full system configuration, manual pipeline triggers, audit logs.

### Rate Limiting Limits
- **Global**: 100 requests per 15-minute window per IP.
- **Auth**: 5 requests per 15-minute window (login/register).
- **USSD**: 30 requests per minute per IP.
- **Telemetry**: 60 requests per minute per sensor ID.

---

## 2. Authentication & User Management (`/auth`)

### 2.1 Register User
- **Method:** `POST /api/v1/auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "phoneNumber": "+251911223344",
    "fullName": "Abebe Bikila",
    "password": "SecurePassword123!",
    "email": "farmer@agrietech.et",
    "role": "FARMER",
    "preferredLang": "am",
    "woredaId": "woreda_adama_01"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_78912",
        "phoneNumber": "+251911223344",
        "fullName": "Abebe Bikila",
        "role": "FARMER",
        "emailVerified": false
      },
      "token": "eyJhbGciOiJIUzI1NiIsIn..."
    }
  }
  ```

### 2.2 User Login
- **Method:** `POST /api/v1/auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "phoneNumber": "+251911223344",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "ref_9823471928374",
      "user": {
        "id": "usr_78912",
        "fullName": "Abebe Bikila",
        "role": "FARMER"
      }
    }
  }
  ```

### 2.3 Refresh Access Token
- **Method:** `POST /api/v1/auth/refresh-token`
- **Auth:** Public
- **Request Body:** `{"refreshToken": "ref_9823471928374"}`

### 2.4 Get Profile
- **Method:** `GET /api/v1/auth/me`
- **Auth:** Bearer Token required

---

## 3. Administrative Boundaries (`/boundaries`)

### 3.1 Get All Regions
- **Method:** `GET /api/v1/boundaries/regions`
- **Auth:** Public
- **Response (200 OK):** Returns array of Ethiopian regional states with Amharic names and GeoJSON bounds.

### 3.2 Get Zones by Region
- **Method:** `GET /api/v1/boundaries/zones?regionId={regionId}`
- **Auth:** Public

### 3.3 Get Woredas by Zone
- **Method:** `GET /api/v1/boundaries/woredas?zoneId={zoneId}`
- **Auth:** Public

### 3.4 Get Single Woreda Details
- **Method:** `GET /api/v1/boundaries/woredas/:id`
- **Auth:** Public

---

## 4. Farm Plot Registry (`/farms`)

### 4.1 Register Farm Plot
- **Method:** `POST /api/v1/farms`
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "farmName": "Adama Wheat Plot 1",
    "woredaId": "woreda_adama_01",
    "areaHectares": 2.5,
    "primaryCrop": "Wheat",
    "latitude": 8.54,
    "longitude": 39.27,
    "polygonGeojson": {
      "type": "Polygon",
      "coordinates": [[[39.27, 8.54], [39.28, 8.54], [39.28, 8.55], [39.27, 8.55], [39.27, 8.54]]]
    }
  }
  ```

### 4.2 List User Farms
- **Method:** `GET /api/v1/farms`
- **Auth:** Bearer Token

### 4.3 Get Farm Details
- **Method:** `GET /api/v1/farms/:id`
- **Auth:** Bearer Token

---

## 5. IoT Sensor Telemetry (`/sensors`)

### 5.1 Register Sensor Device
- **Method:** `POST /api/v1/sensors`
- **Auth:** Bearer Token
- **Request Body:** `{"farmId": "farm_123", "sensorType": "SOIL_MOISTURE_STATION", "hardwareId": "ESP32_FARM_01"}`

### 5.2 Post Sensor Telemetry Reading
- **Method:** `POST /api/v1/sensors/telemetry`
- **Auth:** Public / Sensor API Key
- **Request Body:**
  ```json
  {
    "sensorId": "sns_019283",
    "soilMoisturePct": 18.5,
    "soilTempC": 24.2,
    "ambientTempC": 28.1,
    "humidityPct": 45.0,
    "batteryVoltage": 3.92
  }
  ```

### 5.3 Retrieve Farm Telemetry History
- **Method:** `GET /api/v1/sensors/farm/:farmId`
- **Auth:** Bearer Token

---

## 6. Satellite & Climate Observations (`/satellite-observations`)

### 6.1 Query Woreda Observation Time-Series
- **Method:** `GET /api/v1/satellite-observations/woreda/:woredaId?source=CHIRPS&startDate=2026-08-01`
- **Auth:** Bearer Token

### 6.2 Ingest Satellite Record
- **Method:** `POST /api/v1/satellite-observations/ingest`
- **Auth:** Bearer Token (`RESEARCHER` / `ADMIN`)

---

## 7. Multi-Hazard Risk Assessments (`/risk-assessments`)

### 7.1 Trigger Woreda Evaluation
- **Method:** `POST /api/v1/risk-assessments/evaluate`
- **Auth:** Bearer Token
- **Request Body:** `{"woredaId": "woreda_adama_01"}`

### 7.2 Get Latest Woreda Risk Assessment
- **Method:** `GET /api/v1/risk-assessments/woreda/:woredaId`
- **Auth:** Bearer Token

---

## 8. Early Warning Alerts (`/alerts`)

### 8.1 Create Early Warning Alert
- **Method:** `POST /api/v1/alerts`
- **Auth:** Bearer Token (`WOREDA_OFFICER` / `ADMIN`)

### 8.2 List Active Alerts
- **Method:** `GET /api/v1/alerts?severity=HIGH`
- **Auth:** Bearer Token

---

## 9. AI Crop Disease Diagnosis (`/disease-diagnosis`)

### 9.1 Diagnose Crop Image
- **Method:** `POST /api/v1/disease-diagnosis/diagnose`
- **Auth:** Bearer Token
- **Payload:** Multipart form-data (`image` file upload) OR JSON with `imageUrl` and `cropType`.

### 9.2 Get Diagnosis History
- **Method:** `GET /api/v1/disease-diagnosis/farm/:farmId`
- **Auth:** Bearer Token

---

## 10. Analytics & Agronomic Advisories (`/analytics`)

### 10.1 Get Executive Dashboard Analytics
- **Method:** `GET /api/v1/analytics/dashboard`
- **Auth:** Bearer Token

### 10.2 Get Regional Risk Breakdown
- **Method:** `GET /api/v1/analytics/regional-breakdown`
- **Auth:** Bearer Token

### 10.3 Get Temporal Trends
- **Method:** `GET /api/v1/analytics/temporal-trends?timeframe=DAILY&woredaId=woreda_adama_01`
- **Auth:** Bearer Token

### 10.4 Get Agronomic Advisory
- **Method:** `GET /api/v1/analytics/agronomic-advisories?cropType=WHEAT&season=MEHER`
- **Auth:** Bearer Token

---

## 11. AI Voice & Multimodal Assistant (`/ai`)

### 11.1 Voice Inquiry Processing
- **Method:** `POST /api/v1/ai/voice-inquiry`
- **Auth:** Bearer Token
- **Request Body:** `{"userQuestion": "የበቆሎ አባጨጓሬን እንዴት ማጥፋት ይቻላል?", "language": "am"}`

### 11.2 Text-to-Speech Generation
- **Method:** `POST /api/v1/ai/text-to-speech`
- **Auth:** Bearer Token

---

## 12. Data Ingestion Pipeline (`/ingestion`)

### 12.1 List Ingestion Connectors Status
- **Method:** `GET /api/v1/ingestion/connectors`
- **Auth:** Bearer Token

### 12.2 Manual Pipeline Ingestion Pull
- **Method:** `POST /api/v1/ingestion/pull`
- **Auth:** Bearer Token (`ADMIN`)

---

## 13. USSD Interactive Menu (`/delivery/ussd`)

### 13.1 USSD Callback Handler
- **Method:** `POST /api/v1/delivery/ussd`
- **Auth:** Public (Africa's Talking Callback)
- **Request Body:** `sessionId={id}&serviceCode=*804#&phoneNumber=+251911223344&text=1*1`
- **Response Format:** Plain text string prefixed with `CON` (continue) or `END` (terminate).

---

## 14. Admin & Audit Control (`/admin`)

### 14.1 Web Dashboard UI
- **Method:** `GET /admin/dashboard`
- **Auth:** Web Session / Admin Cookie

### 14.2 Trigger Ingestion Job
- **Method:** `POST /api/v1/admin/ingestion/trigger`
- **Auth:** Bearer Token (`ADMIN`)

### 14.3 Emergency Alert Broadcast
- **Method:** `POST /api/v1/admin/broadcast-alert`
- **Auth:** Bearer Token (`ADMIN`)

---

## 15. WebSocket Real-Time Gateway

- **Connection URL:** `ws://localhost:5000` (Socket.IO client)
- **Rooms:** `woreda:{woredaId}`, `farm:{farmId}`
- **Emitted Events:**
  - `risk:updated`: Broadcast when multi-hazard risk assessment finishes.
  - `alert:new`: Broadcast when emergency early warning is dispatched.
  - `telemetry:new`: Broadcast when IoT sensor posts new readings.

---

## 16. Error Handling & Status Codes

| Code | Name | Description |
|---|---|---|
| `200` | OK | Request processed successfully. |
| `201` | Created | Resource successfully registered/created. |
| `400` | Bad Request | Missing or invalid parameter validation. |
| `401` | Unauthorized | Missing or expired JWT bearer token. |
| `403` | Forbidden | Insufficient RBAC role permissions. |
| `404` | Not Found | Resource or endpoint route does not exist. |
| `409` | Conflict | Duplicate entity (e.g. phone number exists). |
| `429` | Too Many Requests | Rate limit threshold exceeded. |
| `500` | Internal Error | Server error handled by global error logger. |
