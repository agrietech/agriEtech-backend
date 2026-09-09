const request = require('supertest');
const app = require('../../src/app');
const weatherService = require('../../src/modules/weather/weather.service');

describe('Weather API & Multi-Source Telemetry Suite', () => {
  describe('weatherService.getWeatherForecast', () => {
    it('should retrieve real meteorological forecast starting today', async () => {
      const forecast = await weatherService.getWeatherForecast({
        lat: 9.03,
        lng: 38.74,
      });

      expect(forecast).toBeDefined();
      expect(forecast.location).toBeDefined();
      expect(forecast.current).toBeDefined();
      expect(forecast.current.temperatureC).toBeDefined();
      expect(typeof forecast.current.temperatureC).toBe('number');

      // Check daily forecast format & rain probability metrics
      expect(Array.isArray(forecast.daily)).toBe(true);
      expect(forecast.daily.length).toBeGreaterThanOrEqual(7);

      const today = forecast.daily[0];
      expect(today.isToday).toBe(true);
      expect(today.date).toBe(new Date().toISOString().split('T')[0]);
      expect(typeof today.precipitationProbability).toBe('number');
      expect(today.precipitationProbability).toBeGreaterThanOrEqual(0);
      expect(today.precipitationProbability).toBeLessThanOrEqual(100);
      expect(typeof today.precipitationMm).toBe('number');
      expect(today.precipitationMm).toBeGreaterThanOrEqual(0);

      // Check hourly 24h curve
      expect(Array.isArray(forecast.hourly)).toBe(true);
      expect(forecast.hourly.length).toBeGreaterThanOrEqual(24);
      expect(forecast.hourly[0].hourLabel).toBeDefined();
      expect(typeof forecast.hourly[0].temperatureC).toBe('number');

      // Check telemetry attribution
      expect(forecast.dataSources).toContain('Open-Meteo');
      expect(forecast.climatology).toBeDefined();
    }, 15000);
  });

  describe('GET /api/v1/weather/forecast endpoint', () => {
    it('should return 200 and standard meteorological data schema', async () => {
      const res = await request(app)
        .get('/api/v1/weather/forecast?lat=9.03&lng=38.74')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.current).toBeDefined();
      expect(res.body.data.daily).toBeDefined();
      expect(res.body.data.daily.length).toBeGreaterThanOrEqual(7);
      expect(res.body.data.hourly).toBeDefined();
    }, 15000);
  });

  describe('GET /api/v1/weather/current endpoint', () => {
    it('should return 200 with current live observations', async () => {
      const res = await request(app)
        .get('/api/v1/weather/current?lat=9.03&lng=38.74')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.current).toBeDefined();
      expect(typeof res.body.data.current.temperatureC).toBe('number');
      expect(res.body.data.current.weatherCode).toBeDefined();
    }, 15000);
  });
});
