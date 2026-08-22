const request = require('supertest');
const app = require('../../src/app');
const { generateAccessToken } = require('../../src/modules/auth/auth.service');

describe('Sensors Module API Suite', () => {
  const user = { id: 'usr_farmer_01', phoneNumber: '+251911223344', role: 'FARMER' };
  const token = generateAccessToken(user);

  it('POST /api/v1/sensors - should register an IoT probe', async () => {
    const res = await request(app)
      .post('/api/v1/sensors')
      .set('Authorization', `Bearer ${token}`)
      .send({
        farmId: 'farm_demo_01',
        hardwareId: 'AGRI-NODE-ETH-099',
        sensorType: 'SOIL_MOISTURE',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hardwareId).toBe('AGRI-NODE-ETH-099');
  });

  it('POST /api/v1/sensors/telemetry - should record telemetry readings', async () => {
    const res = await request(app).post('/api/v1/sensors/telemetry').send({
      sensorId: 'AGRI-NODE-ETH-099',
      soilMoisture: 42.5,
      soilTemp: 21.8,
      ambientTemp: 26.2,
      humidity: 68,
      rainfallMm: 5.4,
      batteryLevel: 98,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.soilMoisture).toBe(42.5);
  });

  it('GET /api/v1/sensors/my-sensors - should return all sensors owned by logged-in farmer', async () => {
    const res = await request(app)
      .get('/api/v1/sensors/my-sensors')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/sensors/claim - should allow farmer to claim/attach an IoT device', async () => {
    const res = await request(app)
      .post('/api/v1/sensors/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({
        farmId: 'farm_demo_01',
        hardwareId: 'ARDUINO-MOISTURE-01',
        sensorType: 'SOIL_MOISTURE',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hardwareId).toBe('ARDUINO-MOISTURE-01');
  });
});
