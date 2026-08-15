# Testing & Local Development Guide

How to verify the backend is running correctly on your machine.

---

## 1. First-Time Setup

```bash
git clone <repo-url>
npm install
cp .env.example .env
npm run prisma:generate
```

---

## 2. Automated Tests (No Docker Required)

Works without Redis, without PostgreSQL, without any `.env` values filled in:

```bash
npm test
```

Expected:
```
Tests: 17 passed, 17 total
Test Suites: 6 passed, 6 total
```

All 17 passing = core architecture is working correctly.

---

## 3. Run the Development Server

```bash
npm start
```

Or on Windows double-click `start-dev.bat`.

Expected:
```
Server running on port 5000
```

Redis and PostgreSQL are optional in development — the server starts without them.

---

## 4. Test Endpoints in Browser

Open in any browser after `npm start`:

| URL | Expected Response |
|---|---|
| `http://localhost:5000/health` | `{ "status": "UP" }` |
| `http://localhost:5000/` | `{ "project": "AgriEtech Backend", ... }` |
| `http://localhost:5000/api/v1/analytics/summary` | `{ "success": true, "data": { ... } }` |
| `http://localhost:5000/api/v1/boundaries/regions` | `{ "success": true, "data": [...] }` |
| `http://localhost:5000/api/v1/alerts/active` | `{ "success": true, "data": [...] }` |
| `http://localhost:5000/api/v1/risk-assessments/latest` | `{ "success": true, "data": [...] }` |
| `http://localhost:5000/api/v1/ingestion/connectors` | `{ "success": true, "data": [...] }` |

---

## 5. Test POST Endpoints (VS Code REST Client)

Install the **REST Client** extension in VS Code. Create `test.http` at the project root:

```http
### Health Check
GET http://localhost:5000/health

### Register a user
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "name": "Abraham Amogne",
  "phone": "+251911223344",
  "password": "Test1234!",
  "role": "DEVELOPMENT_AGENT"
}

### Login
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "phone": "+251911223344",
  "password": "Test1234!"
}

### USSD session
POST http://localhost:5000/api/v1/delivery/ussd
Content-Type: application/json

{
  "sessionId": "test-001",
  "phoneNumber": "+251911223344",
  "text": ""
}

### Disease diagnosis
POST http://localhost:5000/api/v1/disease-diagnosis
Content-Type: application/json

{
  "farmId": "farm_001",
  "cropType": "Maize",
  "imageUrl": "https://example.com/crop.jpg"
}

### Risk assessment
POST http://localhost:5000/api/v1/risk-assessments/evaluate
Content-Type: application/json

{
  "woredaId": "woreda_adama_01",
  "drought": 0.72,
  "flood": 0.45,
  "locust": 0.1,
  "vegetation": 0.6
}
```

---

## 6. Full Stack (With Real Database & Redis)

```bash
# Start PostgreSQL 15 + PostGIS + Redis 7
docker compose up -d

# Run database migrations
npm run prisma:migrate

# Start server
npm start
```

After this, all endpoints connect to the real database instead of in-memory fallbacks.

---

## 7. Code Quality

```bash
npm run lint     # 0 errors, 0 warnings expected
npm run format   # auto-formats all src/*.js files
```

---

## Team Verification Checklist

```
[ ] npm install                  → no errors
[ ] npm run prisma:generate      → "Generated Prisma Client"
[ ] npm test                     → 17/17 tests pass
[ ] npm start                    → "Server running on port 5000"
[ ] GET /health in browser       → { "status": "UP" }
[ ] npm run lint                 → 0 errors, 0 warnings
```

All 6 checked = backend is working on your machine.
