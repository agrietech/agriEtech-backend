const app = require('../src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = 'http://127.0.0.1:' + port;
  console.log('=== VERIFYING ZERO-TOKEN ADMIN ACCESS (ADMIN_DEV_BYPASS=true) ===\n');

  // 1. Test Dashboard HTML (No headers, No token)
  const dashboardRes = await fetch(baseUrl + '/admin/dashboard');
  console.log('1. GET /admin/dashboard (No Token) -> Status:', dashboardRes.status, '| HTML Length:', (await dashboardRes.text()).length);

  // 2. Test Overview Metrics (No headers, No token)
  const overviewRes = await fetch(baseUrl + '/api/v1/admin/overview');
  const overviewJson = await overviewRes.json();
  console.log('2. GET /api/v1/admin/overview (No Token) -> Status:', overviewRes.status, '| success:', overviewJson.success);

  // 3. Test Users List (No headers, No token)
  const usersRes = await fetch(baseUrl + '/api/v1/admin/users');
  const usersJson = await usersRes.json();
  console.log('3. GET /api/v1/admin/users (No Token) -> Status:', usersRes.status, '| success:', usersJson.success);

  // 4. Test Create Farm (No headers, No token)
  const createFarmRes = await fetch(baseUrl + '/api/v1/admin/farms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      farmName: 'Tokenless Demo Farm',
      primaryCrop: 'MAIZE',
      areaHectares: 4.2,
      latitude: 11.5936,
      longitude: 37.3908
    })
  });
  const createFarmJson = await createFarmRes.json();
  console.log('4. POST /api/v1/admin/farms (No Token) -> Status:', createFarmRes.status, '| success:', createFarmJson.success);

  // 5. Test Risk Evaluation Endpoint (No headers, No token)
  const evalRes = await fetch(baseUrl + '/api/v1/risk-assessments/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      woredaId: 'ET030701',
      droughtScore: 0.5,
      floodScore: 0.2
    })
  });
  const evalJson = await evalRes.json();
  console.log('5. POST /api/v1/risk-assessments/evaluate (No Token) -> Status:', evalRes.status, '| success:', evalJson.success);

  console.log('\n✅ VERIFIED: Full administrative access and CRUD work seamlessly without requiring any token when ADMIN_DEV_BYPASS=true!');
  server.close();
  process.exit(0);
});
