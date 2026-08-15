// Calibrate in-situ soil moisture probe with remote sensing satellite data
function calibrateSoilMoisture(sensorMoisturePct, satelliteMoistureM3m3) {
  const satelliteMoisturePct = satelliteMoistureM3m3 * 100;
  const offset = sensorMoisturePct - satelliteMoisturePct;
  const calibrated = 0.7 * sensorMoisturePct + 0.3 * satelliteMoisturePct;

  return {
    calibratedMoisturePct: Math.round(calibrated * 10) / 10,
    offset: Math.round(offset * 10) / 10,
    reliabilityConfidence: Math.abs(offset) > 15 ? 0.7 : 0.95,
  };
}

module.exports = {
  calibrateSoilMoisture,
};
