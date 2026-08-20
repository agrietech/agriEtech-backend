const jwt = require('jsonwebtoken');
const app = require('../src/app');
const request = require('supertest');
const env = require('../src/config/env');

const testToken = jwt.sign(
  { id: 'usr_test_farmer_01', email: 'farmer@agrietech.et', role: 'ADMIN' },
  env.JWT_SECRET,
  { expiresIn: '1h' }
);

async function testSuite() {
  console.log('====================================================');
  console.log('       AGRIETECH FULL SYSTEM SERVICE SMOKE TEST');
  console.log('====================================================\n');

  const tests = [
    { name: 'Root API Metadata', method: 'get', url: '/' },
    { name: 'Liveness Healthcheck', method: 'get', url: '/health/liveness' },
    { name: 'Comprehensive Healthcheck', method: 'get', url: '/health' },
    { name: 'Admin Dashboard HTML', method: 'get', url: '/admin/dashboard' },
    { name: 'Admin Overview API', method: 'get', url: '/api/v1/admin/overview', auth: true },
    { name: 'Admin System Health API', method: 'get', url: '/api/v1/admin/system/health', auth: true },
    { name: 'Boundaries Regions', method: 'get', url: '/api/v1/boundaries/regions' },
    { name: 'Boundaries Zones', method: 'get', url: '/api/v1/boundaries/zones' },
    { name: 'Boundaries Woredas', method: 'get', url: '/api/v1/boundaries/woredas' },
    { name: 'Boundaries Woreda Detail', method: 'get', url: '/api/v1/boundaries/woredas/ET040101' },
    { name: 'Analytics Dashboard Summary', method: 'get', url: '/api/v1/analytics/summary', auth: true },
    { name: 'Analytics Regional Breakdown', method: 'get', url: '/api/v1/analytics/regional', auth: true },
    { name: 'Analytics Temporal Trends', method: 'get', url: '/api/v1/analytics/temporal-trends', auth: true },
    { name: 'Analytics Agronomic Advisories', method: 'get', url: '/api/v1/analytics/agronomic-advisories', auth: true },
    { name: 'AI Voice Query (Bilingual)', method: 'post', url: '/api/v1/ai/voice-inquiry', auth: true, body: { textQuestion: 'What is the rain forecast for Adama?' } },
    { name: 'AI Text-to-Speech (Amharic)', method: 'post', url: '/api/v1/ai/text-to-speech', auth: true, body: { text: 'ሰላም ገበሬዎች', language: 'am' } },
    { name: 'Auth Validation Trap (Empty Login)', method: 'post', url: '/api/v1/auth/login', body: {} },
    { name: 'Auth Register Validation (Empty Body)', method: 'post', url: '/api/v1/auth/register', body: {} },
    { name: '404 Catch-All Handler', method: 'get', url: '/api/v1/invalid-route-test' },
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      let req = request(app)[t.method](t.url);
      if (t.auth) {
        req = req.set('Authorization', `Bearer ${testToken}`);
      }
      if (t.body) {
        req = req.send(t.body);
      }
      const res = await req;
      
      const isSuccess = (t.name.includes('404') && res.status === 404) ||
                        (t.name.includes('Validation') && (res.status === 400 || res.status === 422)) ||
                        (res.status >= 200 && res.status < 400) ||
                        (t.name.includes('Healthcheck') && (res.status === 200 || res.status === 503));
      
      if (isSuccess) {
        console.log(`✅ PASS [HTTP ${res.status}]: ${t.name} (${t.url})`);
        passed++;
      } else {
        console.log(`❌ FAIL [HTTP ${res.status}]: ${t.name} (${t.url})`, res.body);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ERROR: ${t.name} (${t.url}): ${err.message}`);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

testSuite();
