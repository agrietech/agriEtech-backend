/**
 * @file backfillHistoricalWeather.js
 * @description Backfills 5 years of historical Open-Meteo & CHIRPS weather data for baseline statistical model fitting.
 * @usage node scripts/backfillHistoricalWeather.js --woreda=all
 * @author Ingestion / Data Engineer
 */

async function main() {
  console.log('Backfilling historical weather data...');
  // TODO: Fetch multi-year climate record and populate SatelliteObservation table
}

main();
