/**
 * AgriEtech Admin Role Creation / Promotion CLI Command
 *
 * Usage:
 *   node scripts/create_admin_user.js <email> [password] [fullName]
 *
 * Examples:
 *   node scripts/create_admin_user.js abraham.tiruneh7@gmail.com
 *   node scripts/create_admin_user.js admin@agrietech.et Admin12345! "System Admin"
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { prisma, isConnected } = require('../src/config/db');

async function createOrPromoteAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || '').trim().toLowerCase();
  const password = args[1] || 'Admin123!';
  const fullName = args[2] || 'Platform Administrator';

  if (!email) {
    console.log('========================================================================');
    console.log('            AGRIETECH ADMIN ACCOUNT PROMOTION CLI');
    console.log('========================================================================\n');
    console.log('❌ Error: Email address is required.\n');
    console.log('Usage:');
    console.log('  node scripts/create_admin_user.js <email> [password] [fullName]\n');
    console.log('Examples:');
    console.log('  node scripts/create_admin_user.js abraham.tiruneh7@gmail.com');
    console.log('  node scripts/create_admin_user.js admin@agrietech.et MySecurePassword123! "Abraham Tiruneh"\n');
    process.exit(1);
  }

  console.log('========================================================================');
  console.log('            AGRIETECH ADMIN ACCOUNT PROMOTION CLI');
  console.log('========================================================================\n');

  try {
    console.log(`🔍 Checking database for account: ${email}...`);
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existingUser) {
      console.log(`\n👤 User found: "${existingUser.fullName}" (Current Role: ${existingUser.role})`);
      
      const updateData = {
        role: 'ADMIN',
        isEmailVerified: true,
      };

      if (args[1]) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
        console.log('🔑 Updating password to the new provided password...');
      }

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      });

      console.log('\n========================================================================');
      console.log('✅ USER SUCCESSFULLY PROMOTED TO ADMIN ROLE!');
      console.log('========================================================================');
      console.log(`  • ID:            ${updatedUser.id}`);
      console.log(`  • Full Name:     ${updatedUser.fullName}`);
      console.log(`  • Email:         ${updatedUser.email}`);
      console.log(`  • Role:          ${updatedUser.role} (Super Admin Access)`);
      console.log(`  • Email Status:  Verified (Active)`);
      console.log(`  • Updated At:    ${updatedUser.updatedAt}`);
      console.log('========================================================================\n');
      console.log('🌐 You can now log in at:');
      console.log('   Local:      http://localhost:5000/admin/dashboard');
      console.log('   Production: https://agrietech-backend.onrender.com/admin/dashboard\n');
    } else {
      console.log(`\nℹ️ User not found. Creating a brand new ADMIN account for ${email}...`);
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          fullName,
          passwordHash,
          role: 'ADMIN',
          isEmailVerified: true,
          preferredLang: 'en',
        },
      });

      console.log('\n========================================================================');
      console.log('✅ NEW ADMIN ACCOUNT CREATED SUCCESSFULLY!');
      console.log('========================================================================');
      console.log(`  • ID:            ${newUser.id}`);
      console.log(`  • Full Name:     ${newUser.fullName}`);
      console.log(`  • Email:         ${newUser.email}`);
      console.log(`  • Password:      ${password}`);
      console.log(`  • Role:          ${newUser.role} (Super Admin Access)`);
      console.log(`  • Email Status:  Verified (Active)`);
      console.log('========================================================================\n');
      console.log('🌐 You can now log in at:');
      console.log('   Local:      http://localhost:5000/admin/dashboard');
      console.log('   Production: https://agrietech-backend.onrender.com/admin/dashboard\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Failed to create/promote admin user:', err.message);
    process.exit(1);
  }
}

createOrPromoteAdmin();
