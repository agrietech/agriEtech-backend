const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

let isDbConnected = false;

// Connect to database
async function connectDB() {
  try {
    await prisma.$connect();
    isDbConnected = true;
    logger.info('Database connected successfully');
  } catch (error) {
    isDbConnected = false;
    if (env.NODE_ENV === 'production') {
      logger.error(`Database connection failed: ${error.message}`);
      throw error;
    }
  }
}

// Disconnect from database
async function disconnectDB() {
  await prisma.$disconnect();
  await pool.end();
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
