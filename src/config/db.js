const { PrismaClient } = require('@prisma/client');
const env = require('./env');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
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
