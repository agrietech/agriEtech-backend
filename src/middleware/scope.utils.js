const { ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Higher-order scope authorization middleware generator
 * @param {'woreda' | 'zone' | 'region'} level
 */
function createScopeMiddleware(level) {
  const idField = `${level}Id`;

  return (paramKey = idField) => {
    return (req, res, next) => {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      // Admin and Researcher bypass regional scope restrictions
      if (['ADMIN', 'RESEARCHER'].includes(user.role)) {
        return next();
      }

      const requestedId = req.params[paramKey] || req.query[paramKey] || req.body[paramKey];
      const userScopeId = user[idField];

      // If user has an assigned jurisdiction and requested a specific one, they must match
      if (requestedId && userScopeId && String(requestedId) !== String(userScopeId)) {
        logger.warn(`[ScopeAuth] Out-of-scope access attempt by user ${user.id} (${user.role}) for ${level}: ${requestedId}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'OUT_OF_SCOPE',
            message: `Access denied: requested ${level} '${requestedId}' is outside your jurisdiction`,
          },
        });
      }

      next();
    };
  };
}

module.exports = {
  createScopeMiddleware,
  authorizeWoredaScope: createScopeMiddleware('woreda'),
  authorizeZoneScope: createScopeMiddleware('zone'),
  authorizeRegionScope: createScopeMiddleware('region'),
};
