const request = require('supertest');
const app = require('../../src/app');
const { generateAccessToken } = require('../../src/modules/auth/auth.service');

describe('Satellite Observations & Risk Assessments Suite', () => {
  beforeAll(async () => {
    const { prisma } = require('../../src/config/db');
    await prisma.region.upsert({
      where: { id: 'reg_oromia_01' },
      update: {},
      create: { id: 'reg_oromia_01', nameEn: 'Oromia', nameAm: 'ኦሮሚያ', code: 'ET-OR' },
    });
    await prisma.zone.upsert({
      where: { id: 'zone_east_shewa_01' },
      update: {},
      create: { id: 'zone_east_shewa_01', nameEn: 'East Shewa', nameAm: 'ምስራቅ ሸዋ', regionId: 'reg_oromia_01' },
    });
    await prisma.woreda.upsert({
      where: { id: 'woreda_adama_01' },
      update: {},
      create: { id: 'woreda_adama_01', nameEn: 'Adama Zuria', nameAm: 'አዳማ ዙሪያ', zoneId: 'zone_east_shewa_01', centerLat: 8.54, centerLng: 39.27 },
    });
    await prisma.satelliteObservation.upsert({
      where: {
        woredaId_observationDate_source: {
          woredaId: 'woreda_adama_01',
          observationDate: new Date('2026-08-01'),
          source: 'CHIRPS',
        },
      },
      update: {},
      create: {
        woredaId: 'woreda_adama_01',
        observationDate: new Date('2026-08-01'),
        source: 'CHIRPS',
        chirpsRainfallMm: 45.2,
      },
    });
  });

  const officerUser = {
    id: 'usr_officer_01',
    phoneNumber: '+251911998877',
    role: 'WOREDA_OFFICER',
    woredaId: 'woreda_adama_01',
  };
  const token = generateAccessToken(officerUser);

  it('GET /api/v1/satellite-observations/woreda/:woredaId - should query satellite time series', async () => {
    const res = await request(app)
      .get('/api/v1/satellite-observations/woreda/woreda_adama_01?source=CHIRPS')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].chirpsRainfallMm).toBeDefined();
  });

  it('POST /api/v1/risk-assessments/evaluate - should compute multi-hazard risk and return alert tier', async () => {
    const res = await request(app)
      .post('/api/v1/risk-assessments/evaluate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        woredaId: 'woreda_adama_01',
        hazardScores: {
          drought: 0.8,
          flood: 0.1,
          locust: 0.3,
          vegetation: 0.5,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.compositeScore).toBeGreaterThan(0);
    expect(res.body.data.alertLevel).toBeDefined();
    expect(res.body.data.recommendations).toBeDefined();
  });

  it('GET /api/v1/risk-assessments/woreda/:woredaId - should get latest risk assessment for woreda', async () => {
    const res = await request(app)
      .get('/api/v1/risk-assessments/woreda/woreda_adama_01')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
