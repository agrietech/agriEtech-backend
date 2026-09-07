const request = require('supertest');
const app = require('../../src/app');

describe('Boundaries Module API Suite', () => {
  beforeAll(async () => {
    const { prisma } = require('../../src/config/db');
    await prisma.region.upsert({
      where: { id: 'reg_oromia_01' },
      update: {},
      create: {
        id: 'reg_oromia_01',
        nameEn: 'Oromia',
        nameAm: 'ኦሮሚያ',
        code: 'ET-OR',
      },
    });

    await prisma.zone.upsert({
      where: { id: 'zone_east_shewa_01' },
      update: {},
      create: {
        id: 'zone_east_shewa_01',
        nameEn: 'East Shewa',
        nameAm: 'ምስራቅ ሸዋ',
        regionId: 'reg_oromia_01',
      },
    });

    await prisma.woreda.upsert({
      where: { id: 'woreda_adama_01' },
      update: {},
      create: {
        id: 'woreda_adama_01',
        nameEn: 'Adama Zuria',
        nameAm: 'አዳማ ዙሪያ',
        zoneId: 'zone_east_shewa_01',
        centerLat: 8.54,
        centerLng: 39.27,
      },
    });
  });
  it('GET /api/v1/boundaries/regions - should return administrative regions list', async () => {
    const res = await request(app).get('/api/v1/boundaries/regions');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].nameEn).toBeDefined();
  });

  it('GET /api/v1/boundaries/woredas - should return list of woredas', async () => {
    const res = await request(app).get('/api/v1/boundaries/woredas?zoneId=zone_east_shewa_01');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/boundaries/woredas/:id - should return woreda detail with centroid and boundary', async () => {
    const res = await request(app).get('/api/v1/boundaries/woredas/woreda_adama_01');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nameEn).toBe('Adama Zuria');
    expect(res.body.data.centerLat).toBeDefined();
    expect(res.body.data.centerLng).toBeDefined();
  });
});
