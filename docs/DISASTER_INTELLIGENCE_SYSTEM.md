# AgriEtech Planetary Remote Sensing & Multi-Hazard Disaster Intelligence

## 1. Executive Overview

The **AgriEtech Multi-Hazard Disaster Intelligence System** is an enterprise-grade analytical engine operating within the Node.js/Express backend. It processes satellite imagery, geotechnical models, live seismic hazard catalogues, and hydrological forecasts specifically calibrated for the agro-ecological zones of Ethiopia.

---

## 2. Google Earth Engine (GEE) Planetary Compute Connector

*File:* [`src/ingestion/connectors/earthEngineConnector.js`](file:///c:/Users/a/Desktop/AgriEtech/agriEtech-backend/src/ingestion/connectors/earthEngineConnector.js)

The GEE connector integrates four core satellite constellations and digital elevation models:

### 2.1 Multispectral Telemetry (Sentinel-2 MSI)
- **Normalized Difference Vegetation Index ($NDVI$)**:
  $$NDVI = \frac{\rho_{\text{NIR}} - \rho_{\text{Red}}}{\rho_{\text{NIR}} + \rho_{\text{Red}}} = \frac{B8 - B4}{B8 + B4}$$
- **Normalized Difference Red Edge ($NDRE$)**: Sensitive to chlorophyll in dense canopies.
  $$NDRE = \frac{B8 - B5}{B8 + B5}$$
- **Enhanced Vegetation Index ($EVI$)**: Atmospheric resistance correction.
  $$EVI = 2.5 \times \frac{B8 - B4}{B8 + 6.0 \cdot B4 - 7.5 \cdot B2 + 1.0}$$
- **Normalized Difference Water Index ($NDWI$)**: Canopy hydration.
  $$NDWI = \frac{B8 - B11}{B8 + B11}$$
- **Moisture Stress Index ($MSI$)**: Plant desiccation.
  $$MSI = \frac{B11}{B8}$$

### 2.2 Synthetic Aperture Radar (Sentinel-1 SAR C-Band)
- **Cloud-Penetrating Radar Backscatter**: Dual-polarization $\sigma_{VV}^0$ and $\sigma_{VH}^0$ in decibels ($dB$).
- **Radar Vegetation Index ($RVI$)**:
  $$RVI = \frac{4 \cdot \sigma_{VH}^0}{\sigma_{VV}^0 + \sigma_{VH}^0}$$
- **Dielectric Permittivity & Volumetric Soil Moisture ($\theta_v$)**: Derived from Topp's polynomial equation for microwave penetration through vegetative cover.

### 2.3 Thermal Infrared & Active Fire Radiometry (Landsat 8/9 & MODIS FIRMS)
- **Land Surface Temperature ($LST$)**: Derived from Landsat Band 10 Split-Window Thermal Radiative Transfer Equation ($^\circ\text{C}$).
- **Active Fire Telemetry (MODIS / VIIRS FIRMS)**: Detection of crop residue burning, rangeland wildfires, and volcanic thermal radiative power ($FRP$ in MW).

### 2.4 Topography & Hydrology (SRTM 30m Digital Elevation Model)
- **Elevation ($m$) & Slope Gradient ($\%$)**: 30m spatial resolution elevation profiling.
- **Topographic Wetness Index ($TWI$)**:
  $$TWI = \ln\left(\frac{a}{\tan \beta}\right)$$
  Where $a$ is upslope contributing drainage area and $\beta$ is local slope gradient in radians.

---

## 3. Real-Time Seismology & Tectonic Fault Hazard Engine

*File:* [`src/processing/seismologyHazardEngine.js`](file:///c:/Users/a/Desktop/AgriEtech/agriEtech-backend/src/processing/seismologyHazardEngine.js)

### 3.1 Live USGS API Ingestion
Queries the live USGS Earthquake Hazards API across the sovereign Ethiopian bounding box:
$$\text{Bounding Box: } 3.0^\circ\text{N} - 15.5^\circ\text{N}, \quad 32.5^\circ\text{E} - 48.5^\circ\text{E}$$
Filters events by minimum magnitude ($M \ge 2.5$) and calculates hypocentral distance to agricultural assets.

### 3.2 Ethiopian Tectonic Rift Fault Modeling
Explicitly models active tectonic structures of the Main Ethiopian Rift (MER):
1. **Wonji Fault Belt (WFB)**: Central MER extensional faulting (annual slip rate: $5.5\,\text{mm/yr}$).
2. **Afar Depression / Triple Junction**: Red Sea - Gulf of Aden - East African mega-rift junction ($12.0\,\text{mm/yr}$).
3. **Ankober Border Fault**: Western plateau border escarpment ($2.5\,\text{mm/yr}$).
4. **Ambo Fault**: Transverse westward strike-slip fault ($1.8\,\text{mm/yr}$).
5. **Chew Bahir / Southern Rift**: Southern extension bordering Kenya ($4.0\,\text{mm/yr}$).

### 3.3 Ground Motion & Intensity Calculations
- **Peak Ground Acceleration ($PGA$)**: Joyner-Boore Ground Motion Prediction Equation (GMPE):
  $$\ln(PGA) = c_1 + c_2 \cdot M - \ln\sqrt{R^2 + h^2} + c_3 \cdot \sqrt{R^2 + h^2}$$
- **Modified Mercalli Intensity ($MMI$)**: Wald-calibrated instrumental intensity scale mapping ground shaking to masonry irrigation canal and earthen dam tension damage.
- **Gutenberg-Richter 30-Day Recurrence Probability**:
  $$\log_{10}(N) = a - b \cdot M, \quad P(M \ge 4.5 \text{ in } 30\text{d}) = 1 - e^{-\lambda \cdot t}$$

---

## 4. Soil Degradation & Land Loss Engine (RUSLE)

*File:* [`src/processing/soilDegradationEngine.js`](file:///c:/Users/a/Desktop/AgriEtech/agriEtech-backend/src/processing/soilDegradationEngine.js)

### 4.1 Revised Universal Soil Loss Equation (RUSLE)
Computes annual soil erosion rate $A$ in $\text{t}\cdot\text{ha}^{-1}\cdot\text{yr}^{-1}$:
$$A = R \times K \times LS \times C \times P$$

- **$R$ (Rainfall Erosivity Factor)**: Derived from annual precipitation $P_{\text{ann}}$ in $\text{MJ}\cdot\text{mm}\cdot\text{ha}^{-1}\cdot\text{h}^{-1}\cdot\text{yr}^{-1}$:
  $$R = 0.55 \cdot P_{\text{ann}} - 17.5$$
- **$K$ (Soil Erodibility Factor)**: Calibrated against 16 Ethiopian soil classification profiles (Vertisol $0.024$, Nitisol $0.026$, Andosol $0.038$, Leptosol $0.045$).
- **$LS$ (Slope Length & Steepness Factor)**:
  $$LS = \left(\frac{\lambda}{22.13}\right)^m \times \left(65.41 \sin^2\theta + 4.56 \sin\theta + 0.065\right)$$
- **$C$ (Cover-Management Factor)**: Dynamic satellite derivation from Sentinel-2 NDVI:
  $$C = \exp\left(-\alpha \cdot \frac{NDVI}{\beta - NDVI}\right)$$
- **$P$ (Conservation Practice Factor)**: Terracing, stone bunds, and vegetative buffer strips ($0.40 - 1.0$).

### 4.2 Soil Organic Carbon (SOC) & Nutrient Leaching
- Annual SOC loss: $\Delta SOC = A \times \text{SOC}_{\text{topsoil}} \times E_R$ ($kg/ha/yr$).
- Primary macronutrient depletion rates: Nitrogen ($N$), Phosphorus ($P$), Potassium ($K$).
- **Chemical Degradation**: Dystric Nitisol acidification diagnostics ($pH < 5.2$) with Agricultural Lime (ኖራ) application prescriptions in $\text{Qt/ha}$ vs. Rift salinization ($EC_e$, $ESP$).

---

## 5. Multi-Hazard Composite Disaster Index ($MHNDI$)

*File:* [`src/processing/naturalDisasterPredictor.js`](file:///c:/Users/a/Desktop/AgriEtech/agriEtech-backend/src/processing/naturalDisasterPredictor.js)

Synthesizes the six disaster pillars into a normalized composite risk index ($0.0 - 1.0$):
$$MHNDI = w_1 S_{\text{seismic}} + w_2 S_{\text{soil}} + w_3 S_{\text{landslide}} + w_4 S_{\text{drought}} + w_5 S_{\text{flood}} + w_6 S_{\text{volcano}}$$

Where weights $\sum w_i = 1.0$ are dynamically calibrated by local agro-ecological topography and seasonal rain triggers.
