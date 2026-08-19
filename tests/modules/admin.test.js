const request = require('supertest');
const app = require('../../src/app');

describe('Admin Module & Operations Suite', () => {
  it('GET /api/v1/admin/overview - should return system-wide KPI metrics and status', async () => {
    const res = await request(app).get('/api/v1/admin/overview');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.totalUsers).toBeGreaterThan(0);
    expect(res.body.data.metrics.roleDistribution).toBeDefined();
    expect(res.body.data.system.status).toBe('OPERATIONAL');
  });

  it('GET /api/v1/admin/users - should return paginated users list', async () => {
    const res = await request(app).get('/api/v1/admin/users?page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.page).toBe(1);
  });

  it('PATCH /api/v1/admin/users/:id/role - should update user role', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/users/usr_farmer_01/role')
      .send({ role: 'DEVELOPMENT_AGENT' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('DEVELOPMENT_AGENT');
  });

  it('PATCH /api/v1/admin/users/:id/role - should reject invalid role', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/users/usr_farmer_01/role')
      .send({ role: 'SUPER_HERO' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('PATCH /api/v1/admin/users/:id/status - should update user verification status', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/users/usr_farmer_01/status')
      .send({ isEmailVerified: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isEmailVerified).toBe(true);
  });

  it('GET /api/v1/admin/system/health - should return deep diagnostics', async () => {
    const res = await request(app).get('/api/v1/admin/system/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subsystems).toBeDefined();
    expect(res.body.data.subsystems.database).toBeDefined();
    expect(res.body.data.subsystems.jobQueue).toBeDefined();
    expect(res.body.data.subsystems.memory).toBeDefined();
  });

  it('POST /api/v1/admin/ingestion/trigger - should schedule manual ingestion job', async () => {
    const res = await request(app)
      .post('/api/v1/admin/ingestion/trigger')
      .send({ jobType: 'pullChirpsRainfall' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBeDefined();
    expect(res.body.data.jobType).toBe('pullChirpsRainfall');
  });

  it('POST /api/v1/admin/broadcast-alert - should dispatch emergency alert', async () => {
    const res = await request(app)
      .post('/api/v1/admin/broadcast-alert')
      .send({
        woredaId: 'woreda_adama_01',
        hazardType: 'FLOOD',
        severity: 'CRITICAL',
        titleEn: 'Flash Flood Warning - Awash Basin',
        titleAm: 'የአዋሽ ተፋሰስ የጎርፍ አደጋ ማስጠንቀቂያ',
        messageEn: 'Severe upstream discharge observed. Relocate livestock from riverbanks.',
        messageAm: 'ከፍተኛ የጎርፍ መጠን ስለታየ ከወንዝ ዳርቻ እንስሳትን ያርቁ።',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.titleEn).toContain('Flash Flood Warning');
  });

  it('GET /api/v1/admin/audit-logs - should return audit trail entries', async () => {
    const res = await request(app).get('/api/v1/admin/audit-logs?limit=10');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /admin/dashboard - should render interactive HTML admin dashboard', async () => {
    const res = await request(app).get('/admin/dashboard');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('AgriEtech | Enterprise Admin');
  });
});
