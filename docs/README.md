# AgriEtech Backend Documentation Catalog

Welcome to the official documentation catalog for the **AgriEtech Multi-Hazard Agricultural Early Warning Platform (Backend)**.

---

## 📚 Master Index

| Document | Purpose & Scope |
| :--- | :--- |
| [**Architecture**](ARCHITECTURE.md) | High-level system architecture, layered design, Redis caching, and GEE pipelines. |
| [**API Specification**](API_SPECIFICATION.md) | Exhaustive REST OpenAPI endpoints, query schemas, JSON bodies, and error formats. |
| [**Disaster Intelligence System**](DISASTER_INTELLIGENCE_SYSTEM.md) | Remote sensing (Sentinel-2, SAR, Landsat, SRTM), USGS Seismology, RUSLE Soil Loss, and Multi-Hazard Index ($MHNDI$). |
| [**Role-Based Access Control**](ROLE_BASED_ACCESS_CONTROL.md) | 7-tier Ethiopian agricultural hierarchy, geographic scoping (`woredaId`, `regionId`), and security middleware. |
| [**IoT Hardware Guide**](ESP32_IOT_INTEGRATION_GUIDE.md) | ESP32 wiring, LoRaWAN/Wi-Fi telemetry payloads, and sensor API key authentication. |
| [**Deployment & Operations**](DEPLOYMENT_AND_OPERATIONS.md) | Docker Compose orchestration, PostgreSQL PostGIS configuration, Redis setup, and rate limiting. |
| [**Testing & Verification**](TESTING_AND_VERIFICATION.md) | Automated validation scripts, Jest unit tests, and CI/CD quality gates. |
| [**Arduino Sensor Node Sketch**](arduino_firebase_moisture_node.ino) | C++ source code for soil moisture and NPK sensor hardware telemetry node. |
