const express = require('express');
const request = require('supertest');
const { createRateLimiter } = require('../../src/middleware/rateLimiter');
const errorHandler = require('../../src/middleware/errorHandler');

function createRateLimitApp() {
  const app = express();

  // Custom tight limiter for testing
  const testLimiter = createRateLimiter({
    windowMs: 10000,
    max: 3,
    prefix: 'rl:test',
    message: 'Test rate limit exceeded.',
  });

  app.get('/test-limit', testLimiter, (req, res) => {
    res.json({ success: true, count: 'ok' });
  });

  app.use(errorHandler);
  return app;
}

describe('Core Backend - Rate Limiter Suite', () => {
  const originalEnv = process.env.ENABLE_TEST_RATELIMIT;

  beforeAll(() => {
    process.env.ENABLE_TEST_RATELIMIT = 'true';
  });

  afterAll(() => {
    process.env.ENABLE_TEST_RATELIMIT = originalEnv;
  });

  it('should include standard rate limit headers in responses', async () => {
    const app = createRateLimitApp();
    const res = await request(app).get('/test-limit');

    expect(res.status).toBe(200);
    expect(res.headers['x-ratelimit-limit']).toBe('3');
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });

  it('should block requests and return 429 when threshold is exceeded', async () => {
    const app = createRateLimitApp();

    // 3 allowed hits
    await request(app).get('/test-limit');
    await request(app).get('/test-limit');
    await request(app).get('/test-limit');

    // 4th hit should be rate limited
    const res = await request(app).get('/test-limit');
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(res.headers['retry-after']).toBeDefined();
  });
});
