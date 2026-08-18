const request = require('supertest');
const app = require('../../src/app');
const { generateAccessToken } = require('../../src/modules/auth/auth.service');

describe('Alerts & Disease Diagnosis API Suite', () => {
  const officerUser = {
    id: 'usr_officer_01',
    phoneNumber: '+251911998877',
    role: 'WOREDA_OFFICER',
  };
  const officerToken = generateAccessToken(officerUser);

  const farmerUser = { id: 'usr_farmer_01', phoneNumber: '+251911223344', role: 'FARMER' };
  const farmerToken = generateAccessToken(farmerUser);

  describe('Alerts Module', () => {
    it('POST /api/v1/alerts - should create and dispatch an early warning alert (Woreda Officer)', async () => {
      const res = await request(app)
        .post('/api/v1/alerts')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          woredaId: 'woreda_adama_01',
          woredaName: 'Adama Zuria',
          hazardType: 'DROUGHT',
          severity: 'HIGH',
          titleEn: 'Severe Drought Early Warning',
          titleAm: 'የከፋ የድርቅ ማስጠንቀቂያ',
          messageEn: 'Prepare supplemental irrigation.',
          messageAm: 'ተጨማሪ መስኖ ያዘጋጁ።',
          targetPhones: ['+251911223344'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.hazardType).toBe('DROUGHT');
    });

    it('GET /api/v1/alerts - should list active early warnings', async () => {
      const res = await request(app)
        .get('/api/v1/alerts?severity=HIGH')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Disease Diagnosis Module', () => {
    it('POST /api/v1/disease-diagnosis/diagnose - should analyze crop image from JSON URL', async () => {
      const res = await request(app)
        .post('/api/v1/disease-diagnosis/diagnose')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          farmId: 'farm_demo_01',
          cropType: 'Wheat',
          imageUrl: 'https://storage.agrietech.et/photos/wheat_rust_sample.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.diseaseName).toBeDefined();
      expect(res.body.data.confidenceScore).toBeGreaterThan(0.8);
      expect(res.body.data.treatmentEn).toBeDefined();
      expect(res.body.data.treatmentAm).toBeDefined();
    });

    it('POST /api/v1/disease-diagnosis/diagnose - should handle multipart camera photo / file upload', async () => {
      const fakeImageBuffer = Buffer.from('fake-image-bytes-from-camera');

      const res = await request(app)
        .post('/api/v1/disease-diagnosis/diagnose')
        .set('Authorization', `Bearer ${farmerToken}`)
        .field('farmId', 'farm_demo_01')
        .field('cropType', 'MAIZE')
        .attach('image', fakeImageBuffer, 'camera_leaf_snap.jpg');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cropIdentified).toBe('Maize (Zea mays)');
      expect(res.body.data.diseaseName).toBeDefined();
      expect(res.body.data.imageUrl).toContain('/uploads/diagnoses/');
    });

    it('GET /api/v1/disease-diagnosis/farm/:farmId - should retrieve farm diagnosis history', async () => {
      const res = await request(app)
        .get('/api/v1/disease-diagnosis/farm/farm_demo_01')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
