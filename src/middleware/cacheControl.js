/**
 * Cache Control Middleware for Optimizing Frontend Response Times
 */

/**
 * Add cache headers for static/slow-changing data
 */
function setCacheHeaders(maxAge = 300) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAge}`);
      res.set('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
    }
    next();
  };
}

/**
 * Disable caching for dynamic/personalized data
 */
function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
}

/**
 * Add ETag support for conditional requests
 */
function addETag(req, res, next) {
  const originalSend = res.send;
  
  res.send = function (data) {
    if (req.method === 'GET' && res.statusCode === 200) {
      const etag = require('crypto').createHash('md5').update(JSON.stringify(data)).digest('hex');
      res.set('ETag', `"${etag}"`);
      
      // Check if client already has this version
      if (req.headers['if-none-match'] === `"${etag}"`) {
        res.status(304).end();
        return res;
      }
    }
    return originalSend.call(this, data);
  };
  
  next();
}

module.exports = {
  setCacheHeaders,
  noCache,
  addETag,
};
