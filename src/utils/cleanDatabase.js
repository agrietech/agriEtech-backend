require('dotenv').config();
const { prisma } = require('../config/db');

async function inspectAndClean() {
  console.log('=== AGRIETECH DATABASE SANITIZATION & CLEANUP ===');
  
  // 1. Inspect existing users
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true, role: true, fullName: true } });
  console.log(`Initial Users count: ${allUsers.length}`);

  // 2. Identify test users to clean (like audit_farmer_..., farmer_diag_..., test_..., tmp_...)
  const testUsers = allUsers.filter(u => 
    u.email.startsWith('audit_farmer_') || 
    u.email.startsWith('farmer_diag_') || 
    u.email.startsWith('test_') || 
    u.email.startsWith('mock_') ||
    u.email.startsWith('farmer_178') ||
    u.email.startsWith('woreda_officer_178') ||
    u.email.startsWith('admin_178') ||
    u.email.startsWith('render_test_') ||
    u.email.startsWith('camera_farmer_') ||
    u.email.startsWith('form_user_') ||
    (u.email.includes('test') && u.role !== 'ADMIN' && !u.email.includes('admin@agrietech.et'))
  );

  const testUserIds = testUsers.map(u => u.id);
  console.log(`Found ${testUsers.length} test users to sanitize.`);

  // 3. Delete sensor readings for dummy sensors or test hardware
  const deletedReadings = await prisma.sensorReading.deleteMany({
    where: {
      OR: [
        { sensor: { farm: { userId: { in: testUserIds } } } },
        { sensor: { hardwareId: { in: ['AGRI-NODE-ETH-999', 'ETH-NODE-001', 'AGRI-FIREBASE-STREAM'] } } }
      ]
    }
  });
  console.log(`Deleted ${deletedReadings.count} test sensor readings.`);

  // 4. Delete orphan test sensors
  const deletedSensors = await prisma.sensor.deleteMany({
    where: {
      OR: [
        { hardwareId: { in: ['AGRI-NODE-ETH-999', 'ETH-NODE-001', 'AGRI-FIREBASE-STREAM'] } },
        { hardwareId: { startsWith: 'test' } },
        { farm: { userId: { in: testUserIds } } }
      ]
    }
  });
  console.log(`Deleted ${deletedSensors.count} test sensors.`);

  // 5. Delete test disease diagnoses
  const deletedDiagnoses = await prisma.diseaseDiagnosis.deleteMany({
    where: {
      OR: [
        { farm: { userId: { in: testUserIds } } },
        { farmId: null }
      ]
    }
  });
  console.log(`Deleted ${deletedDiagnoses.count} test disease diagnoses.`);

  // 6. Delete test farms
  const deletedFarms = await prisma.farm.deleteMany({
    where: {
      OR: [
        { userId: { in: testUserIds } },
        { farmName: { startsWith: 'Bishoftu Demonstration Plot #' } },
        { farmName: { startsWith: 'Test Farm' } }
      ]
    }
  });
  console.log(`Deleted ${deletedFarms.count} test farms.`);

  // 7. Delete test users
  if (testUserIds.length > 0) {
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: testUserIds }
      }
    });
    console.log(`Deleted ${deletedUsers.count} test users.`);
  }

  // 8. Verify / Ensure Default Production Admin exists
  const adminEmail = 'admin@agrietech.et';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'AgriEtech System Administrator',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
      }
    });
    console.log(`Provisioned clean Production Admin: ${admin.email}`);
  } else {
    console.log(`Production Admin verified: ${admin.email}`);
  }

  // 9. Summary post-cleanup
  const finalUsers = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  const finalFarms = await prisma.farm.findMany({ select: { id: true, farmName: true, primaryCrop: true } });
  const finalSensors = await prisma.sensor.findMany({ select: { id: true, hardwareId: true } });
  const finalWoredas = await prisma.woreda.count();
  const finalRegions = await prisma.region.count();

  console.log('=== CLEANUP COMPLETE: CURRENT PRODUCTION DATABASE STATUS ===');
  console.log(`• Active Real Users: ${finalUsers.length}`);
  finalUsers.forEach(u => console.log(`   - ${u.email} [${u.role}]`));
  console.log(`• Registered Farms: ${finalFarms.length}`);
  console.log(`• Active IoT Sensors: ${finalSensors.length}`);
  console.log(`• Ethiopian Administrative Woredas Preserved: ${finalWoredas}`);
  console.log(`• Ethiopian Administrative Regions Preserved: ${finalRegions}`);
  
  process.exit(0);
}

inspectAndClean().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
