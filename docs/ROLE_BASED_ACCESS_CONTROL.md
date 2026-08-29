# AgriEtech Role-Based Access Control (RBAC) & Hierarchy Governance

## 1. Executive Summary

AgriEtech implements a strict **7-Tier Agricultural Governance Role-Based Access Control (RBAC)** architecture in compliance with the administrative hierarchy of the Ethiopian Ministry of Agriculture and regional bureaus.

---

## 2. The 7 Administrative User Roles

```
                                  ┌──────────────────────────────────────────────┐
                                  │   ADMIN / NATIONAL_ADMIN                     │
                                  │   (National System Oversight & Root Access)  │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                  ┌──────────────────────▼───────────────────────┐
                                  │   REGIONAL_OFFICER                           │
                                  │   (Regional Bureau Authority & Broadcasts)   │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                  ┌──────────────────────▼───────────────────────┐
                                  │   ZONAL_OFFICER                              │
                                  │   (Multi-Woreda Zonal Command Map)           │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                  ┌──────────────────────▼───────────────────────┐
                                  │   WOREDA_OFFICER                             │
                                  │   (Woreda-Scoped Alerts & DA Supervision)    │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                  ┌──────────────────────▼───────────────────────┐
                                  │   DEVELOPMENT_AGENT (DA)                     │
                                  │   (Kebele Soil/Sensor Registration & Triage) │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                  ┌──────────────────────▼───────────────────────┐
                                  │   FARMER                                     │
                                  │   (Farm GIS, Diagnosis & USSD *212#)         │
                                  └──────────────────────────────────────────────┘
                                                         ▲
                                  ┌──────────────────────┴───────────────────────┐
                                  │   RESEARCHER / AGRONOMIST                    │
                                  │   (Cross-Regional Analytics & Science Export)│
                                  └──────────────────────────────────────────────┘
```

---

## 3. Role Permissions & API Access Matrix

| Role | Database Enum | Scoping Scope | Permissions |
| :--- | :--- | :--- | :--- |
| **National Admin** | `ADMIN` | National (All) | Full CRUD on users, sensor fleet, system configurations, and security audit logs. |
| **Regional Officer** | `REGIONAL_OFFICER` | `regionId` | Regional early warning alerts, regional aggregate analytics, and zonal officer approval. |
| **Zonal Officer** | `ZONAL_OFFICER` | `zoneId` | Zonal risk command map, woreda officer approval, cross-woreda hazard monitoring. |
| **Woreda Officer** | `WOREDA_OFFICER` | `woredaId` | Localized Woreda emergency broadcasts, DA approval, Woreda-scoped soil/seismic monitoring. |
| **Development Agent** | `DEVELOPMENT_AGENT` | `kebeleId` / `woredaId` | IoT sensor registration, farm plot mapping, farmer crop disease diagnosis triaging. |
| **Smallholder Farmer** | `FARMER` | Personal Account | Farm boundary management, disease photo submission, `*212#` USSD access, and local alerts. |
| **Agronomist / Researcher**| `RESEARCHER` | National (Analytical) | Multispectral satellite queries, science telemetry export (PDF/CSV), and ML model evaluation. |

---

## 4. Backend Middleware Implementation

*File:* [`src/middleware/auth.middleware.js`](file:///c:/Users/a/Desktop/AgriEtech/agriEtech-backend/src/middleware/auth.middleware.js)

### 4.1 `authenticate`
- Decodes and verifies JWT Bearer tokens with `JWT_SECRET`.
- Validates IoT Sensor API Keys (`x-api-key`) against environment whitelists.
- Verifies token revocation against Redis blacklist (`isTokenBlacklisted`).

### 4.2 `authorize(...allowedRoles)`
- Restricts endpoint execution to users matching specified role enums. Returns `403 FORBIDDEN` for unauthorized calls.

### 4.3 `authorizeWoredaScope(paramName)` & `authorizeRegionScope(paramName)`
- Enforces geographic isolation ensuring subordinate officers cannot query or mutate records outside their administrative jurisdiction.
