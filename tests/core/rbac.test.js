const express = require('express');
const request = require('supertest');
const {
  authenticate,
  authorize,
  authorizeWoredaScope,
} = require('../../src/middleware/auth.middleware');
const { generateAccessToken } = require('../../src/modules/auth/auth.service');
const errorHandler = require('../../src/middleware/errorHandler');

// Create test app with RBAC routes
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Admin-only route
  app.get('/admin-only', authenticate, authorize('ADMIN'), (req, res) => {
    res.json({ success: true, message: 'Admin access granted' });
  });

  // Woreda officer & DA route
  app.get(
    '/officers-only',
    authenticate,
    authorize('WOREDA_OFFICER', 'DEVELOPMENT_AGENT'),
    (req, res) => {
      res.json({ success: true, message: 'Officer access granted' });
    }
  );

  // Woreda-scoped action route
  app.post(
    '/woredas/:woredaId/risk-override',
    authenticate,
    authorizeWoredaScope('woredaId'),
    (req, res) => {
      res.json({ success: true, message: 'Woreda action authorized' });
    }
  );

  app.use(errorHandler);
  return app;
}

describe('Core Backend - RBAC & Boundary Authorization', () => {
  const app = createTestApp();

  const farmerUser = {
    id: 'u1',
    phoneNumber: '+251911000001',
    role: 'FARMER',
    woredaId: 'woreda-oromia-01',
  };
  const officerUser = {
    id: 'u2',
    phoneNumber: '+251911000002',
    role: 'WOREDA_OFFICER',
    woredaId: 'woreda-oromia-01',
  };
  const adminUser = { id: 'u3', phoneNumber: '+251911000003', role: 'ADMIN', woredaId: null };

  const farmerToken = generateAccessToken(farmerUser);
  const officerToken = generateAccessToken(officerUser);
  const adminToken = generateAccessToken(adminUser);

  describe('Role-Based Access Control (authorize)', () => {
    it('should allow ADMIN to access any restricted route', async () => {
      const res = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow WOREDA_OFFICER to access officer route', async () => {
      const res = await request(app)
        .get('/officers-only')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject FARMER on admin-only route with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Woreda Administrative Scoping (authorizeWoredaScope)', () => {
    it('should allow officer to perform action within their assigned woreda', async () => {
      const res = await request(app)
        .post('/woredas/woreda-oromia-01/risk-override')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject officer attempting action in a different woreda (403 OUT_OF_SCOPE)', async () => {
      const res = await request(app)
        .post('/woredas/woreda-amhara-99/risk-override')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OUT_OF_SCOPE');
    });

    it('should allow ADMIN unrestricted access across any woreda', async () => {
      const res = await request(app)
        .post('/woredas/woreda-amhara-99/risk-override')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
