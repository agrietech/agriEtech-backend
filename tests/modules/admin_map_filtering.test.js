const request = require('supertest');
const app = require('../../src/app');

describe('Admin GIS Spatial Map Filtering Suite', () => {
  it('GET /api/v1/admin/alerts - should return alerts with Ethiopian woreda spatial attributes', async () => {
    const res = await request(app).get('/api/v1/admin/alerts');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.alerts)).toBe(true);
    expect(res.body.data.alerts.length).toBeGreaterThan(0);

    const first = res.body.data.alerts[0];
    expect(first.hazardType).toBeDefined();
    expect(first.severity).toBeDefined();
    expect(first.woreda).toBeDefined();
    expect(typeof first.woreda.centerLat).toBe('number');
    expect(typeof first.woreda.centerLng).toBe('number');
  });

  it('GET /api/v1/admin/alerts?hazardType=DROUGHT - should filter alerts exclusively for Drought', async () => {
    const res = await request(app).get('/api/v1/admin/alerts?hazardType=DROUGHT');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.alerts)).toBe(true);
    res.body.data.alerts.forEach(alert => {
      expect(alert.hazardType).toBe('DROUGHT');
    });
  });

  it('GET /api/v1/admin/alerts?severity=CRITICAL - should filter alerts exclusively by Critical severity', async () => {
    const res = await request(app).get('/api/v1/admin/alerts?severity=CRITICAL');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.alerts.forEach(alert => {
      expect(alert.severity).toBe('CRITICAL');
    });
  });

  it('GET /api/v1/admin/alerts?woredaId=woreda_adama_01 - should filter alerts by target woreda', async () => {
    const res = await request(app).get('/api/v1/admin/alerts?woredaId=woreda_adama_01');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.alerts.forEach(alert => {
      expect(alert.woredaId === 'woreda_adama_01' || alert.woreda?.nameEn?.toLowerCase().includes('adama')).toBe(true);
    });
  });

  it('GET /api/v1/admin/alerts?regionId=Oromia - should filter alerts by Ethiopian region', async () => {
    const res = await request(app).get('/api/v1/admin/alerts?regionId=Oromia');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.alerts.forEach(alert => {
      const regionName = alert.woreda?.zone?.region?.nameEn || alert.woreda?.zone?.regionId;
      expect(regionName?.toLowerCase()).toContain('oromia');
    });
  });
});
