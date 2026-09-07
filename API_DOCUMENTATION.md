# AgriEtech Backend API Documentation

Welcome to the AgriEtech Multi-Hazard Early Warning Platform API documentation.

The comprehensive API Specification and reference guide is maintained in:
👉 **[docs/API_SPECIFICATION.md](file:///docs/API_SPECIFICATION.md)**

---

## Quick Reference Summary

### Core Platform Architecture
- **Base URL:** `http://localhost:5000/api/v1` (Development) / `https://agrietech.onrender.com/api/v1` (Production)
- **Protocol:** RESTful JSON & Socket.io WebSocket Gateway
- **Auth Standards:** RFC 7519 Bearer JWT (`Authorization: Bearer <token>`) & IoT Sensor Token (`x-sensor-api-key`)

### Endpoints Overview

| Module | Base Path | Description | Authentication |
| :--- | :--- | :--- | :--- |
| **System Health** | `/health` | Liveness and readiness probes | Public |
| **Authentication** | `/api/v1/auth` | Login, register, token refresh, OTP, password recovery | Public / Bearer Token |
| **Boundaries** | `/api/v1/boundaries` | OCHA HDX Ethiopian regions, zones, woredas, and GIS GeoJSON | Public / Bearer Token |
| **Farms** | `/api/v1/farms` | Farmer plot registry, polygon GIS containment validation, GeoJSON export | Bearer Token (Farmer/Admin) |
| **Sensors** | `/api/v1/sensors` | IoT telemetry ingestion, sensor registration, Firebase sync | Bearer Token / Sensor Key |
| **Satellite** | `/api/v1/satellite-observations` | NASA POWER & Open-Meteo climate records | Bearer Token |
| **Risk Assessments**| `/api/v1/risk-assessments` | Multi-hazard composite scoring & statistics | Bearer Token |
| **Alerts** | `/api/v1/alerts` | Multi-hazard alerts (Drought, Flood, Pest, Disease, Frost, Heat) | Bearer Token |
| **AI Disease** | `/api/v1/disease-diagnosis` | Multi-Engine (Plant.id v3 + Pl@ntNet v2 + Perenual + Gemini & OpenRouter AI) visual crop pathogen diagnosis | Bearer Token (Farmer) |
| **Analytics** | `/api/v1/analytics` | National agricultural dashboard, spatial map aggregation, advisories | Bearer Token |
| **AI Voice** | `/api/v1/ai` | Amharic/English voice reasoning & phonetic Text-to-Speech | Bearer Token |
| **Ingestion** | `/api/v1/ingestion` | Automated pull connectors (NASA, FAO, Open-Meteo) & queue stats | Bearer Token (Officer/Admin) |
| **USSD Delivery** | `/api/v1/delivery/ussd` | Offline USSD telecom gateway integration | Public / Telecom Gateway |
| **Admin** | `/api/v1/admin` | System user management, role governance, audit logs | Bearer Token (Admin) |

### WebSocket Real-Time Gateway
Connect to `ws://localhost:5000` (or `wss://agrietech.onrender.com`)
- Rooms: `alerts:national`, `risk:woreda:<id>`, `telemetry:<sensorId>`
- Events: `new_alert`, `risk_updated`, `telemetry_reading`

For comprehensive payload schemas, response structures, and sample cURL requests, see **[docs/API_SPECIFICATION.md](file:///docs/API_SPECIFICATION.md)**.
