const dns = require('node:dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

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
  family: 4, // Enforce IPv4 socket connection
  lookup: (hostname, _options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  max: 10, // Maximum pool size (safely within Supabase pool limit)
  min: 2,  // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Log slow queries in development
if (env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (e.duration > 1000) {
      logger.warn(`[Prisma] Slow query detected (${e.duration}ms): ${e.query.substring(0, 100)}...`);
    }
  });
}

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
