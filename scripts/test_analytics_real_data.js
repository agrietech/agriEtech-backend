const app = require('../src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = 'http://127.0.0.1:' + port;
  console.log('=== VERIFYING REAL LIVE ANALYTICS DATA PIPELINE ===\n');

  // 1. Dashboard Summary
  const summaryRes = await fetch(baseUrl + '/api/v1/analytics/dashboard-summary');
  const summaryJson = await summaryRes.json();
  console.log('1. GET /api/v1/analytics/dashboard-summary:');
  console.log('   • totalFarmsRegistered:', summaryJson.data?.totalFarmsRegistered);
  console.log('   • activeSensors:', summaryJson.data?.activeSensors);
  console.log('   • activeEarlyWarnings:', summaryJson.data?.activeEarlyWarnings);
  console.log('   • nationalSeasonVigor:', summaryJson.data?.nationalSeasonVigor);

  // 2. Regional Breakdown
  const regionalRes = await fetch(baseUrl + '/api/v1/analytics/regional-breakdown');
  const regionalJson = await regionalRes.json();
  console.log('\n2. GET /api/v1/analytics/regional-breakdown:');
  console.log('   • Total regions loaded:', regionalJson.data?.length);
  if (regionalJson.data && regionalJson.data.length > 0) {
    console.log('   • Sample Region:', regionalJson.data[0]);
  }

  // 3. Temporal Trends
  const trendsRes = await fetch(baseUrl + '/api/v1/analytics/temporal-trends?woredaId=ET030701');
  const trendsJson = await trendsRes.json();
  console.log('\n3. GET /api/v1/analytics/temporal-trends:');
  console.log('   • Success:', trendsJson.success);
  console.log('   • Woreda:', trendsJson.data?.woredaId);
  console.log('   • Metrics points:', trendsJson.data?.metrics?.length || trendsJson.data?.series?.length || 0);

  server.close();
  process.exit(0);
});
