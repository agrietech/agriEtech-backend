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
 * Ensures DATABASE_URL always uses IPv4-compatible endpoints.
 * Supabase direct 'db.<project>.supabase.co' is IPv6-only and fails on Render.
 * We automatically rewrite it to the IPv4-compatible Supabase Pooler.
 */
function resolveIpv4DatabaseUrl(url) {
  if (!url || typeof url !== 'string') return url;

  let cleanUrl = url.trim();

  // If using direct Supabase URL (db.<project>.supabase.co), convert to Supavisor Pooler URL
  if (cleanUrl.includes('db.') && cleanUrl.includes('.supabase.co')) {
    const match = cleanUrl.match(/postgresql:\/\/([^:]+):([^@]+)@db\.([^.]+)\.supabase\.co:(\d+)\/([^?]+)(\?.*)?/);
    if (match) {
      const user = match[1];
      const pass = match[2];
      const projectRef = match[3];
      const dbName = match[5];
      const queryParams = match[6] || '';
      const poolerUser = user.includes('.') ? user : `${user}.${projectRef}`;
      cleanUrl = `postgresql://${poolerUser}:${pass}@aws-0-ap-northeast-2.pooler.supabase.com:5432/${dbName}${queryParams}`;
      logger.info('[DB Config] Automatically converted IPv6-only Supabase direct host to IPv4 Pooler host');
    }
  }

  return cleanUrl;
}

const connectionString = resolveIpv4DatabaseUrl(env.DATABASE_URL || process.env.DATABASE_URL || '');

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
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
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
