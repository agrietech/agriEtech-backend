# AgriEtech Testing & Quality Assurance Verification

## 1. Overview

AgriEtech backend maintains automated test suites covering remote sensing pipelines, seismology hazard engines, RUSLE soil erodibility, USSD state machines, and RBAC authorization.

---

## 2. Automated Test Suites

### 2.1 Satellite, Seismology & Soil Disaster Test Suite
*Script:* [`scripts/test_earth_engine_disasters_seismology.js`](file:///c:/Users/a/Desktop/AgriEtech/agriEtech-backend/scripts/test_earth_engine_disasters_seismology.js)
- Verifies USSD `*212#` Option 4 live soil & seismology response.
- Tests Sentinel-2 (NDVI, NDRE, EVI, SAVI, NDWI, MSI) calculation accuracy.
- Tests Sentinel-1 SAR C-Band radar vegetation index and dielectric permittivity.
- Tests Landsat 8/9 Thermal LST and MODIS FIRMS fire detection.
- Tests RUSLE annual soil loss on highland escarpments (Debre Berhan) and western acidic leaching (Nekemte).
- Tests live USGS earthquake API fetching and Joyner-Boore PGA GMPE calculations.
- Tests Multi-Hazard Natural Disaster Master Predictor on Afar mega-rift (Semara).

```bash
node scripts/test_earth_engine_disasters_seismology.js
```

### 2.2 Expert Limitation Fixes Verification Suite
*Script:* [`scripts/test_expert_limitations_fixes.js`](file:///c:/Users/a/Desktop/AgriEtech/agriEtech-backend/scripts/test_expert_limitations_fixes.js)
- Verifies GSM 7-bit vs. UCS-2 Unicode SMS segmentation budgets.
- Verifies multi-tier stateful USSD machine with language switching (Amharic / Afaan Oromoo).
- Tests multimodal crop disease pathology triage (Teff rust & Coffee leaf rust).
- Verifies Sentinel-1 SAR cloud-penetration fusion and hyper-local agronomy advisory.
- Verifies spatial geometry 2D bounding box optimizations.

```bash
node scripts/test_expert_limitations_fixes.js
```

### 2.3 Unit Testing with Jest
```bash
npm test
```
Runs Jest unit tests under `tests/` covering risk aggregators, SPI calculators, flood risk evaluators, and vegetation stress analyzers.
