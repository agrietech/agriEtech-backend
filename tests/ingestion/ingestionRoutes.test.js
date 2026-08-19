const request = require('supertest');
const app = require('../../src/app');

describe('Ingestion Layer API Suite', () => {
  it('GET /api/v1/ingestion/connectors - should list all registered satellite and climate connectors', async () => {
    const res = await request(app).get('/api/v1/ingestion/connectors');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(5);
  });

  it('POST /api/v1/ingestion/pull - should schedule on-demand data extraction', async () => {
    const res = await request(app).post('/api/v1/ingestion/pull').send({
      source: 'CHIRPS_RAINFALL',
      lat: 8.54,
      lng: 39.27,
      woredaId: 'woreda_adama_01',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBeDefined();
  });

  it('POST /api/v1/ingestion/telemetry - should ingest gateway sensor payload', async () => {
    const res = await request(app).post('/api/v1/ingestion/telemetry').send({
      sensorId: 'NODE_ETH_001',
      soilMoisture: 38.2,
      soilTemp: 22.1,
      airTemp: 26.5,
      humidity: 64,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sensorId).toBe('NODE_ETH_001');
  });
});
