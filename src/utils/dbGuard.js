const { isConnected } = require('../config/db');
const { ServiceUnavailableError } = require('./errors');

/**
 * Database Health Guard
 * 
 * Throws ServiceUnavailableError if the database is not connected.
 * All service functions must call this before performing DB operations,
 * replacing the previous `if (isConnected()) { ... } else { return mockData }` pattern.
 * 
 * In production, we NEVER silently fall back to mock/hardcoded data.
 */
function requireDB() {
  if (!isConnected()) {
    throw new ServiceUnavailableError(
      'Database is temporarily unavailable. Please try again shortly.'
    );
  }
}

module.exports = { requireDB };
