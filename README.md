<div align="center">

# 🌱 CropGuardian

### Agricultural Decision Support for Ethiopian Smallholder Farmers

*Connecting field sensors, weather intelligence, and crop knowledge into one actionable platform*

![Status](https://img.shields.io/badge/Status-MVP%20In%20Development-yellow)
![Platform](https://img.shields.io/badge/Platform-Flutter%20%7C%20Node.js-blue)
![Target](https://img.shields.io/badge/Target-Ethiopian%20Farmers-green)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

</div>

---

## Table of Contents

- [The Problem](#the-problem)
- [What CropGuardian Does](#what-cropguardian-does)
- [MVP Features](#mvp-features)
- [Disease Management](#-disease-management)
- [Open APIs & External Services](#open-apis--external-services)
- [IoT Field Monitoring](#-iot-field-monitoring)
- [Technology Stack](#technology-stack)
- [Roadmap](#roadmap)
- [Team Members](#team-members)

---

## The Problem

Ethiopia's agriculture sector sustains the livelihoods of most of its population — yet farmers make critical decisions daily without soil data, weather forecasts, or crop records.

| Statistic | Value | Source |
|---|---|---|
| Smallholder farmers in Ethiopia | ~15 million | World Bank |
| Share of GDP from agriculture | ~35% | World Bank |
| Farmland that is entirely rain-fed | 95% | FAO |
| Average farm holding size | ~1.2 hectares | CSA Ethiopia |
| People facing seasonal food insecurity | ~12 million | WFP |
| Rural Ethiopians with mobile internet access | 28% | ITU |
| Rural farmers relying on basic phones only | 70%+ | GSMA |

Planting, irrigation, and harvest decisions are made without soil readings, forecasts, or any digital record. The result is preventable crop loss, every season.

---

## What CropGuardian Does

CropGuardian combines **IoT field sensors**, **open weather APIs**, **disease detection guidance**, and a **crop knowledge base** into a single mobile platform — delivering the right information to farmers at the moment they need it.

```
┌─────────────────────────────────────────────────────────┐
│                     CROPGUARDIAN                        │
│                                                         │
│  📡 IoT Sensors → 🌦️ Weather API → 🌿 Crop Knowledge   │
│              ↓           ↓               ↓              │
│         Soil Data    Forecasts      Disease Alerts       │
│              └───────────┴───────────────┘              │
│                          ↓                              │
│              🤖 Recommendation Engine                   │
│                          ↓                              │
│              📱 Farmer's Mobile App                     │
└─────────────────────────────────────────────────────────┘
```

---

## MVP Features

### 👤 Farmer Accounts

> Personalized access linked to each farmer's location and registered crops.

- Phone number registration with secure JWT authentication
- Farmer profile: name, region, language preference
- Account linked to all registered farms and sensor devices
- Session management with token refresh

---

### 🗺️ Farm & Crop Management

> A reliable digital record replacing scattered notes and memory.

- Register multiple farms with name, size (hectares), and GPS coordinates
- Assign one or more crop types per farm from a curated Ethiopian crop list
- Log planting dates and track harvest history across seasons
- View all farms on an interactive map (OpenStreetMap)

**Supported crops:**

| Crop | Season | Notes |
|---|---|---|
| Teff | Kiremt (Jun–Sep) | Ethiopia's staple grain |
| Maize | Belg & Kiremt | Widely grown across regions |
| Sorghum | Kiremt | Drought-tolerant staple |
| Wheat | Kiremt | Highlands crop |
| Barley | Kiremt | High-altitude regions |
| Coffee | Year-round | Primary export crop |
| Enset | Year-round | Southern Ethiopia staple |
| Chickpea | Belg (Feb–May) | Legume, nitrogen-fixing |

---

### 🌦️ Weather Intelligence

> Localized forecasts translated directly into farming decisions.

- Current conditions and 7-day forecast per farm location
- Displayed metrics: temperature, rainfall probability, humidity, wind speed
- Crop-specific weather alerts: drought risk, heavy rain warning, frost advisory
- Historical weather summary for the past 30 days

**Example recommendations triggered by weather:**

| Weather Event | Farming Action |
|---|---|
| Heavy rain in 48 hours | Delay fertilizer application; check field drainage |
| Drought alert (5+ dry days) | Activate irrigation; reduce field activity |
| Frost advisory overnight | Cover or harvest frost-sensitive crops |
| High humidity (>80%) | Inspect crops for early fungal signs |
| Wind speed >30 km/h | Avoid spraying; secure young seedlings |

---

### 🦠 Disease Management

> Early identification and prevention guidance for Ethiopia's most common crop diseases.

Disease alerts are triggered by combining **weather conditions** (temperature, humidity) with **crop stage** and **sensor data** — flagging risk windows before visible symptoms appear.

#### Disease Risk Detection

| Crop | Disease | Trigger Conditions | Early Action |
|---|---|---|---|
| Teff | Teff Straw Worm | High humidity + warm nights | Inspect stems; apply recommended pesticide |
| Maize | Maize Streak Virus | Dry conditions + leafhopper season | Scout for discoloration; remove infected plants |
| Wheat | Yellow Rust | Cool temperature + high humidity | Apply fungicide at first sign |
| Sorghum | Head Smut | Wet soil at sowing time | Use treated seed; rotate fields |
| Coffee | Coffee Berry Disease | Rainfall during berry development | Apply copper-based fungicide |
| Common (all crops) | Aphid Infestation | Warm + dry spells | Inspect leaf undersides; apply neem solution |
| Common (all crops) | Root Rot | Waterlogged soil (soil moisture >85%) | Improve drainage; reduce irrigation |

#### How Disease Alerts Work

```
Sensor Data (SIM-80L · DHT22)
         +
Weather Forecast (Open-Meteo)
         +
Crop Stage (from Farm Record)
         │
         ▼
  Disease Risk Engine
         │
         ▼
  Push Alert to Farmer
  "High rust risk on your wheat farm.
   Apply fungicide within 48 hours."
```

#### Disease Library
Each crop entry in the knowledge base includes:
- **Symptoms** — visual description with common Ethiopian field examples
- **Risk conditions** — temperature, humidity, and season thresholds
- **Prevention steps** — practical measures accessible to smallholder farmers
- **Treatment options** — locally available inputs and application guidance

---

### 📡 IoT Field Monitoring

> Real-time soil and environment data from physical sensors deployed on the farm.

A low-cost sensor kit connects to the CropGuardian backend via an ESP32 microcontroller over mobile internet (GSM). Readings are collected automatically and reflected in the farmer's app — no manual data entry required.

#### Sensor Kit

| Sensor | Model | Measures | Agricultural Purpose |
|---|---|---|---|
| Soil Moisture | SIM-80L | Volumetric water content (%) | Detect irrigation need before crops show visible stress |
| Environmental | DHT22 | Air temperature (°C), relative humidity (%) | Identify heat stress conditions and fungal disease risk windows |
| Soil Nutrient | NPK RS485 | Nitrogen, Phosphorus, Potassium (mg/kg) | Guide fertilizer decisions with real soil data, not estimates |

#### Data Flow

```
Farm Sensors (SIM-80L · DHT22 · NPK RS485)
              │
              ▼
       ESP32 Controller
              │
         Mobile Internet (GSM)
              │
              ▼
  CropGuardian Backend API
              │
              ▼
  PostgreSQL Database
              │
              ▼
  Recommendation + Disease Engine
              │
              ▼
   Farmer's Mobile App
```

#### App Dashboard — Sensor Readings

| Reading | Status Levels | Action Triggered |
|---|---|---|
| Soil Moisture | Sufficient / Low / Critical | Irrigation alert when below crop threshold |
| Temperature | Normal / Heat Stress / Frost Risk | Crop protection alert |
| Humidity | Normal / High (disease risk) | Fungal disease alert |
| Nitrogen (N) | Adequate / Deficient | Apply nitrogen fertilizer |
| Phosphorus (P) | Adequate / Deficient | Apply phosphorus at root zone |
| Potassium (K) | Adequate / Deficient | Apply potassium; improves drought resistance |

---

### 🤖 Rule-Based Recommendations

> Sensor and weather data converted into clear, prioritized farming actions.

| Priority | Trigger | Recommendation |
|---|---|---|
| 🔴 Critical | Soil moisture below minimum threshold | **Irrigate immediately** |
| 🔴 Critical | Disease risk conditions met | **Apply treatment within 48 hours** |
| 🟡 Warning | Heavy rain forecast + saturated soil | Hold irrigation; inspect drainage |
| 🟡 Warning | Nitrogen deficiency detected | Apply urea before next rainfall |
| 🟢 Info | Planting window approaching | Prepare seedbed; check soil temperature |
| 🟢 Info | All readings normal | No action required today |

---

### 🔔 Notifications & Alerts

> Time-sensitive information delivered directly to the farmer.

- Sensor threshold breach alerts (moisture critical, nutrient deficiency detected)
- Disease risk alerts triggered by weather + sensor combinations
- Weather warnings for registered farm locations
- Planting and harvest reminders based on crop calendar
- Optional daily farm condition summary

---

## Open APIs & External Services

CropGuardian integrates open, freely available APIs — no licensing cost for core functionality.

### 🌤️ Open-Meteo — Weather API

**Base URL:** `https://api.open-meteo.com/v1/forecast`

Free, open-source weather API with no API key required for standard use.

**Parameters used:**

| Parameter | Description |
|---|---|
| `latitude`, `longitude` | Farm GPS coordinates |
| `current_weather` | Real-time temperature and wind |
| `hourly=temperature_2m` | Hourly temperature forecast |
| `hourly=precipitation_probability` | Hourly rain probability (%) |
| `hourly=relative_humidity_2m` | Hourly humidity (%) |
| `hourly=windspeed_10m` | Hourly wind speed |
| `daily=precipitation_sum` | Daily total rainfall (mm) |
| `daily=temperature_2m_max/min` | Daily high/low temperature |
| `forecast_days=7` | 7-day forecast window |

**Example request:**
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=9.0054
  &longitude=38.7636
  &current_weather=true
  &hourly=temperature_2m,precipitation_probability,relative_humidity_2m
  &daily=precipitation_sum,temperature_2m_max,temperature_2m_min
  &forecast_days=7
```

**Used for:** weather feed, disease risk triggers, recommendation engine inputs.

---

### 🗺️ OpenStreetMap — Mapping

**Tile URL:** `https://tile.openstreetmap.org/{z}/{x}/{y}.png`

Free, open-source mapping with no API key required.

**Used for:** farm location registration, GPS pin display, farm boundary visualization.

---

### 📚 FAO GAEZ — Crop & Agro-Zone Data

**Source:** FAO Global Agro-Ecological Zones database

**Used for:** regional planting calendars, crop suitability data, soil condition baselines for Ethiopian growing zones.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Mobile Application | Flutter |
| Backend API | Node.js + Express.js |
| Database | PostgreSQL |
| Authentication | JWT |
| IoT Microcontroller | ESP32 |
| IoT Communication | REST API over GSM / Mobile Internet |
| Weather Data | Open-Meteo API (free, no key) |
| Maps | OpenStreetMap (free, no key) |
| Push Notifications | Firebase Cloud Messaging (FCM) |

---

## Roadmap

| Phase | Focus | Status |
|---|---|---|
| **Phase 1 — MVP** | Mobile app, farm records, weather feed, disease alerts, crop library, IoT sensor kit, rule-based recommendations | 🚧 In development |
| **Phase 2 — USSD Access** | Basic phone support via USSD menus: weather summary, disease alerts, irrigation reminders — no smartphone required | 📋 Planned |
| **Phase 3 — Intelligence** | Satellite crop health monitoring, AI yield prediction, expanded sensor coverage | 📋 Planned |

---

## Team Members

| # | Full Name | Student ID | Role |
|---|---|---|---|
| 1 | Abraham Amogne | CTC-329-26 | — |
| 2 | Abenezer Endrias | CTC-1826-26 | — |
| 3 | Alen Biruk | CTC-2176-26 | — |
| 4 | Banchamlak Golla | CTC-2952-26 | — |
| 5 | Abinu Mathewos | CTC-1258-26 | — |

---

## Project Status

> 🚧 **MVP in active development**

Statistics and crop data reflect current published figures and will be updated as the platform grows. Sensor compatibility and supported crops will expand based on field feedback.
