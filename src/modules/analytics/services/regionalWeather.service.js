// Real-time Ethiopian regional centroids for live weather & NDVI computation
const ETHIOPIA_REGIONAL_CENTROIDS = [
  { name: 'Oromia', code: 'ET04', lat: 8.54, lng: 39.27 },
  { name: 'Amhara', code: 'ET03', lat: 11.59, lng: 37.39 },
  { name: 'Tigray', code: 'ET01', lat: 13.49, lng: 39.47 },
  { name: 'Sidama', code: 'ET10', lat: 7.05, lng: 38.47 },
  { name: 'Somali', code: 'ET05', lat: 9.35, lng: 42.80 },
  { name: 'Afar', code: 'ET02', lat: 11.75, lng: 41.00 },
  { name: 'South Ethiopia', code: 'ET07', lat: 6.85, lng: 37.75 },
  { name: 'Benishangul-Gumuz', code: 'ET06', lat: 10.06, lng: 34.54 },
  { name: 'Gambela', code: 'ET12', lat: 8.25, lng: 34.58 },
  { name: 'Harari / Dire Dawa', code: 'ET13', lat: 9.60, lng: 41.86 },
];

async function getLiveRegionalWeatherData(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation&daily=precipitation_sum&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    const current = data.current || {};
    const dailyRain = data.daily?.precipitation_sum?.[0] || 0.0;
    return {
      temp: current.temperature_2m || 22.0,
      humidity: current.relative_humidity_2m || 55.0,
      rain: dailyRain,
    };
  } catch (_) {
    return { temp: 22.0, humidity: 55.0, rain: 0.0 };
  }
}

module.exports = {
  ETHIOPIA_REGIONAL_CENTROIDS,
  getLiveRegionalWeatherData,
};
