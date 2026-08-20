const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

/**
 * Prisma 7 requires a driver adapter. This module always initializes
 * PrismaClient with @prisma/adapter-pg, which is a production dependency.
 */
const connectionString = env.DATABASE_URL || process.env.DATABASE_URL || '';

const isRemote =
  connectionString.includes('supabase') ||
  connectionString.includes('render') ||
  connectionString.includes('aws') ||
  connectionString.includes('pooler') ||
  connectionString.includes('neon');

const pool = new Pool({
  connectionString: connectionString || 'postgresql://localhost:5432/postgres',
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

let isDbConnected = false;

// Connect to database with resilient retry
async function connectDB() {
  try {
    await prisma.$connect();
    isDbConnected = true;
    logger.info('Database connected successfully');
  } catch (error) {
    isDbConnected = false;
    logger.warn(`Database connection notice: ${error.message}`);
  }
}

// Disconnect from database
async function disconnectDB() {
  try {
    await prisma.$disconnect();
  } catch (_e) {
    // Ignore disconnect error during shutdown
  }
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
