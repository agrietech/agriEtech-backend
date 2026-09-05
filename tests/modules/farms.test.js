const request = require('supertest');
const app = require('../../src/app');
const { generateAccessToken } = require('../../src/modules/auth/auth.service');
const { prisma, connectDB, disconnectDB } = require('../../src/config/db');
const { disconnectRedis } = require('../../src/config/redis');

describe('Farms Module API Suite', () => {
  const user = { id: 'usr_farmer_01', phoneNumber: '+251911223344', role: 'FARMER' };
  const token = generateAccessToken(user);
  let createdFarmId = '';
  let testWoreda = null;

  beforeAll(async () => {
    await connectDB();
    // Ensure test user exists for foreign key constraint
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        fullName: 'Test Farmer',
        role: 'FARMER',
      },
    }).catch(() => {});

    // Find a valid Ethiopian woreda
    testWoreda = await prisma.woreda.findFirst({
      where: {
        OR: [
          { id: 'ET040709' },
          { nameEn: { contains: 'Bishoftu', mode: 'insensitive' } },
        ],
      },
    }) || await prisma.woreda.findFirst();
  });

  afterAll(async () => {
    if (createdFarmId) {
      await prisma.farm.deleteMany({ where: { id: createdFarmId } }).catch(() => {});
    }
    await prisma.user.deleteMany({ where: { id: user.id } }).catch(() => {});
    await disconnectDB();
    await disconnectRedis();
  });

  it('POST /api/v1/farms - should register a farm plot with valid coordinates and polygon', async () => {
    const lat = testWoreda?.centerLat || 8.7496;
    const lng = testWoreda?.centerLng || 38.9762;
    const offset = 0.002;

    const res = await request(app)
      .post('/api/v1/farms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        farmName: 'Bishoftu Wheat Plot Alpha',
        primaryCrop: 'Wheat',
        areaHectares: 3.5,
        latitude: lat,
        longitude: lng,
        woredaId: testWoreda?.id || 'ET040709',
        polygonGeojson: {
          type: 'Polygon',
          coordinates: [
            [
              [lng - offset, lat - offset],
              [lng + offset, lat - offset],
              [lng + offset, lat + offset],
              [lng - offset, lat + offset],
              [lng - offset, lat - offset],
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
