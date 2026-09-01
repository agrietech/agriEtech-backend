const { FirebaseSensorConnector } = require('../src/ingestion/connectors/firebaseSensorConnector');
const { prisma, connectDB } = require('../src/config/db');

async function checkSensors() {
  console.log('==============================================');
  console.log('     CHECKING SENSOR SUBSYSTEM INTEGRATION    ');
  console.log('==============================================\n');

  // 1. Check PostgreSQL Database Sensor Records
  console.log('1. Querying PostgreSQL Database for Sensors & Readings...');
  await connectDB();
  const sensorCount = await prisma.sensor.count();
  const readingCount = await prisma.sensorReading.count();
  const sensors = await prisma.sensor.findMany({
    take: 10,
    include: {
      farm: { select: { farmName: true, latitude: true, longitude: true, woredaId: true } },
      readings: { take: 3, orderBy: { recordedAt: 'desc' } }
    }
  });

  console.log(`Total Registered Sensors in DB: ${sensorCount}`);
  console.log(`Total Sensor Readings in DB: ${readingCount}`);
  console.log('\nRegistered Sensors:');
  sensors.forEach(s => {
    console.log(`- Sensor [${s.hardwareId}] (${s.sensorType}) on farm "${s.farm?.farmName || 'N/A'}": Active=${s.isActive}, ReadingsCount=${s.readings.length}`);
    if (s.readings.length > 0) {
      const r = s.readings[0];
      console.log(`  Latest Reading: SoilMoisture=${r.soilMoisture}%, AmbientTemp=${r.ambientTemp}°C, SoilTemp=${r.soilTemp}°C, Humidity=${r.humidity}%, RecordedAt=${r.recordedAt}`);
    }
  });

  // 2. Check Firebase Realtime Database
  console.log('\n2. Testing Firebase Realtime Database Connector...');
  const connector = new FirebaseSensorConnector();
  const fbTest = await connector.testConnection();
  console.log('Firebase Endpoint:', fbTest.endpoint);
  console.log('Firebase Connection Status:', fbTest.statusCode || (fbTest.success ? 200 : 'Error'));
  if (fbTest.statusCode === 401) {
    console.log('Notice: Firebase Realtime Database requires read permissions / Firebase Auth Token or open read rules.');
  }
}

checkSensors().catch(console.error).finally(() => process.exit(0));
