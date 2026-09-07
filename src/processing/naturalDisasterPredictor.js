/**
 * @file naturalDisasterPredictor.js
 * @description Master Integrated Risk Natural Disaster Prediction & Early Warning Engine for Ethiopia.
 * Integrates 6 primary disaster pillars:
 * 1. Earthquakes & Seismic Rifting (USGS API + Wonji / Afar Fault Systems)
 * 2. Soil Degradation & Severe Land Erosion (RUSLE Modeling)
 * 3. Landslides & Mudflows (Highland Slope + SAR Soil Saturation + Precipitation surges)
 * 4. Volcanic & Geothermal Anomalies (Afar & Central Rift Active Caldrons)
 * 5. Flash Floods & River Inundation (GloFAS + Lowland Topographic Sinks)
 * 6. Drought & Crop Desiccation (CHIRPS SPI + VCI Vegetation Deficits).
 */

const seismologyHazardEngine = require('./seismologyHazardEngine');
const soilDegradationEngine = require('./soilDegradationEngine');
const earthEngineConnector = require('../ingestion/connectors/earthEngineConnector');
const { calculateDistance } = require('../utils/geoUtils');
const logger = require('../utils/logger');

// Known Ethiopian Active Volcanic & Geothermal Centers
const ETHIOPIA_VOLCANIC_CENTERS = [
  { name: 'Erta Ale Shield Volcano (Afar)', lat: 13.60, lng: 40.67, type: 'Active Basaltic Lava Lake', hazardRadiusKm: 45 },
  { name: 'Dabbahu / Boina Volcano (Afar)', lat: 12.60, lng: 40.48, type: 'Active Fissure Rifting Center', hazardRadiusKm: 35 },
  { name: 'Fentale Stratovolcano (East Shewa / Awash)', lat: 8.97, lng: 39.93, type: 'Quaternary Caldera & Fissure Vent', hazardRadiusKm: 25 },
  { name: 'Alutu Volcanic Center (Ziway / Langano)', lat: 7.77, lng: 38.78, type: 'Active Geothermal Complex', hazardRadiusKm: 20 },
  { name: 'Corbetti Caldera (Hawassa / Shashemene)', lat: 7.18, lng: 38.43, type: 'Post-Caldera Pyroclastic Volcano', hazardRadiusKm: 25 },
  { name: 'Dama Ali Volcano (Lake Abbe / Afar)', lat: 11.28, lng: 41.63, type: 'Active Solfataric Volcanic Field', hazardRadiusKm: 30 },
];

class NaturalDisasterPredictor {
  /**
   * Master Prediction: Generate unified natural disaster risk assessment for any coordinate or Woreda
   * @param {Object} params
   * @param {number} params.lat - Latitude
   * @param {number} params.lng - Longitude
   * @param {string} [params.woredaName] - Woreda name
   */
  async predictMultiHazardDisasters({ lat, lng, woredaName = 'Target Area' }) {
    const latitude = Number(lat);
    const longitude = Number(lng);

    logger.info(`[NaturalDisasterPredictor] Evaluating integrated risk risks for [${latitude}, ${longitude}] (${woredaName})`);

    // 1. Fetch Remote Sensing Data (Sentinel-1 SAR, Sentinel-2 MSI, DEM)
    const planetary = await earthEngineConnector.fetchPlanetaryMetrics({
      lat: latitude,
      lng: longitude,
      level: 'WOREDA',
    });

    const elevation = planetary.elevationMeters || 1800;
    const ndvi = planetary.sentinel2Ndvi || 0.55;
    const soilMoisture = planetary.soilMoisturePct || 45.0;

    // 2. Pillar 1: Seismology & Earthquake Hazard
    const seismicData = await seismologyHazardEngine.assessLocationSeismicRisk(latitude, longitude);

    // 3. Pillar 2: Soil Degradation & Land Loss (RUSLE)
    const soilDegradation = await soilDegradationEngine.assessSoilDegradation({
      lat: latitude,
      lng: longitude,
      woredaName,
    });

    // 4. Pillar 3: Landslides & Mudflow Susceptibility
    const slope = soilDegradation.topography.slopePercent;
    const isHeavySaturation = soilMoisture > 70.0;
    const isSteepHighland = slope > 22.0 && elevation > 2000;

    let landslideScore = 0.1;
    let landslideRisk = 'LOW';
    let landslideRiskAm = 'ዝቅተኛ የመሬት መንሸራተት ስጋት';

    if (isSteepHighland && isHeavySaturation) {
      landslideScore = 0.88;
      landslideRisk = 'CRITICAL_HIGH';
      landslideRiskAm = 'እጅግ ከፍተኛ የመሬት መንሸራተትና የናዳ አደጋ';
    } else if (isSteepHighland || (slope > 15.0 && soilMoisture > 60.0)) {
      landslideScore = 0.55;
      landslideRisk = 'MODERATE';
      landslideRiskAm = 'መካከለኛ የመሬት መንሸራተት ስጋት';
    }

    // 5. Pillar 4: Volcanic & Geothermal Proximity
    let minVolcanoDistanceKm = Infinity;
    let nearestVolcano = ETHIOPIA_VOLCANIC_CENTERS[0];

    for (const v of ETHIOPIA_VOLCANIC_CENTERS) {
      const d = haversineDistanceKm(latitude, longitude, v.lat, v.lng);
      if (d < minVolcanoDistanceKm) {
        minVolcanoDistanceKm = d;
        nearestVolcano = v;
      }
    }

    const roundedVolcanoDist = Math.round(minVolcanoDistanceKm * 10) / 10;
    let volcanicRisk = 'LOW';
    let volcanicScore = 0.05;

    if (minVolcanoDistanceKm <= nearestVolcano.hazardRadiusKm) {
      volcanicRisk = 'HIGH_PROXIMITY_ZONE';
      volcanicScore = 0.85;
    } else if (minVolcanoDistanceKm <= nearestVolcano.hazardRadiusKm * 2) {
      volcanicRisk = 'MODERATE_BUFFER_ZONE';
      volcanicScore = 0.40;
    }

    // 6. Pillar 5: Flash Floods & River Inundation
    const isLowlandBasin = elevation < 1400 && (soilMoisture > 75.0 || planetary.floodInundationRisk === 'MODERATE_TO_HIGH');
    let floodScore = isLowlandBasin ? 0.82 : (planetary.floodInundationRisk === 'MODERATE_TO_HIGH' ? 0.58 : 0.15);

    // 7. Pillar 6: Drought & Thermal Desiccation
    let droughtScore = ndvi < 0.35 ? 0.85 : (ndvi < 0.48 ? 0.45 : 0.10);

    // 8. Integrated Risk Composite Vulnerability Index (0.0 to 1.0)
    const seismicScore = seismicData.seismicHazard.peakGroundAccelerationG > 0.15 ? 0.85 : (seismicData.seismicHazard.peakGroundAccelerationG > 0.05 ? 0.45 : 0.15);
    const erosionScore = soilDegradation.erosionMetrics.annualSoilLossTonsPerHa > 25.0 ? 0.90 : (soilDegradation.erosionMetrics.annualSoilLossTonsPerHa > 12.0 ? 0.50 : 0.20);

    const compositeDisasterIndex = Math.min(1.0, Math.max(0.0, Math.round((
      seismicScore * 0.20 +
      erosionScore * 0.20 +
      landslideScore * 0.20 +
      floodScore * 0.15 +
      droughtScore * 0.15 +
      volcanicScore * 0.10
    ) * 100) / 100));

    let overallAlertLevel = 'GREEN_SAFE';
    let overallAlertAm = 'አጠቃላይ የተረጋጋ / ደህንነቱ የተጠበቀ';
    let overallAlertOm = 'Nagaa / Qulqulluu';

    if (compositeDisasterIndex >= 0.70) {
      overallAlertLevel = 'RED_CRITICAL_EMERGENCY';
      overallAlertAm = 'ደረጃ ቀይ፡ ከፍተኛ የተፈጥሮ አደጋ ማስጠንቀቂያ!';
      overallAlertOm = 'Sadarkaa Diimaa: Balaa Uumamaa Cimaa!';
    } else if (compositeDisasterIndex >= 0.45) {
      overallAlertLevel = 'ORANGE_HIGH_ALERT';
      overallAlertAm = 'ደረጃ ብርቱካናማ፡ ከፍተኛ ጥንቃቄ የሚያስፈልግ';
      overallAlertOm = 'Sadarkaa Bifa Burtukaanaa: Ofeeggannoo Cimaa';
    } else if (compositeDisasterIndex >= 0.25) {
      overallAlertLevel = 'YELLOW_WATCH';
      overallAlertAm = 'ደረጃ ቢጫ፡ መካከለኛ ክትትል የሚደረግበት';
      overallAlertOm = 'Sadarkaa Keelloo: Hordoffii Barbaachisa';
    }

    // Top Disaster Drivers ranked by severity
    const hazardDrivers = [
      { hazard: 'EARTHQUAKE_SEISMIC', score: seismicScore, details: `${seismicData.nearestFaultSystem.name} (${seismicData.seismicHazard.riskLevel})` },
      { hazard: 'SOIL_EROSION_DEGRADATION', score: erosionScore, details: `${soilDegradation.erosionMetrics.annualSoilLossTonsPerHa} t/ha/yr (${soilDegradation.erosionMetrics.severityCategory})` },
      { hazard: 'LANDSLIDE_MUDFLOW', score: landslideScore, details: `${landslideRisk} (Slope: ${slope}%, Soil Moisture: ${soilMoisture}%)` },
      { hazard: 'FLASH_FLOOD', score: floodScore, details: planetary.floodInundationRisk },
      { hazard: 'DROUGHT_DESICCATION', score: droughtScore, details: planetary.droughtStressAnomaly },
      { hazard: 'VOLCANIC_GEOTHERMAL', score: volcanicScore, details: `${nearestVolcano.name} (${roundedVolcanoDist} km away)` },
    ].sort((a, b) => b.score - a.score);

    return {
      coordinates: { lat: latitude, lng: longitude },
      woredaName,
      assessedAt: new Date().toISOString(),
      compositeDisasterIndex,
      overallAlertLevel,
      overallAlertAm,
      overallAlertOm,
      primaryNaturalThreat: hazardDrivers[0],
      top3DisasterRisks: hazardDrivers.slice(0, 3),
      detailedPillars: {
        seismology: seismicData,
        soilDegradation,
        landslides: {
          score: landslideScore,
          riskLevel: landslideRisk,
          riskLevelAm: landslideRiskAm,
          slopePercent: slope,
          soilSaturationPct: soilMoisture,
        },
        volcanology: {
          nearestVolcano: nearestVolcano.name,
          distanceKm: roundedVolcanoDist,
          riskLevel: volcanicRisk,
          volcanoType: nearestVolcano.type,
        },
        hydrologyFlood: {
          score: floodScore,
          floodInundationRisk: planetary.floodInundationRisk,
          elevationMeters: elevation,
        },
        droughtClimate: {
          score: droughtScore,
          sentinel2Ndvi: ndvi,
          droughtStressAnomaly: planetary.droughtStressAnomaly,
        },
      },
      recommendedEmergencyActions: this._synthesizeEmergencyActions(hazardDrivers[0], woredaName),
    };
  }

  _synthesizeEmergencyActions(primaryThreat, woredaName) {
    if (primaryThreat.hazard === 'EARTHQUAKE_SEISMIC') {
      return {
        en: `Inspect building foundations, irrigation channels, and dam spillways in ${woredaName}. Enforce seismic code standards.`,
        am: `በ${woredaName} የህንፃዎችን መዋቅር፣ የመስኖ ቦዮችንና የውሃ ማቆሪያ ግድቦችን የመሰነጣጠቅ አደጋ ይፈትሹ።`,
        om: `Waajjiraalee fi hidha bishaanii aanaa ${woredaName} keessatti argaman sochii lafaaf sakatta'aa.`,
      };
    }

    if (primaryThreat.hazard === 'SOIL_EROSION_DEGRADATION') {
      return {
        en: `Implement emergency watershed terracing (Fanya Juu), plant Vetiver grass, and apply Agricultural Lime in ${woredaName}.`,
        am: `በ${woredaName} አፋጣኝ የተፋሰስ እርከን ስራ (ፋንያ ጁ) ይተግብሩ፤ የቬቲቨር ሣር ይትከሉ፤ የእርሻ ኖራ ይጠቀሙ።`,
        om: `Hojii daagaa qonnaa fi Marga Vetiiveerii aanaa ${woredaName} keessatti hatattamaan hojjadhaa.`,
      };
    }

    if (primaryThreat.hazard === 'LANDSLIDE_MUDFLOW') {
      return {
        en: `Evacuate homesteads located on steep saturated slopes (>22°). Divert surface run-off in ${woredaName}.`,
        am: `ለመሬት መንሸራተት ተጋላጭ በሆኑ ቁልቁለታማ ዳገቶች ላይ የሚገኙ ሰዎችን ያስጠነቅቁ፤ የዝናብ ጎርፍ ማስቀየሻ ቦዮችን ያዘጋጁ።`,
        om: `Namoota tulluuwwan sigiga lafaaf saaxilaman irra jiraatan hatattamaan akeekkachiisaa.`,
      };
    }

    return {
      en: `Maintain active monitoring of weather and integrated risk remote sensing streams for ${woredaName}.`,
      am: `ለ${woredaName} የአየር ሁኔታና የሳተላይት መረጃዎችን በንቃት መከታተልዎን ይቀጥሉ።`,
      om: `Haala qilleensaa fi odeeffannoo saatalayitii aanaa ${woredaName} hordofaa.`,
    };
  }
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  return calculateDistance(lat1, lon1, lat2, lon2);
}

module.exports = new NaturalDisasterPredictor();
