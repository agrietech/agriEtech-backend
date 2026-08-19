const request = require('supertest');
const app = require('../../src/app');
const { generateAccessToken } = require('../../src/modules/auth/auth.service');

describe('Farms Module API Suite', () => {
  const user = { id: 'usr_farmer_01', phoneNumber: '+251911223344', role: 'FARMER' };
  const token = generateAccessToken(user);
  let createdFarmId = '';

  it('POST /api/v1/farms - should register a farm plot with valid coordinates and polygon', async () => {
    const res = await request(app)
      .post('/api/v1/farms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        farmName: 'Bishoftu Wheat Plot Alpha',
        primaryCrop: 'Wheat',
        areaHectares: 3.5,
        latitude: 8.7523,
        longitude: 38.9785,
        woredaId: 'woreda_bishoftu_02',
        polygonGeojson: {
          type: 'Polygon',
          coordinates: [
            [
              [38.978, 8.752],
              [38.98, 8.752],
              [38.98, 8.755],
              [38.978, 8.755],
              [38.978, 8.752],
            ],
          ],
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.farmName).toBe('Bishoftu Wheat Plot Alpha');

    createdFarmId = res.body.data.id;
  });

  it('POST /api/v1/farms - should reject coordinates outside Ethiopia (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/farms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        farmName: 'Invalid Farm Out of Country',
        latitude: 51.5074, // London coordinates
        longitude: -0.1278,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/farms - should list plots belonging to the authenticated user', async () => {
    const res = await request(app).get('/api/v1/farms').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/farms/:id - should get farm details by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/farms/${createdFarmId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.farmName).toBe('Bishoftu Wheat Plot Alpha');
  });
});
