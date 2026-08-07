# AgriEtech Backend System Design Document

**Document Version:** 1.0  
**Date:** August 7, 2026  
**Project:** AgriEtech Backend API  
**Technology Stack:** Node.js, Express.js, PostgreSQL  

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Aug 7, 2026 | Abraham Amogne, Abenezer Endrias | Initial backend design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [API Design](#4-api-design)
5. [Database Design](#5-database-design)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [IoT Integration](#7-iot-integration)
8. [Business Logic Modules](#8-business-logic-modules)
9. [External Integrations](#9-external-integrations)
10. [Error Handling](#10-error-handling)
11. [Security Architecture](#11-security-architecture)
12. [Performance Optimization](#12-performance-optimization)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Backend Task Assignment](#14-backend-task-assignment)

---

## 1. Executive Summary

### 1.1 Purpose

This document provides a comprehensive design specification for the AgriEtech backend system, detailing architecture, API endpoints, database schema, business logic, and implementation guidelines.

### 1.2 Design Goals

- **Scalability**: Support 10,000+ concurrent users
- **Reliability**: 99.5% uptime with automated failover
- **Performance**: API response time < 2 seconds (95th percentile)
- **Security**: Enterprise-grade authentication and data protection

- **Maintainability**: Clean architecture with comprehensive documentation
- **Extensibility**: Modular design for future feature additions

### 1.3 Key Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Express    │◄─────┤    Mobile    │                   │
│  │   REST API   │      │     Apps     │                   │
│  └──────┬───────┘      └──────────────┘                   │
│         │                                                   │
│    ┌────┴────────────────────────┐                        │
│    │                              │                         │
│  ┌─▼────────┐  ┌────────────┐  ┌─▼──────────┐            │
│  │   Auth   │  │  Business  │  │   Data     │            │
│  │  Layer   │  │   Logic    │  │   Layer    │            │
│  └──────────┘  └─────┬──────┘  └──────┬─────┘            │
│                      │                 │                   │
│         ┌────────────┼─────────────────┤                  │
│         │            │                 │                   │
│  ┌──────▼───┐  ┌────▼─────┐  ┌────────▼────┐             │
│  │ External │  │  Rule     │  │ PostgreSQL  │             │
│  │   APIs   │  │  Engine   │  │  Database   │             │
│  └──────────┘  └───────────┘  └─────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

### 2.1 Architectural Pattern

**Layered Architecture (N-Tier)**

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│              (Express.js Routes & Middleware)           │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                        │
│           (Business Logic & Domain Services)            │
├─────────────────────────────────────────────────────────┤
│                    Data Access Layer                    │
│          (Repository Pattern & ORM Queries)             │
├─────────────────────────────────────────────────────────┤
│                    Data Layer                           │
│              (PostgreSQL Database)                      │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Project Structure

```
AgriEtech-backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.js
│   │   ├── env.js
│   │   └── constants.js
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.js
│   │   ├── farm.controller.js
│   │   ├── sensor.controller.js
│   │   ├── weather.controller.js
│   │   └── disease.controller.js
│   ├── services/               # Business logic
│   │   ├── auth.service.js
│   │   ├── farm.service.js
│   │   ├── sensor.service.js
│   │   ├── weather.service.js
│   │   ├── disease.service.js
│   │   ├── recommendation.service.js
│   │   └── notification.service.js
│   ├── repositories/           # Data access
│   │   ├── user.repository.js
│   │   ├── farm.repository.js
│   │   ├── sensor.repository.js
│   │   └── alert.repository.js
│   ├── models/                 # Database models (Sequelize)
│   │   ├── User.js
│   │   ├── Farm.js
│   │   ├── Crop.js
│   │   ├── SensorDevice.js
│   │   ├── SensorReading.js
│   │   ├── WeatherData.js
│   │   └── DiseaseAlert.js
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   └── rateLimiter.middleware.js
│   ├── routes/                 # API routes
│   │   ├── auth.routes.js
│   │   ├── farm.routes.js
│   │   ├── sensor.routes.js
│   │   ├── weather.routes.js
│   │   └── disease.routes.js
│   ├── utils/                  # Utility functions
│   │   ├── jwt.util.js
│   │   ├── otp.util.js
│   │   ├── logger.util.js
│   │   └── validator.util.js
│   ├── workers/                # Background jobs
│   │   ├── weatherSync.worker.js
│   │   ├── alertProcessor.worker.js
│   │   └── dataAggregation.worker.js
│   └── app.js                  # Express app initialization
├── migrations/                 # Database migrations
├── seeders/                    # Seed data
├── tests/                      # Test files
│   ├── unit/
│   └── integration/
├── docs/                       # API documentation
├── .env.example
├── package.json
└── README.md
```

---

## 3. Technology Stack

### 3.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18.x LTS | Runtime environment |
| **Express.js** | 4.18.x | Web framework |
| **PostgreSQL** | 14.x | Primary database |
| **Sequelize** | 6.x | ORM |
| **Redis** | 7.x | Caching & session storage |

### 3.2 Key Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **jsonwebtoken** | 9.x | JWT authentication |
| **bcrypt** | 5.x | Password hashing |
| **express-validator** | 7.x | Request validation |
| **winston** | 3.x | Logging |
| **node-cron** | 3.x | Scheduled jobs |
| **axios** | 1.x | HTTP client (external APIs) |
| **firebase-admin** | 11.x | Push notifications |
| **twilio** | 4.x | SMS notifications |
| **joi** | 17.x | Schema validation |
| **helmet** | 7.x | Security headers |
| **cors** | 2.x | Cross-origin resource sharing |
| **dotenv** | 16.x | Environment configuration |

### 3.3 Development Tools

| Tool | Purpose |
|------|---------|
| **Jest** | Unit & integration testing |
| **Supertest** | API testing |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Nodemon** | Development server |
| **Swagger** | API documentation |

---

## 4. API Design

### 4.1 API Versioning

**Base URL:** `https://api.AgriEtech.et/api/v1`

**Versioning Strategy:** URL-based versioning
- v1: Initial MVP release
- v2: Future enhancements (preserved v1 for backward compatibility)

### 4.2 Authentication Endpoints

#### POST /auth/register
**Description:** Register new user with role and location hierarchy

**Request:**
```json
{
  "phoneNumber": "+251912345678",
  "name": "Abebe Kebede",
  "password": "SecurePass123!",
  "role": "farmer",
  "language": "am",
  "region": "Oromia",
  "zone": "East Shewa",
  "woreda": "Adama",
  "kebele": "Kebele 01"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "data": {
    "userId": "uuid-here",
    "otpExpiresAt": "2026-08-07T15:05:00Z",
    "requiresApproval": false
  }
}
```

**Note:** For roles other than 'farmer', `requiresApproval` will be true and account will be pending until approved by higher authority.


#### POST /auth/verify-otp
**Description:** Verify OTP and complete registration

**Request:**
```json
{
  "userId": "uuid-here",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-here",
    "user": {
      "id": "uuid-here",
      "name": "Abebe Kebede",
      "phoneNumber": "+251912345678",
      "language": "am"
    }
  }
}
```

#### POST /auth/login
**Description:** User login

**Request:**
```json
{
  "phoneNumber": "+251912345678",
  "password": "SecurePass123!"
}
```

#### POST /auth/refresh-token
**Description:** Refresh access token

#### POST /auth/logout
**Description:** Invalidate tokens

### 4.3 Farm Management Endpoints

#### POST /farms
**Description:** Create new farm

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "name": "Abebe's Main Farm",
  "latitude": 9.0054,
  "longitude": 38.7636,
  "sizeHectares": 1.5,
  "boundaryPolygon": {
    "type": "Polygon",
    "coordinates": [[[38.76, 9.00], [38.77, 9.00], [38.77, 9.01], [38.76, 9.01], [38.76, 9.00]]]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "farm-uuid",
    "name": "Abebe's Main Farm",
    "latitude": 9.0054,
    "longitude": 38.7636,
    "sizeHectares": 1.5,
    "status": "active",
    "createdAt": "2026-08-07T14:30:00Z"
  }
}
```

#### GET /farms
**Description:** Get all farms for authenticated user

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "farm-uuid",
      "name": "Abebe's Main Farm",
      "sizeHectares": 1.5,
      "crops": [
        {"type": "teff", "plantingDate": "2026-06-15", "stage": "vegetative"}
      ],
      "sensors": 2,
      "healthScore": 85,
      "activeAlerts": 1
    }
  ],
  "meta": {
    "total": 1
  }
}
```

#### GET /farms/:farmId
**Description:** Get farm details

#### PUT /farms/:farmId
**Description:** Update farm information

#### DELETE /farms/:farmId
**Description:** Archive farm (soft delete)

### 4.4 Crop Management Endpoints

#### POST /farms/:farmId/crops
**Description:** Add crop to farm

**Request:**
```json
{
  "cropType": "teff",
  "plantingDate": "2026-06-15",
  "expectedHarvestDate": "2026-11-15"
}
```

#### GET /farms/:farmId/crops
**Description:** Get all crops for a farm

#### PUT /crops/:cropId
**Description:** Update crop information (stage, harvest)

### 4.5 Sensor Endpoints

#### POST /sensors/register
**Description:** Register new sensor device

**Request:**
```json
{
  "deviceId": "ESP32-MAC-ADDRESS",
  "farmId": "farm-uuid",
  "deviceType": "sim80l",
  "firmwareVersion": "1.0.0"
}
```

#### POST /sensors/readings
**Description:** Submit sensor readings (IoT device endpoint)

**Headers:** 
- `X-Device-ID: ESP32-MAC-ADDRESS`
- `X-Device-Token: device-jwt-token`

**Request:**
```json
{
  "timestamp": "2026-08-07T14:30:00Z",
  "readings": {
    "soilMoisture": 45.2,
    "temperature": 28.5,
    "humidity": 65.3,
    "nitrogen": 120.5,
    "phosphorus": 45.8,
    "potassium": 180.2
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Reading recorded",
  "data": {
    "readingId": "uuid",
    "alertsTriggered": ["moisture_low"]
  }
}
```

#### GET /sensors/:deviceId/readings
**Description:** Get sensor readings history

**Query Parameters:**
- `startDate`: ISO 8601 date
- `endDate`: ISO 8601 date
- `interval`: `15min`, `hour`, `day` (aggregation level)
- `limit`: Max records (default 100)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deviceId": "ESP32-MAC-ADDRESS",
    "readings": [
      {
        "timestamp": "2026-08-07T14:30:00Z",
        "soilMoisture": 45.2,
        "temperature": 28.5,
        "humidity": 65.3
      }
    ],
    "aggregation": "15min",
    "count": 96
  }
}
```

#### GET /sensors/:deviceId/status
**Description:** Get device status and health

### 4.6 Weather Endpoints

#### GET /weather/:farmId/current
**Description:** Get current weather for farm location

**Response (200):**
```json
{
  "success": true,
  "data": {
    "farmId": "farm-uuid",
    "timestamp": "2026-08-07T14:30:00Z",
    "temperature": 28.5,
    "humidity": 65,
    "windSpeed": 12.5,
    "precipitation24h": 5.2,
    "weatherDescription": "Partly cloudy",
    "weatherCode": 2
  }
}
```

#### GET /weather/:farmId/forecast
**Description:** Get 7-day weather forecast

**Query Parameters:**
- `days`: Number of days (1-7, default 7)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "farmId": "farm-uuid",
    "forecast": [
      {
        "date": "2026-08-08",
        "tempMax": 32,
        "tempMin": 18,
        "precipitationProb": 30,
        "precipitationSum": 2.5,
        "hourly": [
          {
            "time": "2026-08-08T06:00:00Z",
            "temperature": 20,
            "precipitation": 0
          }
        ]
      }
    ]
  }
}
```

#### GET /weather/:farmId/alerts
**Description:** Get active weather alerts

### 4.7 Disease Management Endpoints

#### GET /diseases
**Description:** Get disease library

**Query Parameters:**
- `cropType`: Filter by crop
- `search`: Search term
- `language`: Response language

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "disease-uuid",
      "name": "Wheat Yellow Rust",
      "cropTypes": ["wheat"],
      "symptoms": "Yellow-orange pustules on leaves...",
      "riskConditions": {
        "tempMin": 10,
        "tempMax": 20,
        "humidityMin": 80
      },
      "prevention": "Use resistant varieties...",
      "treatment": "Apply fungicide...",
      "images": ["url1", "url2"]
    }
  ]
}
```

#### GET /diseases/:farmId/risk
**Description:** Get current disease risk for farm

**Response (200):**
```json
{
  "success": true,
  "data": {
    "farmId": "farm-uuid",
    "assessmentTime": "2026-08-07T14:30:00Z",
    "risks": [
      {
        "disease": "Wheat Yellow Rust",
        "cropId": "crop-uuid",
        "riskLevel": "high",
        "confidence": 85,
        "triggers": ["high_humidity", "optimal_temp"],
        "recommendation": "Apply fungicide within 48 hours",
        "urgency": "critical"
      }
    ]
  }
}
```

#### POST /diseases/report
**Description:** Farmer reports disease observation

### 4.8 Recommendation Endpoints

#### GET /recommendations/:farmId
**Description:** Get daily recommendations for farm

**Response (200):**
```json
{
  "success": true,
  "data": {
    "farmId": "farm-uuid",
    "generatedAt": "2026-08-07T14:30:00Z",
    "recommendations": [
      {
        "id": "rec-uuid",
        "priority": "critical",
        "category": "irrigation",
        "title": "Irrigate immediately",
        "description": "Soil moisture at 18%, below threshold for teff",
        "action": "Apply 20mm water (2 hours drip irrigation)",
        "reasoning": "Sensor data + crop water requirements",
        "estimatedTime": "2 hours",
        "dueBy": "2026-08-07T18:00:00Z"
      },
      {
        "priority": "warning",
        "category": "fertilizer",
        "title": "Nitrogen deficiency detected",
        "action": "Apply 50kg Urea per hectare"
      }
    ]
  }
}
```

#### POST /recommendations/:recommendationId/complete
**Description:** Mark recommendation as completed

### 4.9 Notification Endpoints

#### GET /notifications
**Description:** Get notification history

#### PUT /notifications/:notificationId/read
**Description:** Mark notification as read

#### PUT /notifications/preferences
**Description:** Update notification preferences

### 4.10 Administrative Endpoints (Role-Based)

#### GET /admin/users
**Description:** List users (filtered by role and location hierarchy)

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `role`: Filter by role (farmer, extension_officer, etc.)
- `region`: Filter by region
- `zone`: Filter by zone
- `woreda`: Filter by woreda
- `kebele`: Filter by kebele
- `status`: Filter by approval status (pending, approved, rejected)
- `page`: Page number
- `limit`: Records per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "name": "Abebe Kebede",
      "phoneNumber": "+251912345678",
      "role": "farmer",
      "region": "Oromia",
      "zone": "East Shewa",
      "woreda": "Adama",
      "kebele": "Kebele 01",
      "isApproved": true,
      "farmsCount": 2,
      "lastLogin": "2026-08-07T14:30:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "pages": 15
  }
}
```

**Access:** Extension Officer (assigned farmers), Woreda Expert (woreda users), Regional Specialist (region users), National Admin (all)

#### PUT /admin/users/:userId/approve
**Description:** Approve user account (for non-farmer roles)

**Request:**
```json
{
  "approved": true,
  "notes": "Verified credentials"
}
```

#### GET /admin/analytics/overview
**Description:** Get analytics dashboard based on user role and jurisdiction

**Response (200) - Extension Officer:**
```json
{
  "success": true,
  "data": {
    "jurisdiction": {
      "type": "kebele",
      "region": "Oromia",
      "zone": "East Shewa",
      "woreda": "Adama",
      "kebele": "Kebele 01"
    },
    "summary": {
      "totalFarmers": 45,
      "totalFarms": 68,
      "activeSensors": 12,
      "activeAlerts": 8
    },
    "alerts": {
      "critical": 2,
      "warning": 6,
      "info": 15
    },
    "diseaseOutbreaks": [
      {
        "diseaseName": "Wheat Yellow Rust",
        "affectedFarms": 5,
        "firstDetected": "2026-08-05T10:00:00Z"
      }
    ],
    "farmerEngagement": {
      "activeToday": 32,
      "activeThisWeek": 41,
      "averageSessionTime": "15 minutes"
    }
  }
}
```

**Response (200) - Woreda Expert (includes multiple kebeles):**
```json
{
  "success": true,
  "data": {
    "jurisdiction": {
      "type": "woreda",
      "region": "Oromia",
      "zone": "East Shewa",
      "woreda": "Adama"
    },
    "summary": {
      "totalFarmers": 450,
      "totalFarms": 680,
      "totalKebeles": 12,
      "extensionOfficers": 15,
      "activeSensors": 120
    },
    "kebeleComparison": [
      {
        "kebele": "Kebele 01",
        "farmers": 45,
        "farms": 68,
        "healthScore": 85
      }
    ],
    "cropDistribution": {
      "teff": 250,
      "maize": 180,
      "wheat": 120,
      "barley": 80
    },
    "resourceAllocation": {
      "sensorsRequested": 25,
      "sensorsApproved": 18,
      "pendingApprovals": 7
    }
  }
}
```

#### POST /admin/advisories
**Description:** Create and send advisory to farmers

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "title": "Heavy Rain Warning",
  "message": "Heavy rain expected in the next 48 hours. Hold irrigation and check field drainage.",
  "imageUrl": "https://...",
  "priority": "urgent",
  "deliveryMethod": "both",
  "scheduledFor": null,
  "targeting": {
    "role": "farmers_only",
    "region": "Oromia",
    "zone": "East Shewa",
    "woreda": "Adama",
    "kebele": null,
    "cropType": "wheat"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "advisoryId": "advisory-uuid",
    "estimatedRecipients": 85,
    "scheduledFor": "2026-08-07T14:35:00Z",
    "status": "sending"
  }
}
```

**Access:** Extension Officer (own kebele), Woreda Expert (own woreda), Regional Specialist (own region), National Admin (all)

#### GET /admin/advisories
**Description:** List sent advisories

#### GET /admin/advisories/:advisoryId/delivery-status
**Description:** Track advisory delivery and read statistics

#### POST /admin/farmers/:farmerId/assign
**Description:** Assign farmer to extension officer

**Request:**
```json
{
  "officerId": "officer-uuid"
}
```

**Access:** Woreda Expert or higher

#### GET /admin/reports/export
**Description:** Export comprehensive reports

**Query Parameters:**
- `type`: report type (farmers, farms, sensors, diseases, performance)
- `format`: export format (pdf, csv, excel)
- `startDate`: Report start date
- `endDate`: Report end date

**Response (200):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://...",
    "expiresAt": "2026-08-07T18:00:00Z",
    "fileSize": "2.5MB"
  }
}
```

#### GET /admin/locations
**Description:** Get Ethiopian administrative locations

**Query Parameters:**
- `type`: Location type (region, zone, woreda, kebele)
- `parentId`: Parent location ID (for hierarchical filtering)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "location-uuid",
      "type": "woreda",
      "name": "Adama",
      "nameAm": "አዳማ",
      "code": "ORM-ESH-ADM",
      "parentId": "zone-uuid",
      "isUrban": true,
      "population": 324000
    }
  ]
}
```

---

## 5. Database Design

### 5.1 Entity-Relationship Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│     User     │1      * │     Farm     │1      * │     Crop     │
│──────────────│◄────────│──────────────│◄────────│──────────────│
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ phone_number │         │ user_id (FK) │         │ farm_id (FK) │
│ password_hash│         │ name         │         │ crop_type    │
│ name         │         │ latitude     │         │ planting_date│
└──────────────┘         │ longitude    │         └──────────────┘
                         └──────┬───────┘
                                │
                                │1
                                │
                                │*
                         ┌──────▼───────┐         ┌──────────────────┐
                         │SensorDevice  │1      * │ SensorReading    │
                         │──────────────│◄────────│──────────────────│
                         │ id (PK)      │         │ id (PK)          │
                         │ device_id    │         │ device_id (FK)   │
                         │ farm_id (FK) │         │ timestamp        │
                         │ device_type  │         │ soil_moisture    │
                         └──────────────┘         │ temperature      │
                                                  │ humidity         │
                                                  └──────────────────┘
```


### 5.2 Database Schema

#### users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN (
    'farmer', 'extension_officer', 'woreda_expert', 
    'regional_specialist', 'national_admin'
  )),
  language VARCHAR(2) DEFAULT 'am' CHECK (language IN ('am', 'om', 'en')),
  profile_photo_url TEXT,
  
  -- Location Hierarchy
  country VARCHAR(50) DEFAULT 'Ethiopia',
  region VARCHAR(100) NOT NULL,
  zone VARCHAR(100),
  woreda VARCHAR(100),
  kebele VARCHAR(100),
  
  -- Approval & Status
  is_approved BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_region ON users(region);
CREATE INDEX idx_users_zone ON users(zone);
CREATE INDEX idx_users_woreda ON users(woreda);
CREATE INDEX idx_users_kebele ON users(kebele);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_approved ON users(is_approved);

-- Trigger to require approval for non-farmer roles
CREATE OR REPLACE FUNCTION check_role_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != 'farmer' THEN
    NEW.is_approved := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_role_approval
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_role_approval();
```

#### farms table
```sql
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  size_hectares DECIMAL(5,2) NOT NULL,
  boundary_polygon JSONB,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farms_user ON farms(user_id);
CREATE INDEX idx_farms_location ON farms(latitude, longitude);
CREATE INDEX idx_farms_status ON farms(status);
```

#### crops table
```sql
CREATE TABLE crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_type VARCHAR(50) NOT NULL CHECK (crop_type IN (
    'teff', 'maize', 'sorghum', 'wheat', 'barley', 'coffee', 'enset', 'chickpea'
  )),
  planting_date DATE NOT NULL,
  expected_harvest_date DATE NOT NULL,
  actual_harvest_date DATE,
  growth_stage VARCHAR(20) DEFAULT 'seedling' CHECK (growth_stage IN (
    'seedling', 'vegetative', 'flowering', 'maturation', 'harvest'
  )),
  yield_kg DECIMAL(8,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crops_farm ON crops(farm_id);
CREATE INDEX idx_crops_type ON crops(crop_type);
CREATE INDEX idx_crops_stage ON crops(growth_stage);
```

#### sensor_devices table
```sql
CREATE TABLE sensor_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(100) UNIQUE NOT NULL,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN (
    'sim80l', 'dht22', 'npk_rs485', 'combo'
  )),
  status VARCHAR(20) DEFAULT 'online' CHECK (status IN (
    'online', 'offline', 'battery_low', 'error'
  )),
  firmware_version VARCHAR(20),
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  last_seen TIMESTAMP,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_sensor_device_id ON sensor_devices(device_id);
CREATE INDEX idx_sensor_farm ON sensor_devices(farm_id);
CREATE INDEX idx_sensor_status ON sensor_devices(status);
```

#### sensor_readings table
```sql
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES sensor_devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  soil_moisture DECIMAL(5,2),
  temperature DECIMAL(4,2),
  humidity DECIMAL(5,2),
  nitrogen DECIMAL(6,2),
  phosphorus DECIMAL(6,2),
  potassium DECIMAL(6,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_readings_device ON sensor_readings(device_id);
CREATE INDEX idx_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_readings_device_time ON sensor_readings(device_id, timestamp DESC);

-- Partition by month for performance
CREATE TABLE sensor_readings_2026_08 PARTITION OF sensor_readings
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
```

#### weather_data table
```sql
CREATE TABLE weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  temperature DECIMAL(4,2),
  humidity DECIMAL(5,2),
  wind_speed DECIMAL(5,2),
  precipitation_mm DECIMAL(6,2),
  precipitation_probability INTEGER CHECK (precipitation_probability >= 0 AND precipitation_probability <= 100),
  weather_code INTEGER,
  weather_description VARCHAR(100),
  is_forecast BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weather_farm ON weather_data(farm_id);
CREATE INDEX idx_weather_timestamp ON weather_data(timestamp DESC);
CREATE INDEX idx_weather_forecast ON weather_data(is_forecast);
```

#### diseases table (Reference data)
```sql
CREATE TABLE diseases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  scientific_name VARCHAR(150),
  crop_types VARCHAR(50)[] NOT NULL,
  symptoms TEXT NOT NULL,
  risk_conditions JSONB NOT NULL,
  prevention TEXT NOT NULL,
  treatment TEXT NOT NULL,
  images TEXT[],
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diseases_crops ON diseases USING GIN(crop_types);
```

#### disease_alerts table
```sql
CREATE TABLE disease_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
  disease_id UUID NOT NULL REFERENCES diseases(id),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  triggers JSONB,
  recommendation TEXT NOT NULL,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_alerts_farm ON disease_alerts(farm_id);
CREATE INDEX idx_alerts_triggered ON disease_alerts(triggered_at DESC);
CREATE INDEX idx_alerts_status ON disease_alerts(acknowledged, resolved);
```

#### recommendations table
```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('info', 'warning', 'critical')),
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'irrigation', 'fertilizer', 'disease', 'harvest', 'inspection', 'maintenance'
  )),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  action TEXT NOT NULL,
  reasoning TEXT,
  estimated_time_minutes INTEGER,
  due_by TIMESTAMP,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_farm ON recommendations(farm_id);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);
CREATE INDEX idx_recommendations_completed ON recommendations(completed);
```

#### notifications table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'alert', 'warning', 'info', 'reminder'
  )),
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_via VARCHAR(20)[] DEFAULT '{"push"}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

#### otp_verifications table
```sql
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(15) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_phone ON otp_verifications(phone_number);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);
```

---

## 6. Authentication & Authorization

### 6.1 JWT Token Structure

**Access Token Payload:**
```json
{
  "userId": "uuid",
  "phoneNumber": "+251912345678",
  "role": "farmer",
  "type": "access",
  "iat": 1691419200,
  "exp": 1691505600
}
```

**Token Expiry:**
- Access Token: 24 hours
- Refresh Token: 30 days

### 6.2 Authentication Flow

```
Client                  Backend
  │                        │
  ├──Register Request──────►
  │                        ├──Generate OTP
  │                        ├──Store in DB
  │◄───OTP Sent─────────────┤
  │                        │
  ├──Verify OTP Request────►
  │                        ├──Validate OTP
  │                        ├──Create User
  │◄───Tokens Returned──────┤
  │                        │
  ├──API Request + Token───►
  │                        ├──Verify JWT
  │                        ├──Check Expiry
  │◄───Response─────────────┤
```

### 6.3 Middleware Implementation

**auth.middleware.js**
```javascript
const jwt = require('jsonwebtoken');

async function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
      algorithms: ['RS256']
    });
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
}
```

### 6.4 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later'
});

// Strict limiter for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true
});
```

---

## 7. IoT Integration

### 7.1 Device Authentication

**Device Registration Process:**
1. Generate device-specific JWT token (long-lived, 1 year)
2. Store device credentials in database
3. Return token to device during setup
4. Validate token on every reading submission

**Device Token Payload:**
```json
{
  "deviceId": "ESP32-MAC-ADDRESS",
  "farmId": "farm-uuid",
  "type": "device",
  "iat": 1691419200,
  "exp": 1722955200
}
```

### 7.2 Sensor Data Processing Pipeline

```
ESP32 Sensor
     │
     ▼
POST /sensors/readings
     │
     ▼
Validate Request
     │
     ▼
Store in Database
     │
     ├──► Check Thresholds ──► Trigger Alerts
     │
     ├──► Update Farm Status
     │
     └──► Notify Recommendation Engine
```

### 7.3 Data Validation Rules

```javascript
const sensorValidationSchema = {
  soilMoisture: { min: 0, max: 100, unit: '%' },
  temperature: { min: -20, max: 60, unit: '°C' },
  humidity: { min: 0, max: 100, unit: '%' },
  nitrogen: { min: 0, max: 500, unit: 'mg/kg' },
  phosphorus: { min: 0, max: 200, unit: 'mg/kg' },
  potassium: { min: 0, max: 1000, unit: 'mg/kg' }
};
```

### 7.4 Sensor Alert Thresholds

| Parameter | Critical Low | Warning Low | Optimal | Warning High | Critical High |
|-----------|--------------|-------------|---------|--------------|---------------|
| Soil Moisture (%) | <20 | 20-30 | 30-60 | 60-70 | >70 |
| Temperature (°C) | <5 | 5-10 | 10-35 | 35-40 | >40 |
| Humidity (%) | <30 | 30-40 | 40-80 | 80-90 | >90 |
| Nitrogen (mg/kg) | <50 | 50-100 | 100-200 | - | >300 |

---

## 8. Business Logic Modules

### 8.1 Recommendation Engine

**recommendation.service.js**

```javascript
class RecommendationService {
  async generateRecommendations(farmId) {
    const farm = await this.getFarmData(farmId);
    const sensors = await this.getLatestSensorReadings(farmId);
    const weather = await this.getWeatherForecast(farmId);
    const crops = await this.getCrops(farmId);
    
    const recommendations = [];
    
    // Irrigation recommendations
    recommendations.push(...this.analyzeIrrigation(sensors, weather, crops));
    
    // Fertilizer recommendations
    recommendations.push(...this.analyzeFertilizer(sensors, crops));
    
    // Disease risk recommendations
    recommendations.push(...this.analyzeDiseaseRisk(sensors, weather, crops));
    
    // Sort by priority
    return this.prioritize(recommendations);
  }
  
  analyzeIrrigation(sensors, weather, crops) {
    const recommendations = [];
    
    for (const crop of crops) {
      const threshold = this.getCropMoistureThreshold(crop.type, crop.stage);
      const currentMoisture = sensors.soilMoisture;
      
      if (currentMoisture < threshold.critical) {
        recommendations.push({
          priority: 'critical',
          category: 'irrigation',
          title: 'Irrigate immediately',
          description: `Soil moisture at ${currentMoisture}%, below ${threshold.critical}% for ${crop.type}`,
          action: this.calculateIrrigationAmount(crop, currentMoisture, threshold.optimal),
          reasoning: 'Sensor data + crop water requirements'
        });
      }
    }
    
    return recommendations;
  }
}
```

### 8.2 Disease Risk Engine

**disease.service.js**

```javascript
class DiseaseService {
  async assessDiseaseRisk(farmId) {
    const sensors = await this.getLatestSensorReadings(farmId);
    const weather = await this.getCurrentWeather(farmId);
    const crops = await this.getCrops(farmId);
    const diseases = await this.getDiseaseDatabase();
    
    const risks = [];
    
    for (const crop of crops) {
      const cropDiseases = diseases.filter(d => d.cropTypes.includes(crop.type));
      
      for (const disease of cropDiseases) {
        const riskScore = this.calculateRiskScore(
          disease.riskConditions,
          { ...sensors, ...weather },
          crop.stage
        );
        
        if (riskScore.level !== 'low') {
          risks.push({
            disease: disease.name,
            cropId: crop.id,
            riskLevel: riskScore.level,
            confidence: riskScore.confidence,
            triggers: riskScore.triggers,
            recommendation: disease.prevention
          });
        }
      }
    }
    
    return risks;
  }
  
  calculateRiskScore(conditions, currentData, cropStage) {
    let score = 0;
    const triggers = [];
    
    // Temperature check
    if (currentData.temperature >= conditions.tempMin &&
        currentData.temperature <= conditions.tempMax) {
      score += 30;
      triggers.push('optimal_temperature');
    }
    
    // Humidity check
    if (currentData.humidity >= conditions.humidityMin) {
      score += 40;
      triggers.push('high_humidity');
    }
    
    // Crop stage susceptibility
    if (conditions.vulnerableStages?.includes(cropStage)) {
      score += 30;
      triggers.push('vulnerable_stage');
    }
    
    return {
      level: score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low',
      confidence: score,
      triggers
    };
  }
}
```

---

## 9. External Integrations

### 9.1 Open-Meteo Weather API Integration

**weather.service.js**

```javascript
const axios = require('axios');

class WeatherService {
  constructor() {
    this.baseURL = 'https://api.open-meteo.com/v1/forecast';
    this.cache = new Map();
    this.cacheTimeout = 6 * 60 * 60 * 1000; // 6 hours
  }
  
  async getForecast(latitude, longitude) {
    const cacheKey = `${latitude},${longitude}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          latitude,
          longitude,
          current_weather: true,
          hourly: 'temperature_2m,precipitation_probability,relative_humidity_2m',
          daily: 'precipitation_sum,temperature_2m_max,temperature_2m_min',
          forecast_days: 7,
          timezone: 'Africa/Addis_Ababa'
        },
        timeout: 5000
      });
      
      const data = this.transformWeatherData(response.data);
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Weather API error:', error);
      // Return cached data if available, even if expired
      return cached?.data || null;
    }
  }
  
  transformWeatherData(rawData) {
    return {
      current: {
        temperature: rawData.current_weather.temperature,
        windSpeed: rawData.current_weather.windspeed,
        weatherCode: rawData.current_weather.weathercode
      },
      daily: rawData.daily.time.map((date, i) => ({
        date,
        tempMax: rawData.daily.temperature_2m_max[i],
        tempMin: rawData.daily.temperature_2m_min[i],
        precipitationSum: rawData.daily.precipitation_sum[i]
      })),
      hourly: rawData.hourly.time.slice(0, 48).map((time, i) => ({
        time,
        temperature: rawData.hourly.temperature_2m[i],
        precipitationProb: rawData.hourly.precipitation_probability[i],
        humidity: rawData.hourly.relative_humidity_2m[i]
      }))
    };
  }
}
```

### 9.2 Firebase Cloud Messaging

**notification.service.js**

```javascript
const admin = require('firebase-admin');

class NotificationService {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT)
    });
  }
  
  async sendPushNotification(userId, notification) {
    const user = await this.getUserDeviceTokens(userId);
    
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data,
      tokens: user.deviceTokens
    };
    
    try {
      const response = await admin.messaging().sendMulticast(message);
      
      await this.logNotification(userId, notification, 'push', response.successCount > 0);
      
      // Fallback to SMS if push failed
      if (response.successCount === 0 && notification.priority === 'critical') {
        await this.sendSMSFallback(user.phoneNumber, notification);
      }
      
      return response;
    } catch (error) {
      console.error('Push notification error:', error);
      throw error;
    }
  }
  
  async sendSMSFallback(phoneNumber, notification) {
    // Twilio SMS implementation
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    await twilio.messages.create({
      body: `${notification.title}: ${notification.body}`,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    });
  }
}
```

---

## 10. Error Handling

### 10.1 Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "phoneNumber",
        "message": "Phone number must be in format +251XXXXXXXXX"
      }
    ]
  },
  "requestId": "uuid"
}
```

### 10.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTHENTICATION_REQUIRED | 401 | No or invalid auth token |
| INVALID_CREDENTIALS | 401 | Wrong phone/password |
| FORBIDDEN | 403 | Access denied to resource |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Input validation failed |
| DUPLICATE_ENTRY | 409 | Unique constraint violation |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |
| SERVICE_UNAVAILABLE | 503 | External service down |

### 10.3 Global Error Handler

**errorHandler.middleware.js**

```javascript
function errorHandler(err, req, res, next) {
  const requestId = req.id || uuid();
  
  // Log error
  logger.error({
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId
  });
  
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      },
      requestId
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Invalid or expired token'
      },
      requestId
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : err.message
    },
    requestId
  });
}
```

---

## 11. Security Architecture

### 11.1 Security Measures

| Layer | Implementation |
|-------|----------------|
| **Transport** | TLS 1.3, HSTS headers |
| **Authentication** | JWT with RS256, bcrypt (cost 12) |
| **Authorization** | Role-based access control |
| **Input Validation** | Joi schemas, SQL parameterization |
| **Rate Limiting** | 100 req/min per user, 5 req/15min for auth |
| **CORS** | Whitelist mobile app origins |
| **Headers** | Helmet.js security headers |
| **Secrets** | Environment variables, never committed |
| **Audit Logging** | All sensitive operations logged |

### 11.2 Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 12. Performance Optimization

### 12.1 Caching Strategy

| Data Type | Cache Duration | Storage |
|-----------|----------------|---------|
| Weather forecast | 6 hours | Redis |
| Sensor readings (latest) | 5 minutes | Redis |
| Disease library | 24 hours | Redis |
| User profile | 1 hour | Redis |
| Static assets | 30 days | CDN |

### 12.2 Database Optimization

- **Indexing**: All foreign keys, query fields
- **Partitioning**: sensor_readings by month
- **Connection Pooling**: Max 20 connections
- **Query Optimization**: Use EXPLAIN ANALYZE
- **Pagination**: Limit 100 records per request

### 12.3 API Response Optimization

```javascript
// Pagination helper
function paginate(query, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return query.offset(offset).limit(limit);
}

// Field selection (sparse fieldsets)
app.get('/farms', async (req, res) => {
  const fields = req.query.fields?.split(',') || null;
  const farms = await Farm.findAll({
    attributes: fields
  });
});
```

---

## 13. Deployment Architecture

### 13.1 Infrastructure

```
┌─────────────────────────────────────────────┐
│              Load Balancer (Nginx)          │
└───────────────────┬─────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼───────┐       ┌───────▼───────┐
│  Node.js App  │       │  Node.js App  │
│   Instance 1  │       │   Instance 2  │
└───────┬───────┘       └───────┬───────┘
        │                       │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐      ┌───────▼────────┐
│  PostgreSQL    │      │     Redis      │
│    Primary     │      │     Cache      │
└────────────────┘      └────────────────┘
```

### 13.2 Environment Configuration

**.env.production**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/AgriEtech
REDIS_URL=redis://localhost:6379
JWT_PRIVATE_KEY=path/to/private.pem
JWT_PUBLIC_KEY=path/to/public.pem
FIREBASE_SERVICE_ACCOUNT=path/to/firebase-key.json
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
LOG_LEVEL=info
```

---

## 14. Backend Task Assignment

### Abraham Amogne (Project Lead & Backend Developer)

**Week 1-2:**
- [ ] Setup project architecture and folder structure
- [ ] Configure Express.js application with middleware stack
- [ ] Implement JWT authentication system (RS256)
- [ ] Create user registration with OTP verification
- [ ] Setup logging system (Winston)

**Week 3-4:**
- [ ] Develop user management endpoints (CRUD)
- [ ] Implement session management and token refresh
- [ ] Create IoT device registration API
- [ ] Build device authentication system
- [ ] Setup API documentation (Swagger)

**Week 5-6:**
- [ ] Implement sensor data ingestion endpoints
- [ ] Build real-time data processing pipeline
- [ ] Create threshold monitoring system
- [ ] Develop alert triggering mechanism
- [ ] Code review and optimization

### Abenezer Endrias (Backend & Database Specialist)

**Week 1-2:**
- [ ] Design complete PostgreSQL schema
- [ ] Create database migration scripts
- [ ] Setup Sequelize ORM models
- [ ] Implement database seeding (crops, diseases)
- [ ] Configure database connection pooling

**Week 3-4:**
- [ ] Build farm management repository and service layer
- [ ] Implement crop management CRUD operations
- [ ] Integrate Open-Meteo weather API
- [ ] Create weather data caching system (Redis)
- [ ] Build weather alert generation logic

**Week 5-6:**
- [ ] Develop recommendation engine rule-based system
- [ ] Implement disease risk detection algorithm
- [ ] Create historical data aggregation service
- [ ] Optimize database queries and indexing
- [ ] Performance testing and tuning

**Week 7-8:**
- [ ] Build analytics and reporting services
- [ ] Implement data export functionality (CSV, PDF)
- [ ] Create backup and archival scripts
- [ ] Final optimization and stress testing
- [ ] Documentation and knowledge transfer

---

**End of Backend Design Document**

---

**Prepared by:**  
Abraham Amogne (CTC-329-26) - Project Lead  
Abenezer Endrias (CTC-1826-26) - Backend & Database Specialist  

**Review Date:** ___________  
**Approval:** ___________



### Additional Database Tables for Role-Based System

#### ethiopian_locations table
```sql
CREATE TABLE ethiopian_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('region', 'zone', 'woreda', 'kebele')),
  name VARCHAR(100) NOT NULL,
  name_am VARCHAR(100) NOT NULL,
  name_om VARCHAR(100),
  code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Hierarchy
  parent_id UUID REFERENCES ethiopian_locations(id),
  region_id UUID REFERENCES ethiopian_locations(id),
  zone_id UUID REFERENCES ethiopian_locations(id),
  woreda_id UUID REFERENCES ethiopian_locations(id),
  
  -- Metadata
  population INTEGER,
  area_sq_km DECIMAL(10,2),
  is_urban BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_type ON ethiopian_locations(type);
CREATE INDEX idx_locations_name ON ethiopian_locations(name);
CREATE INDEX idx_locations_code ON ethiopian_locations(code);
CREATE INDEX idx_locations_parent ON ethiopian_locations(parent_id);
CREATE INDEX idx_locations_region ON ethiopian_locations(region_id);
CREATE INDEX idx_locations_zone ON ethiopian_locations(zone_id);
CREATE INDEX idx_locations_woreda ON ethiopian_locations(woreda_id);
```

#### advisories table
```sql
CREATE TABLE advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  
  -- Targeting
  target_role VARCHAR(20) DEFAULT 'all' CHECK (target_role IN ('all', 'farmers_only')),
  target_region VARCHAR(100),
  target_zone VARCHAR(100),
  target_woreda VARCHAR(100),
  target_kebele VARCHAR(100),
  target_crop_type VARCHAR(50),
  
  -- Delivery
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  delivery_method VARCHAR(20) DEFAULT 'push' CHECK (delivery_method IN ('push', 'sms', 'both')),
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  
  -- Analytics
  recipients_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_advisories_creator ON advisories(created_by);
CREATE INDEX idx_advisories_region ON advisories(target_region);
CREATE INDEX idx_advisories_zone ON advisories(target_zone);
CREATE INDEX idx_advisories_woreda ON advisories(target_woreda);
CREATE INDEX idx_advisories_scheduled ON advisories(scheduled_for);
CREATE INDEX idx_advisories_sent ON advisories(sent_at);
```

#### advisory_deliveries table
```sql
CREATE TABLE advisory_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisory_id UUID NOT NULL REFERENCES advisories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('push', 'sms'))
);

CREATE INDEX idx_advisory_deliveries_advisory ON advisory_deliveries(advisory_id);
CREATE INDEX idx_advisory_deliveries_user ON advisory_deliveries(user_id);
CREATE INDEX idx_advisory_deliveries_read ON advisory_deliveries(read_at);
```

#### user_assignments table
```sql
CREATE TABLE user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES users(id),
  farmer_id UUID NOT NULL REFERENCES users(id),
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT unique_active_assignment UNIQUE (officer_id, farmer_id, is_active)
);

CREATE INDEX idx_assignments_officer ON user_assignments(officer_id);
CREATE INDEX idx_assignments_farmer ON user_assignments(farmer_id);
CREATE INDEX idx_assignments_active ON user_assignments(is_active);
```

#### audit_logs table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

---

### Role-Based Access Control (RBAC) Implementation

#### Middleware for Role Verification

```javascript
// middleware/rbac.middleware.js
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }
    
    next();
  };
};

const checkJurisdiction = async (req, res, next) => {
  const user = req.user;
  const targetUserId = req.params.userId || req.query.userId;
  
  if (!targetUserId) return next();
  
  // National admin has access to everything
  if (user.role === 'national_admin') return next();
  
  const targetUser = await User.findById(targetUserId);
  
  // Check hierarchical access
  switch (user.role) {
    case 'regional_specialist':
      if (targetUser.region !== user.region) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied: outside your region' }
        });
      }
      break;
      
    case 'woreda_expert':
      if (targetUser.region !== user.region || 
          targetUser.zone !== user.zone ||
          targetUser.woreda !== user.woreda) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied: outside your woreda' }
        });
      }
      break;
      
    case 'extension_officer':
      // Check if farmer is assigned
      const isAssigned = await UserAssignment.findOne({
        officer_id: user.id,
        farmer_id: targetUserId,
        is_active: true
      });
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Farmer not assigned to you' }
        });
      }
      break;
      
    case 'farmer':
      // Farmers can only access their own data
      if (targetUserId !== user.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }
      break;
  }
  
  next();
};

// Usage in routes
app.get('/admin/analytics',
  authenticateToken,
  checkRole('extension_officer', 'woreda_expert', 'regional_specialist', 'national_admin'),
  getAnalytics
);

app.get('/farmers/:userId/farms',
  authenticateToken,
  checkJurisdiction,
  getFarmerFarms
);
```

#### Service Layer with RBAC

```javascript
// services/analytics.service.js
class AnalyticsService {
  async getAnalyticsDashboard(user) {
    const jurisdiction = this.getUserJurisdiction(user);
    
    switch (user.role) {
      case 'extension_officer':
        return this.getKebeleAnalytics(jurisdiction);
        
      case 'woreda_expert':
        return this.getWoredaAnalytics(jurisdiction);
        
      case 'regional_specialist':
        return this.getRegionalAnalytics(jurisdiction);
        
      case 'national_admin':
        return this.getNationalAnalytics();
        
      default:
        throw new Error('Invalid role for analytics');
    }
  }
  
  getUserJurisdiction(user) {
    return {
      country: user.country,
      region: user.region,
      zone: user.zone,
      woreda: user.woreda,
      kebele: user.kebele
    };
  }
  
  async getKebeleAnalytics(jurisdiction) {
    const farmers = await User.count({
      where: {
        role: 'farmer',
        region: jurisdiction.region,
        zone: jurisdiction.zone,
        woreda: jurisdiction.woreda,
        kebele: jurisdiction.kebele
      }
    });
    
    const farms = await Farm.count({
      include: {
        model: User,
        where: {
          region: jurisdiction.region,
          zone: jurisdiction.zone,
          woreda: jurisdiction.woreda,
          kebele: jurisdiction.kebele
        }
      }
    });
    
    // ... more aggregations
    
    return {
      jurisdiction: {
        type: 'kebele',
        ...jurisdiction
      },
      summary: {
        totalFarmers: farmers,
        totalFarms: farms,
        // ... more metrics
      }
    };
  }
  
  async getWoredaAnalytics(jurisdiction) {
    // Aggregate data across all kebeles in woreda
    const kebeles = await EthiopianLocation.findAll({
      where: {
        type: 'kebele',
        woreda_id: jurisdiction.woredaId
      }
    });
    
    // ... aggregation logic
  }
}
```

---

### Updated JWT Token Structure with Role

**Access Token Payload:**
```json
{
  "userId": "uuid",
  "phoneNumber": "+251912345678",
  "role": "extension_officer",
  "jurisdiction": {
    "region": "Oromia",
    "zone": "East Shewa",
    "woreda": "Adama",
    "kebele": "Kebele 01"
  },
  "type": "access",
  "iat": 1691419200,
  "exp": 1691505600
}
```

---

### Additional Task Assignments for Role-Based Features

#### Abraham Amogne (Backend Lead)

**Additional Tasks:**
- [ ] Implement RBAC middleware and authorization logic (Week 2-3)
- [ ] Build hierarchical location filtering (Week 3)
- [ ] Develop admin analytics endpoints (Week 5-6)
- [ ] Create advisory system backend (Week 7)
- [ ] Implement audit logging (Week 8)

#### Abenezer Endrias (Database Specialist)

**Additional Tasks:**
- [ ] Design and populate Ethiopian locations table (Week 1-2)
- [ ] Create location hierarchy queries and views (Week 2-3)
- [ ] Build aggregation queries for multi-level analytics (Week 4-5)
- [ ] Optimize role-based data filtering (Week 6)
- [ ] Create stored procedures for complex reports (Week 7-8)

---

**End of Backend Role-Based Additions**


---

## 15. AI & Machine Learning Architecture

### 15.1 ML Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.10+ | ML model development |
| **scikit-learn** | 1.3+ | Traditional ML algorithms |
| **TensorFlow** | 2.13+ | Deep learning models |
| **pandas** | 2.0+ | Data manipulation |
| **numpy** | 1.24+ | Numerical computations |
| **Prophet** | 1.1+ | Time series forecasting |
| **FastAPI** | 0.103+ | ML model serving API |
| **Redis** | 7.x | Model prediction caching |
| **PostgreSQL** | 14.x | Training data storage |

### 15.2 AI Services Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  AI Analytics System                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐      ┌──────────────┐              │
│  │  Node.js API │◄────►│  Python ML   │              │
│  │   (Express)  │      │   Service    │              │
│  └──────┬───────┘      └──────┬───────┘              │
│         │                     │                        │
│    ┌────┴────────────────────┴────┐                  │
│    │                                │                  │
│  ┌─▼────────┐  ┌────────────┐  ┌──▼──────────┐      │
│  │Historical│  │   Model     │  │  Prediction  │      │
│  │Data Store│  │  Registry   │  │    Cache     │      │
│  └──────────┘  └────────────┘  └──────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 15.3 API Endpoints for AI Features

#### GET /ai/predictions/:farmId/yield
**Description:** Get yield prediction for specific farm and crop

**Query Parameters:**
- `cropId`: Crop ID (required)
- `targetDate`: Target harvest date
- `includeConfidence`: Include confidence intervals

**Response (200):**
```json
{
  "success": true,
  "data": {
    "predictionId": "pred-uuid",
    "farmId": "farm-uuid",
    "cropId": "crop-uuid",
    "predictedYield": {
      "kgPerHectare": 2450,
      "totalKg": 3675,
      "confidence": 82
    },
    "confidenceInterval": {
      "lower": 2200,
      "upper": 2700
    },
    "predictionBasis": {
      "historicalYields": [2300, 2400, 2550],
      "currentSeasonWeather": "favorable",
      "soilHealth": "good",
      "cropStage": "flowering"
    },
    "factorsInfluencing": [
      {
        "factor": "rainfall",
        "impact": "positive",
        "contribution": 35
      },
      {
        "factor": "soil_nitrogen",
        "impact": "neutral",
        "contribution": 15
      }
    ],
    "generatedAt": "2026-08-07T14:30:00Z",
    "targetDate": "2026-11-15"
  }
}
```

#### GET /ai/trends/:farmId/weather
**Description:** Historical weather trends and forecasts

**Query Parameters:**
- `years`: Number of years to analyze (1-10, default 3)
- `metric`: Specific metric (rainfall, temperature, all)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "farmId": "farm-uuid",
    "analysisType": "weather",
    "periodAnalyzed": {
      "startYear": 2023,
      "endYear": 2026
    },
    "rainfall": {
      "annualTrend": {
        "direction": "declining",
        "changePercent": -8.5,
        "significance": 0.03
      },
      "seasonalPatterns": {
        "kiremt": {
          "averageTotal": 850,
          "trend": "stable",
          "reliability": "high"
        },
        "belg": {
          "averageTotal": 320,
          "trend": "declining",
          "reliability": "medium"
        }
      },
      "predictions": {
        "nextKiremt": {
          "predictedTotal": 820,
          "confidence": 75,
          "comparedToAverage": -3.5
        }
      }
    },
    "temperature": {
      "annualTrend": {
        "direction": "increasing",
        "changeDegrees": 0.8,
        "significance": 0.01
      },
      "extremeEvents": {
        "heatWaves": 3,
        "frostEvents": 0
      }
    },
    "recommendations": [
      "Consider drought-resistant crop varieties",
      "Invest in water storage for declining Belg rainfall",
      "Monitor heat stress during midday hours"
    ],
    "generatedAt": "2026-08-07T14:30:00Z"
  }
}
```

#### GET /ai/trends/:farmId/soil-health
**Description:** Soil health trends and predictions

**Response (200):**
```json
{
  "success": true,
  "data": {
    "farmId": "farm-uuid",
    "analysisType": "soil_health",
    "periodAnalyzed": {
      "startDate": "2024-01-01",
      "endDate": "2026-08-07",
      "dataPoints": 1250
    },
    "nitrogen": {
      "currentLevel": 125,
      "trend": "declining",
      "depletionRate": 5.2,
      "predictedIn90Days": 110,
      "optimalRange": [100, 200],
      "recommendation": "Apply 40kg Urea per hectare within 30 days"
    },
    "soilMoisture": {
      "averageRetention": 45,
      "trend": "improving",
      "changePercent": 8,
      "efficiency": "good"
    },
    "healthScore": {
      "current": 78,
      "trend": "stable",
      "comparedToRegion": "+12",
      "projection6Months": 75
    },
    "recommendations": [
      "Continue current fertilizer schedule",
      "Consider cover cropping to maintain organic matter",
      "Monitor nitrogen levels monthly"
    ]
  }
}
```

#### POST /ai/recommendations/smart-irrigation
**Description:** Get AI-powered irrigation recommendation

**Request:**
```json
{
  "farmId": "farm-uuid",
  "cropId": "crop-uuid",
  "planningHorizon": 7
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "farmId": "farm-uuid",
    "currentStatus": {
      "soilMoisture": 42,
      "cropThreshold": 35,
      "status": "adequate"
    },
    "predictions": [
      {
        "date": "2026-08-09",
        "predictedMoisture": 38,
        "rainfallProbability": 15,
        "evapotranspiration": 6.5,
        "recommendation": "no_action"
      },
      {
        "date": "2026-08-10",
        "predictedMoisture": 32,
        "rainfallProbability": 10,
        "evapotranspiration": 7.2,
        "recommendation": "irrigate_evening",
        "suggestedAmount": {
          "liters": 450,
          "hours": 2.5,
          "mm": 15
        },
        "reasoning": "Moisture will drop below threshold. Low rain probability."
      }
    ],
    "weeklySchedule": {
      "totalIrrigations": 2,
      "totalWater": 850,
      "waterSavings": "20% less than fixed schedule",
      "costSavings": "15 ETB"
    },
    "confidence": 85,
    "generatedAt": "2026-08-07T14:30:00Z"
  }
}
```

#### GET /ai/disease-risk/:farmId/forecast
**Description:** Disease risk forecasting with historical analysis

**Response (200):**
```json
{
  "success": true,
  "data": {
    "farmId": "farm-uuid",
    "forecastPeriod": {
      "start": "2026-08-07",
      "end": "2026-08-21",
      "days": 14
    },
    "risks": [
      {
        "diseaseName": "Wheat Yellow Rust",
        "cropId": "crop-uuid",
        "cropType": "wheat",
        "riskLevel": "high",
        "riskScore": 72,
        "peakRiskDate": "2026-08-12",
        "reasoning": {
          "weatherSuitability": 85,
          "historicalOccurrence": 75,
          "cropVulnerability": 65,
          "regionalOutbreak": 50
        },
        "historicalContext": {
          "occurrencesLastYear": 2,
          "occurrencesLast5Years": 7,
          "typicalOnsetDate": "August 10-15",
          "typicalDuration": "14-21 days"
        },
        "preventiveActions": [
          {
            "action": "Apply fungicide",
            "timing": "Before Aug 10",
            "priority": "critical",
            "estimatedCost": "250 ETB"
          },
          {
            "action": "Inspect lower leaves daily",
            "timing": "Starting Aug 8",
            "priority": "high"
          }
        ],
        "ifNotPrevented": {
          "potentialYieldLoss": "15-30%",
          "estimatedLoss": "350-700 kg",
          "monetaryLoss": "5250-10500 ETB"
        }
      }
    ],
    "confidence": 78,
    "similarHistoricalYears": [2023, 2021, 2019],
    "generatedAt": "2026-08-07T14:30:00Z"
  }
}
```

#### GET /ai/analytics/comparative/:farmId
**Description:** Comparative analytics with similar farms

**Response (200):**
```json
{
  "success": true,
  "data": {
    "farmId": "farm-uuid",
    "comparisonGroup": {
      "scope": "woreda",
      "similarFarms": 12,
      "criteria": "same_crop_same_size"
    },
    "performance": {
      "yield": {
        "yourFarm": 2450,
        "groupAverage": 2280,
        "groupTop": 2650,
        "yourPercentile": 65,
        "comparison": "+7.5% above average"
      },
      "waterEfficiency": {
        "yourFarm": 1.85,
        "groupAverage": 1.62,
        "yourPercentile": 78,
        "comparison": "+14% more efficient"
      },
      "inputCost": {
        "yourFarm": 4500,
        "groupAverage": 4200,
        "yourPercentile": 45,
        "comparison": "7% higher costs"
      }
    },
    "bestPracticesIdentified": [
      {
        "practice": "Split fertilizer application",
        "adoption": "top 20% of farms",
        "impact": "+12% yield improvement",
        "yourStatus": "not_adopted"
      },
      {
        "practice": "Drip irrigation",
        "adoption": "top 30% of farms",
        "impact": "+25% water savings",
        "yourStatus": "adopted"
      }
    ],
    "improvementPotential": {
      "yieldGap": "8% below top performer",
      "estimatedGain": "200 kg (3000 ETB)",
      "keyActions": [
        "Optimize fertilizer timing",
        "Improve disease monitoring"
      ]
    }
  }
}
```

#### GET /ai/seasonal-planning/:farmId
**Description:** AI-powered seasonal planning recommendations

**Query Parameters:**
- `season`: belg or kiremt
- `year`: target year

**Response (200):**
```json
{
  "success": true,
  "data": {
    "farmId": "farm-uuid",
    "season": "kiremt",
    "year": 2027,
    "plantingWindow": {
      "recommended": {
        "start": "2027-06-10",
        "end": "2027-06-25"
      },
      "reasoning": "Based on historical rainfall onset and soil temperature",
      "confidence": 82,
      "historicalSuccessRate": 85
    },
    "cropRecommendations": [
      {
        "crop": "teff",
        "suitabilityScore": 88,
        "expectedYield": 2400,
        "riskLevel": "low",
        "marketOutlook": "stable",
        "reasoning": "Strong historical performance, favorable forecasted conditions"
      },
      {
        "crop": "maize",
        "suitabilityScore": 75,
        "expectedYield": 3200,
        "riskLevel": "medium",
        "marketOutlook": "improving",
        "reasoning": "Good yield potential but higher water requirements"
      }
    ],
    "seasonalForecast": {
      "rainfallTotal": 880,
      "comparedToAverage": "+3%",
      "onsetPrediction": "June 12 ±5 days",
      "endPrediction": "September 20 ±7 days",
      "drySpellRisk": "low"
    },
    "timeline": [
      {
        "date": "2027-05-25",
        "action": "Prepare seedbed",
        "priority": "high"
      },
      {
        "date": "2027-06-10",
        "action": "Begin planting",
        "priority": "critical"
      },
      {
        "date": "2027-07-01",
        "action": "First fertilizer application",
        "priority": "high"
      }
    ]
  }
}
```

### 15.4 ML Service Implementation

#### Python ML Service Structure

```python
# ml_service/
├── models/
│   ├── yield_predictor.py
│   ├── disease_risk.py
│   ├── irrigation_optimizer.py
│   └── weather_forecaster.py
├── training/
│   ├── train_yield_model.py
│   ├── train_disease_model.py
│   └── feature_engineering.py
├── api/
│   ├── main.py (FastAPI)
│   ├── routes.py
│   └── schemas.py
├── utils/
│   ├── data_loader.py
│   ├── preprocessing.py
│   └── model_registry.py
└── config/
    └── settings.py
```

#### Yield Prediction Model

```python
# models/yield_predictor.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

class YieldPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            random_state=42
        )
        self.scaler = StandardScaler()
        
    def prepare_features(self, farm_data, weather_data, soil_data):
        """Prepare feature matrix for prediction"""
        features = {
            # Historical yields
            'avg_yield_3yr': farm_data['historical_yields'].tail(3).mean(),
            'yield_trend': self._calculate_trend(farm_data['historical_yields']),
            
            # Weather features
            'total_rainfall': weather_data['rainfall'].sum(),
            'avg_temperature': weather_data['temperature'].mean(),
            'growing_degree_days': self._calculate_gdd(weather_data),
            'dry_spell_count': self._count_dry_spells(weather_data),
            
            # Soil features
            'nitrogen_level': soil_data['nitrogen'].mean(),
            'phosphorus_level': soil_data['phosphorus'].mean(),
            'potassium_level': soil_data['potassium'].mean(),
            'soil_moisture_avg': soil_data['moisture'].mean(),
            
            # Crop management
            'planting_date_doy': farm_data['planting_date'].dayofyear,
            'fertilizer_applied': farm_data['fertilizer_kg'],
            'disease_incidents': farm_data['disease_count'],
            
            # Spatial features
            'elevation': farm_data['elevation'],
            'slope': farm_data['slope'],
        }
        
        return pd.DataFrame([features])
    
    def predict(self, features_df):
        """Generate yield prediction with confidence"""
        features_scaled = self.scaler.transform(features_df)
        
        # Point prediction
        prediction = self.model.predict(features_scaled)[0]
        
        # Confidence interval using tree variance
        tree_predictions = [tree.predict(features_scaled)[0] 
                          for tree in self.model.estimators_]
        std_dev = np.std(tree_predictions)
        
        return {
            'predicted_yield': round(prediction, 2),
            'confidence': self._calculate_confidence(std_dev),
            'confidence_interval': {
                'lower': round(prediction - 1.96 * std_dev, 2),
                'upper': round(prediction + 1.96 * std_dev, 2)
            }
        }
    
    def _calculate_confidence(self, std_dev):
        """Convert standard deviation to confidence score"""
        # Lower std_dev = higher confidence
        confidence = max(0, min(100, 100 - (std_dev / 10) * 20))
        return round(confidence, 2)
```

#### Time Series Weather Forecasting

```python
# models/weather_forecaster.py
from prophet import Prophet
import pandas as pd

class WeatherForecaster:
    def __init__(self):
        self.rainfall_model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            changepoint_prior_scale=0.05
        )
        self.temperature_model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True
        )
    
    def train(self, historical_data):
        """Train models on historical weather data"""
        # Prepare rainfall data
        rainfall_df = historical_data[['date', 'rainfall']].rename(
            columns={'date': 'ds', 'rainfall': 'y'}
        )
        self.rainfall_model.fit(rainfall_df)
        
        # Prepare temperature data
        temp_df = historical_data[['date', 'temperature']].rename(
            columns={'date': 'ds', 'temperature': 'y'}
        )
        self.temperature_model.fit(temp_df)
    
    def forecast_season(self, start_date, end_date):
        """Forecast rainfall and temperature for season"""
        future_dates = pd.date_range(start_date, end_date)
        future_df = pd.DataFrame({'ds': future_dates})
        
        # Rainfall forecast
        rainfall_forecast = self.rainfall_model.predict(future_df)
        
        # Temperature forecast
        temp_forecast = self.temperature_model.predict(future_df)
        
        return {
            'dates': future_dates.tolist(),
            'rainfall': {
                'predicted': rainfall_forecast['yhat'].tolist(),
                'lower': rainfall_forecast['yhat_lower'].tolist(),
                'upper': rainfall_forecast['yhat_upper'].tolist(),
                'total': round(rainfall_forecast['yhat'].sum(), 2)
            },
            'temperature': {
                'predicted': temp_forecast['yhat'].tolist(),
                'average': round(temp_forecast['yhat'].mean(), 2)
            }
        }
```

#### Disease Risk Scoring

```python
# models/disease_risk.py
import numpy as np

class DiseaseRiskModel:
    def __init__(self, disease_db):
        self.disease_db = disease_db
        
    def calculate_risk(self, disease_name, current_conditions, 
                      historical_occurrences, crop_stage):
        """Calculate disease risk score"""
        disease = self.disease_db[disease_name]
        
        # Weather suitability (0-100)
        weather_score = self._weather_suitability(
            current_conditions,
            disease['optimal_conditions']
        )
        
        # Historical occurrence probability
        historical_score = self._historical_probability(
            historical_occurrences,
            disease['typical_onset_period']
        )
        
        # Crop vulnerability at current stage
        vulnerability_score = disease['vulnerability_by_stage'].get(
            crop_stage, 50
        )
        
        # Regional outbreak status
        regional_score = self._regional_outbreak_score(disease_name)
        
        # Weighted risk score
        risk_score = (
            weather_score * 0.30 +
            historical_score * 0.25 +
            vulnerability_score * 0.25 +
            regional_score * 0.20
        )
        
        return {
            'risk_score': round(risk_score, 2),
            'risk_level': self._score_to_level(risk_score),
            'components': {
                'weather': weather_score,
                'historical': historical_score,
                'vulnerability': vulnerability_score,
                'regional': regional_score
            }
        }
    
    def _weather_suitability(self, current, optimal):
        """Calculate how suitable current weather is for disease"""
        score = 0
        
        # Temperature suitability
        if optimal['temp_min'] <= current['temperature'] <= optimal['temp_max']:
            score += 40
        elif abs(current['temperature'] - optimal['temp_avg']) < 5:
            score += 20
        
        # Humidity suitability
        if current['humidity'] >= optimal['humidity_min']:
            score += 35
        
        # Rainfall (wet conditions favor many diseases)
        if current['rainfall_recent'] > 0:
            score += 25
        
        return min(100, score)
    
    def _score_to_level(self, score):
        """Convert numerical score to risk level"""
        if score >= 70:
            return 'critical'
        elif score >= 50:
            return 'high'
        elif score >= 30:
            return 'medium'
        else:
            return 'low'
```

### 15.5 Data Aggregation Worker

```javascript
// workers/analyticsAggregation.worker.js
const cron = require('node-cron');

class AnalyticsAggregationWorker {
  constructor() {
    this.schedule();
  }
  
  schedule() {
    // Daily aggregation at midnight
    cron.schedule('0 0 * * *', () => {
      this.aggregateDailyData();
    });
    
    // Weekly trend analysis on Sundays
    cron.schedule('0 2 * * 0', () => {
      this.calculateWeeklyTrends();
    });
    
    // Monthly ML model retraining
    cron.schedule('0 3 1 * *', () => {
      this.retrainModels();
    });
  }
  
  async aggregateDailyData() {
    console.log('Starting daily data aggregation...');
    
    // Aggregate sensor readings
    await this.aggregateSensorData();
    
    // Aggregate weather data
    await this.aggregateWeatherData();
    
    // Calculate farm health scores
    await this.calculateHealthScores();
    
    console.log('Daily aggregation complete');
  }
  
  async aggregateSensorData() {
    const farms = await Farm.findAll();
    
    for (const farm of farms) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const readings = await SensorReading.findAll({
        where: {
          farm_id: farm.id,
          timestamp: {
            [Op.gte]: yesterday
          }
        }
      });
      
      if (readings.length > 0) {
        const aggregated = {
          farm_id: farm.id,
          date: yesterday,
          soil_moisture_avg: avg(readings.map(r => r.soil_moisture)),
          soil_moisture_min: min(readings.map(r => r.soil_moisture)),
          soil_moisture_max: max(readings.map(r => r.soil_moisture)),
          temperature_avg: avg(readings.map(r => r.temperature)),
          humidity_avg: avg(readings.map(r => r.humidity)),
          nitrogen_avg: avg(readings.map(r => r.nitrogen)),
          phosphorus_avg: avg(readings.map(r => r.phosphorus)),
          potassium_avg: avg(readings.map(r => r.potassium))
        };
        
        await DailySensorSummary.create(aggregated);
      }
    }
  }
  
  async calculateWeeklyTrends() {
    const farms = await Farm.findAll();
    
    for (const farm of farms) {
      // Get last 4 weeks of data
      const data = await DailySensorSummary.findAll({
        where: {
          farm_id: farm.id,
          date: {
            [Op.gte]: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['date', 'ASC']]
      });
      
      if (data.length >= 14) {
        const trends = {
          soil_moisture: calculateTrend(data.map(d => d.soil_moisture_avg)),
          nitrogen: calculateTrend(data.map(d => d.nitrogen_avg)),
          phosphorus: calculateTrend(data.map(d => d.phosphorus_avg)),
          potassium: calculateTrend(data.map(d => d.potassium_avg))
        };
        
        await TrendAnalysis.create({
          analysis_type: 'soil',
          scope: 'farm',
          scope_id: farm.id,
          period_start: data[0].date,
          period_end: data[data.length - 1].date,
          trend_direction: trends.soil_moisture.direction,
          trend_strength: trends.soil_moisture.strength,
          insights: JSON.stringify(trends)
        });
      }
    }
  }
  
  async retrainModels() {
    console.log('Starting monthly ML model retraining...');
    
    // Call Python ML service to retrain models
    await axios.post('http://ml-service:8000/api/train/yield-model');
    await axios.post('http://ml-service:8000/api/train/disease-model');
    
    console.log('Model retraining complete');
  }
}

function calculateTrend(values) {
  // Simple linear regression
  const n = values.length;
  const x = Array.from({length: n}, (_, i) => i);
  const y = values;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  let direction;
  if (slope > 0.5) direction = 'improving';
  else if (slope < -0.5) direction = 'declining';
  else direction = 'stable';
  
  return {
    direction,
    strength: Math.abs(slope) * 100,
    slope
  };
}
```

### 15.6 Additional Backend Tasks

#### Abraham Amogne (Backend Lead)
**AI/ML Integration Tasks:**
- [ ] Setup Python ML service infrastructure (Week 5)
- [ ] Integrate ML service with Node.js API (Week 5-6)
- [ ] Implement prediction caching layer (Week 6)
- [ ] Build analytics aggregation workers (Week 7)
- [ ] Create ML model versioning system (Week 8)

#### Abenezer Endrias (Database & Analytics)
**Data Analytics Tasks:**
- [ ] Design historical data tables (yield, weather) (Week 2)
- [ ] Create data aggregation queries (Week 5-6)
- [ ] Build trend calculation stored procedures (Week 6-7)
- [ ] Optimize analytics query performance (Week 7)
- [ ] Implement data quality scoring (Week 8)
- [ ] Create ML training data pipelines (Week 9-10)

---

**End of AI/ML Backend Additions**
