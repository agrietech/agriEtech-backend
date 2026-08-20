const { PrismaClient } = require('@prisma/client');
const env = require('./env');
const logger = require('../utils/logger');

let prisma;

try {
  // Prisma 7 driver adapter support with pg Pool
  const { PrismaPg } = require('@prisma/adapter-pg');
  const { Pool } = require('pg');

  const connectionString = env.DATABASE_URL;
  if (connectionString) {
    const isRemote =
      connectionString.includes('supabase') ||
      connectionString.includes('render') ||
      connectionString.includes('aws') ||
      connectionString.includes('pooler');

    const pool = new Pool({
      connectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    });

    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({
      adapter,
      log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } else {
    prisma = new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
} catch (_err) {
  // Fallback to standard PrismaClient initialization
  prisma = new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

let isDbConnected = false;

// Connect to database
async function connectDB() {
  try {
    await prisma.$connect();
    isDbConnected = true;
    logger.info('Database connected successfully');
  } catch (error) {
    isDbConnected = false;
    logger.warn(`Database connection notice: ${error.message}`);
    if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
      throw error;
    }
  }
}

// Disconnect from database
async function disconnectDB() {
  try {
    await prisma.$disconnect();
  } catch (_e) {}
  isDbConnected = false;
}

// Check database connection status
function isConnected() {
  return isDbConnected;
}

module.exports = {
  prisma,
  connectDB,
  disconnectDB,
  isConnected,
};
