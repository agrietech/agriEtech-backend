# AgriEtech Backend API Documentation

**Base URL:** \http://localhost:5000\ (Development)  
**Production:** \https://agrietech.onrender.com\  
**Version:** 1.0.0  
**Last Updated:** August 21, 2026

---

## 📋 Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Farm Management APIs](#farm-management-apis)
3. [Risk Assessment APIs](#risk-assessment-apis)
4. [Disease Diagnosis APIs](#disease-diagnosis-apis)
5. [Satellite Observation APIs](#satellite-observation-apis)
6. [IoT Sensor APIs](#iot-sensor-apis)
7. [Alert Management APIs](#alert-management-apis)
8. [Analytics & Dashboard APIs](#analytics--dashboard-apis)
9. [Boundary/Region APIs](#boundaryregion-apis)
10. [Admin Management APIs](#admin-management-apis)
11. [AI Voice/Chat APIs](#ai-voicechat-apis)
12. [Data Ingestion APIs](#data-ingestion-apis)

---

## 🔐 Authentication

All protected endpoints require Bearer token in Authorization header:

\\\
Authorization: Bearer <JWT_TOKEN>
\\\

### Role Hierarchy
- \FARMER\ - Basic farm management
- \DEVELOPMENT_AGENT\ - Support farmers
- \WOREDA_OFFICER\ - Manage woreda level
- \RESEARCHER\ - Read-only access to all data
- \ADMIN\ - Full system access

---

## 1️⃣ Authentication APIs

### POST /api/v1/auth/register
**Register new user**

\\\json
Request Body:
{
  "phoneNumber": "+251911234567",
  "fullName": "Abraham Amogne",
  "email": "abraham@example.com",
  "password": "SecurePass123",
  "role": "FARMER",
  "woredaId": "uuid-here",
  "preferredLang": "am"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "+251911234567",
      "fullName": "Abraham Amogne",
      "email": "abraham@example.com",
      "role": "FARMER",
      "woredaId": "uuid-here"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
\\\

### POST /api/v1/auth/login
**User login**

\\\json
Request Body:
{
  "phoneNumber": "+251911234567",
  "password": "SecurePass123"
}

Response (200):
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "fullName": "Abraham Amogne", "role": "FARMER" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
\\\

### POST /api/v1/auth/logout
**Logout user** (Protected)

\\\json
Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
\\\

### GET /api/v1/auth/me
**Get current user** (Protected)

\\\json
Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "phoneNumber": "+251911234567",
    "fullName": "Abraham Amogne",
    "email": "abraham@example.com",
    "role": "FARMER",
    "woredaId": "uuid",
    "createdAt": "2026-08-19T10:30:00.000Z"
  }
}
\\\

### POST /api/v1/auth/forgot-password
**Request password reset**

\\\json
Request Body:
{
  "email": "abraham@example.com"
}

Response (200):
{
  "success": true,
  "message": "Password reset link sent to email"
}
\\\

### POST /api/v1/auth/reset-password/:token
**Reset password with token**

\\\json
Request Body:
{
  "password": "NewSecurePass123"
}

Response (200):
{
  "success": true,
  "message": "Password reset successfully"
}
\\\

---

## 2️⃣ Farm Management APIs

### POST /api/v1/farms
**Create new farm** (Protected: FARMER+)

\\\json
Request Body:
{
  "name": "Abraham's Farm",
  "woredaId": "uuid",
  "userId": "uuid",
  "location": {
    "type": "Point",
    "coordinates": [38.7469, 9.0320]
  },
  "polygon": {
    "type": "Polygon",
    "coordinates": [[[38.7, 9.0], [38.8, 9.0], [38.8, 9.1], [38.7, 9.1], [38.7, 9.0]]]
  },
  "areaSqMeters": 50000,
  "cropTypes": ["WHEAT", "BARLEY"]
}

Response (201):
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Abraham's Farm",
    "areaSqMeters": 50000,
    "cropTypes": ["WHEAT", "BARLEY"],
    "createdAt": "2026-08-19T10:30:00.000Z"
  }
}
\\\

### GET /api/v1/farms
**List all farms** (Protected)

Query Parameters:
- \userId\ - Filter by user
- \woredaId\ - Filter by woreda
- \page\ - Page number (default: 1)
- \limit\ - Items per page (default: 20)

\\\json
Response (200):
{
  "success": true,
  "data": {
    "farms": [...],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
\\\

### GET /api/v1/farms/:id
**Get farm details** (Protected)

\\\json
Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Abraham's Farm",
    "owner": { "id": "uuid", "fullName": "Abraham Amogne" },
    "woreda": { "id": "uuid", "nameEn": "Addis Ababa" },
    "location": { "type": "Point", "coordinates": [38.7469, 9.0320] },
    "polygon": { "type": "Polygon", "coordinates": [...] },
    "areaSqMeters": 50000,
    "cropTypes": ["WHEAT", "BARLEY"],
    "sensors": [],
    "createdAt": "2026-08-19T10:30:00.000Z"
  }
}
\\\

### PUT /api/v1/farms/:id
**Update farm** (Protected: Owner/ADMIN)

\\\json
Request Body:
{
  "name": "Abraham's Updated Farm",
  "cropTypes": ["WHEAT", "TEFF"]
}

Response (200):
{
  "success": true,
  "data": { ...updated farm }
}
\\\

### DELETE /api/v1/farms/:id
**Delete farm** (Protected: Owner/ADMIN)

\\\json
Response (200):
{
  "success": true,
  "message": "Farm deleted successfully"
}
\\\

---

## 3️⃣ Risk Assessment APIs

### POST /api/v1/risk-assessments/evaluate
**Evaluate multi-hazard risk** (Protected: WOREDA_OFFICER+)

\\\json
Request Body:
{
  "woredaId": "uuid",
  "assessmentDate": "2026-08-19"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "uuid",
    "woredaId": "uuid",
    "assessmentDate": "2026-08-19T00:00:00.000Z",
    "droughtRisk": {
      "level": "HIGH",
      "spi30day": -1.8,
      "spi90day": -1.5,
      "message": "Severe rainfall deficit"
    },
    "floodRisk": {
      "level": "LOW",
      "discharge": 12.5,
      "threshold": 15.0
    },
    "locustRisk": {
      "level": "MODERATE",
      "distance": 45,
      "swarmCount": 2
    },
    "vegetationStress": {
      "level": "MODERATE",
      "vci": 35.2,
      "ndvi": 0.42
    },
    "compositeRisk": {
      "score": 0.65,
      "level": "HIGH"
    },
    "recommendations": ["Prepare supplemental irrigation", "Monitor locust movement"]
  }
}
\\\

### GET /api/v1/risk-assessments/woreda/:woredaId
**Get latest risk assessment for woreda** (Protected)

\\\json
Response (200):
{
  "success": true,
  "data": { ...risk assessment object }
}
\\\

### GET /api/v1/risk-assessments/woreda/:woredaId/history
**Get risk history** (Protected)

Query: \?startDate=2026-07-01&endDate=2026-08-19&limit=30\

---

## 4️⃣ Disease Diagnosis APIs

### POST /api/v1/disease-diagnosis
**Diagnose crop disease from image** (Protected: FARMER+)

\\\
Content-Type: multipart/form-data

Fields:
- image: File (JPG/PNG, max 10MB)
- farmId: UUID
- cropType: String (optional)
- language: String (en/am, default: en)

Response (201):
{
  "success": true,
  "data": {
    "id": "uuid",
    "farmId": "uuid",
    "crop": {
      "scientificName": "Triticum aestivum",
      "commonNames": ["Wheat", "ስንዴ"],
      "probability": 0.97
    },
    "isHealthy": false,
    "diseases": [
      {
        "name": "Stem Rust (Puccinia graminis)",
        "probability": 0.94,
        "cause": "Fungal pathogen",
        "description": "Destructive rust infecting wheat stems",
        "treatment": {
          "chemical": "Tebuconazole fungicide",
          "biological": "Resistant varieties",
          "cultural": "Remove infected plants"
        }
      }
    ],
    "aiAnalysis": {
      "geminiInsights": "Based on image analysis...",
      "recommendedActions": ["Apply fungicide", "Monitor spread"]
    },
    "imageUrl": "https://storage.../diagnosis_uuid.jpg",
    "createdAt": "2026-08-19T11:30:00.000Z"
  }
}
\\\

### GET /api/v1/disease-diagnosis/farm/:farmId
**Get diagnosis history for farm** (Protected)

\\\json
Response (200):
{
  "success": true,
  "data": {
    "diagnoses": [...],
    "statistics": {
      "totalDiagnoses": 15,
      "healthyCount": 8,
      "diseasedCount": 7
    }
  }
}
\\\

---

## 5️⃣ Satellite Observation APIs

### GET /api/v1/satellite-observations/woreda/:woredaId
**Get satellite data for woreda** (Protected)

Query:
- \source\: CHIRPS | OPEN_METEO | NASA_POWER | MODIS
- \startDate\: YYYY-MM-DD
- \endDate\: YYYY-MM-DD

\\\json
Response (200):
{
  "success": true,
  "data": {
    "observations": [
      {
        "id": "uuid",
        "woredaId": "uuid",
        "source": "CHIRPS",
        "observationDate": "2026-08-19",
        "parameters": {
          "precipitation": 2.4,
          "temperature": 22.3,
          "humidity": 65
        }
      }
    ]
  }
}
\\\

---

## 6️⃣ IoT Sensor APIs

### POST /api/v1/sensors/register
**Register IoT sensor** (Protected: FARMER+)

\\\json
Request Body:
{
  "hardwareId": "SENSOR_ETH_001",
  "farmId": "uuid",
  "sensorType": "SOIL_MOISTURE",
  "location": { "lat": 9.0320, "lng": 38.7469 }
}

Response (201):
{
  "success": true,
  "data": {
    "id": "uuid",
    "hardwareId": "SENSOR_ETH_001",
    "status": "ACTIVE"
  }
}
\\\

### POST /api/v1/sensors/telemetry
**Submit sensor telemetry** (Protected/Public with API key)

\\\json
Request Body:
{
  "hardwareId": "SENSOR_ETH_001",
  "farmId": "uuid",
  "timestamp": "2026-08-19T11:30:00Z",
  "soilMoisture": 45.2,
  "soilTemp": 22.3,
  "ambientTemp": 26.1,
  "humidity": 65.2,
  "rainfallMm": 2.4,
  "batteryLevel": 87
}

Response (201):
{
  "success": true,
  "data": { "id": "uuid", "recorded": true }
}
\\\

### GET /api/v1/sensors/:hardwareId/latest
**Get latest sensor reading** (Protected)

### GET /api/v1/sensors/:hardwareId/telemetry
**Get sensor telemetry history** (Protected)

Query: \?from=2026-08-01&to=2026-08-19&limit=100\

---

## 7️⃣ Alert Management APIs

### POST /api/v1/alerts
**Create alert** (Protected: WOREDA_OFFICER+)

\\\json
Request Body:
{
  "woredaId": "uuid",
  "hazardType": "DROUGHT",
  "severity": "HIGH",
  "titleEn": "Drought Warning",
  "titleAm": "የድርቅ ማስጠንቀቂያ",
  "messageEn": "Severe rainfall deficit detected",
  "messageAm": "ከባድ የዝናብ እጥረት ተመዝግቧል",
  "sendSMS": true,
  "sendPush": true
}

Response (201):
{
  "success": true,
  "data": {
    "id": "uuid",
    "alertSent": true,
    "recipientsCount": 5420
  }
}
\\\

### GET /api/v1/alerts
**List alerts** (Protected)

Query:
- \woredaId\ - Filter by woreda
- \hazardType\ - DROUGHT | FLOOD | LOCUST | DISEASE
- \severity\ - LOW | MODERATE | HIGH | CRITICAL
- \ctive\ - true | false

---

## 8️⃣ Analytics & Dashboard APIs

### GET /api/v1/analytics/dashboard
**National dashboard summary** (Protected: WOREDA_OFFICER+)

\\\json
Response (200):
{
  "success": true,
  "data": {
    "totalFarms": 156789,
    "totalFarmers": 142350,
    "activeAlerts": 23,
    "criticalWoredas": 12,
    "riskDistribution": {
      "LOW": 450,
      "MODERATE": 280,
      "HIGH": 58,
      "CRITICAL": 12
    },
    "recentActivity": [...]
  }
}
\\\

### GET /api/v1/analytics/temporal-trends
**Get temporal trends** (Protected: RESEARCHER+)

Query: \?metric=rainfall&startDate=2026-01-01&endDate=2026-08-19\

### POST /api/v1/analytics/ai-insights
**Generate AI insights from graph** (Protected: WOREDA_OFFICER+)

\\\json
Request Body:
{
  "graphData": [10, 15, 12, 8, 5],
  "metric": "rainfall",
  "language": "am"
}

Response (200):
{
  "success": true,
  "data": {
    "insights": "በ90 ቀናት ውስጥ...",
    "recommendations": [...]
  }
}
\\\

---

## 9️⃣ Boundary/Region APIs

### GET /api/v1/boundaries/regions
**List all regions** (Public)

\\\json
Response (200):
{
  "success": true,
  "data": [
    { "id": "uuid", "nameEn": "Oromia", "nameAm": "ኦሮሚያ", "code": "OR" }
  ]
}
\\\

### GET /api/v1/boundaries/zones
**List zones** (Public)

Query: \?regionId=uuid\

### GET /api/v1/boundaries/woredas
**List woredas** (Public)

Query: \?zoneId=uuid\

### GET /api/v1/boundaries/woreda/:id
**Get woreda details with GeoJSON** (Public)

\\\json
Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "nameEn": "Addis Ababa",
    "nameAm": "አዲስ አበባ",
    "geojson": { "type": "Polygon", "coordinates": [...] },
    "centerLat": 9.0320,
    "centerLng": 38.7469,
    "zone": { "id": "uuid", "nameEn": "Addis Ababa" },
    "region": { "id": "uuid", "nameEn": "Addis Ababa" }
  }
}
\\\

---

## 🔟 Admin Management APIs

### GET /admin/dashboard
**Sky-Blue Enterprise Interactive Dashboard UI** (Protected: ADMIN)
- Returns complete HTML interactive admin dashboard.

### GET /api/v1/admin/overview
**System overview & metrics** (Protected: ADMIN)
```json
Response (200):
{
  "success": true,
  "data": {
    "metrics": {
      "totalUsers": 125,
      "totalFarms": 85,
      "totalSensors": 42,
      "activeSensors": 38,
      "totalAlerts": 12,
      "totalDiagnoses": 56
    },
    "recentAlerts": [...],
    "recentAuditLogs": [...]
  }
}
```

### 👥 User CRUD APIs (`/api/v1/admin/users`)
- **GET `/api/v1/admin/users`**: List paginated users (`?page=1&limit=20&search=abebe`)
- **POST `/api/v1/admin/users`**: Create user (`{fullName, phoneNumber, email, role, woredaId}`)
- **PUT `/api/v1/admin/users/:id`**: Update user details (`{fullName, phoneNumber, email, role}`)
- **PATCH `/api/v1/admin/users/:id/role`**: Update role (`{role: "DEVELOPMENT_AGENT"}`)
- **PATCH `/api/v1/admin/users/:id/status`**: Update status (`{isEmailVerified: true}`)
- **DELETE `/api/v1/admin/users/:id`**: Delete user account

### 🌾 Farm Plot CRUD APIs (`/api/v1/admin/farms`)
- **GET `/api/v1/admin/farms`**: List farm plots (`?page=1&limit=20`)
- **POST `/api/v1/admin/farms`**: Register farm plot (`{farmName, primaryCrop, areaHectares, latitude, longitude}`)
- **PUT `/api/v1/admin/farms/:id`**: Update farm plot
- **DELETE `/api/v1/admin/farms/:id`**: Delete farm plot

### 📡 IoT Sensor Network CRUD APIs (`/api/v1/admin/sensors`)
- **GET `/api/v1/admin/sensors`**: List IoT sensors
- **POST `/api/v1/admin/sensors`**: Register sensor hardware (`{hardwareId, sensorType}`)
- **DELETE `/api/v1/admin/sensors/:id`**: Delete sensor hardware

### ⚠️ Alert Dispatch & Management (`/api/v1/admin/alerts`)
- **GET `/api/v1/admin/alerts`**: List active early warning alerts
- **POST `/api/v1/admin/broadcast-alert`**: Dispatch emergency warning (`{woredaId, hazardType, severity, titleEn, messageEn}`)
- **DELETE `/api/v1/admin/alerts/:id`**: Dismiss / Delete alert

### 🔬 Crop Disease Diagnoses (`/api/v1/admin/diagnoses`)
- **GET `/api/v1/admin/diagnoses`**: List crop diagnosis history
- **DELETE `/api/v1/admin/diagnoses/:id`**: Delete diagnosis record

### 🛡️ System Health & Audit Trail
- **GET `/api/v1/admin/system/health`**: Deep memory, CPU, DB & Redis ping health
- **POST `/api/v1/admin/ingestion/trigger`**: Trigger pipeline pull (`{jobType: "pullChirpsRainfall"}`)
- **GET `/api/v1/admin/audit-logs`**: Get audit logs (`?limit=50`)

---

## 1️⃣1️⃣ AI Voice/Chat APIs

### POST /api/v1/ai/voice/inquire
**Voice inquiry (speech-to-text + AI)** (Protected: FARMER+)

\\\
Content-Type: multipart/form-data

Fields:
- audio: File (MP3/WAV, max 5MB)
- language: String (en/am)

Response (200):
{
  "success": true,
  "data": {
    "transcription": "What is the weather forecast?",
    "aiResponse": "The 7-day forecast shows...",
    "audioUrl": "https://storage.../response.mp3"
  }
}
\\\

### POST /api/v1/ai/voice/synthesize
**Text-to-speech** (Protected)

\\\json
Request Body:
{
  "text": "Your farm requires irrigation",
  "language": "am"
}

Response (200):
{
  "success": true,
  "data": {
    "audioUrl": "https://storage.../tts_uuid.mp3"
  }
}
\\\

---

## 1️⃣2️⃣ Data Ingestion APIs

### GET /api/v1/ingestion/connectors
**List available data connectors** (Protected: ADMIN)

\\\json
Response (200):
{
  "success": true,
  "data": [
    { "key": "chirpsConnector", "name": "CHIRPS_RAINFALL" },
    { "key": "openMeteoConnector", "name": "OPEN_METEO" },
    { "key": "nasaPowerConnector", "name": "NASA_POWER" }
  ]
}
\\\

### GET /api/v1/ingestion/health
**Test API connector health** (Protected: ADMIN)

\\\json
Response (200):
{
  "success": true,
  "totalConnectors": 10,
  "results": {
    "openMeteo": { "status": "WORKING", "requiresKey": false },
    "soilGrids": { "status": "WORKING", "requiresKey": false },
    "plantId": { "status": "CONFIGURED", "requiresKey": true }
  }
}
\\\

### POST /api/v1/ingestion/trigger
**Manually trigger data ingestion** (Protected: ADMIN)

\\\json
Request Body:
{
  "source": "CHIRPS",
  "woredaId": "uuid"
}

Response (201):
{
  "success": true,
  "message": "Ingestion job scheduled",
  "data": { "jobId": "job_123456" }
}
\\\

---

## ⚙️ System APIs

### GET /health
**Health check** (Public)

\\\json
Response (200):
{
  "status": "OK",
  "uptime": 86400,
  "timestamp": "2026-08-19T12:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "version": "1.0.0"
  }
}
\\\

### GET /liveness
**Kubernetes liveness probe** (Public)

### GET /readiness
**Kubernetes readiness probe** (Public)

---

## 📡 WebSocket Events

Connect: \ws://localhost:5000\ or \wss://agrietech.onrender.com\

### Client → Server Events

\\\javascript
// Join woreda channel
socket.emit('join:woreda', { woredaId: 'uuid', token: 'jwt_token' });

// Leave woreda channel
socket.emit('leave:woreda', { woredaId: 'uuid' });
\\\

### Server → Client Events

\\\javascript
// Risk assessment updated
socket.on('risk:updated', (data) => {
  // { woredaId, compositeRisk, timestamp }
});

// New alert created
socket.on('alert:new', (data) => {
  // { alertId, hazardType, severity, message }
});

// Sensor telemetry received
socket.on('sensor:telemetry', (data) => {
  // { sensorId, soilMoisture, temperature }
});
\\\

---

## 🔒 Error Responses

All errors follow this format:

\\\json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
\\\

**HTTP Status Codes:**
- \200\ - Success
- \201\ - Created
- \400\ - Bad Request
- \401\ - Unauthorized
- \403\ - Forbidden
- \404\ - Not Found
- \409\ - Conflict
- \429\ - Too Many Requests
- \500\ - Internal Server Error

---

## 🚀 Rate Limits

- **General APIs:** 100 requests / 15 minutes
- **Authentication:** 5 requests / 15 minutes
- **Image Upload:** 10 requests / hour
- **Admin APIs:** 200 requests / 15 minutes

---

## 📊 Pagination

List endpoints support pagination:

Query Parameters:
- \page\ - Page number (default: 1)
- \limit\ - Items per page (default: 20, max: 100)
- \sortBy\ - Field to sort by
- \order\ - \sc\ or \desc\

Response includes:
\\\json
{
  "pagination": {
    "total": 1500,
    "page": 1,
    "limit": 20,
    "pages": 75,
    "hasNext": true,
    "hasPrev": false
  }
}
\\\

---

## 🌐 Multi-Language Support

All text responses support language parameter:
- \en\ - English
- \m\ - Amharic (አማርኛ)
- \om\ - Afaan Oromoo (planned)

Use query parameter: \?lang=am\ or header: \Accept-Language: am\

---

**End of API Documentation**
