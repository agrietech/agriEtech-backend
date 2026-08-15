# Team Assignment & Implementation Guide

This guide maps each module to individual student responsibilities and assigned files.

---

## 👥 Team Members & Role Assignment Matrix

| # | Full Name | Student ID | Assigned Role | Assigned Folder / Files | Core Responsibilities |
|---|---|---|---|---|---|
| 1 | **Abenezer Endrias** | `CTC-1826-26` | **Ingestion & Data Pipeline** | `src/ingestion/connectors/*`, `src/ingestion/jobs/*`, `src/ingestion/*` | Satellite/climate connectors (CHIRPS, Open-Meteo, GloFAS, NASA POWER, NDVI), BullMQ queue jobs, automated schedulers, and telemetry intake. |
| 2 | **Abinu Mathewos** | `CTC-1258-26` | **REST API & Database Modules** | `src/modules/boundaries/*`, `src/modules/farms/*`, `src/modules/sensors/*`, `src/modules/diseaseDiagnosis/*`, `src/modules/analytics/*` | Farm plot & boundary spatial management, IoT sensor registration, crop disease diagnostic intake, and regional analytics dashboards. |
| 3 | **Abraham Amogne** | `CTC-329-26` | **Team Lead & Core Backend** | `src/app.js`, `src/server.js`, `src/config/*`, `src/middleware/*`, `src/modules/auth/*`, `prisma/*` | Overall platform architecture, server runtime, database schemas (Prisma/PostGIS), auth/security, code reviews, and project coordination. |
| 4 | **Alen Biruk** | `CTC-2176-26` | **Risk Processing & Analytics** | `src/processing/*` | SPI drought calculation (Gamma fitting), GloFAS flood return thresholds ($Q_2, Q_5, Q_{20}$), VCI vegetation analyzer, and multi-hazard risk aggregator. |
| 5 | **Banchamlak Golla** | `CTC-2952-26` | **Alert Delivery & Multi-Channel** | `src/delivery/*`, `src/modules/alerts/*` | Africa's Talking SMS dispatcher (Amharic, Afaan Oromoo, English), interactive USSD (`*804#`) session engine, Firebase push, and Socket.IO WebSocket broadcasting. |

---

## 🛠️ Development Workflow

1. Create a branch: `git checkout -b feature/module-name`.
2. Implement your assigned module code following the architectural skeleton.
3. Keep comments concise: use single-line comments only where necessary.
4. Run linter and formatter: `npm run lint` and `npm run format`.
5. Ensure tests pass: `npm test`.
6. Open a Pull Request for review by Team Lead (**Abraham Amogne**).
