const request = require('supertest');
const app = require('../../src/app');
const authService = require('../../src/modules/auth/auth.service');
const { getSentEmailsLog, clearSentEmailsLog } = require('../../src/delivery/email/emailDispatcher');

describe('Auth & Email Verification Suite', () => {
  const testEmail = `farmer_${Date.now()}@example.com`;
  let verificationToken = null;

  beforeEach(() => {
    clearSentEmailsLog();
  });

  it('1. Register user - should generate timestamped token and send verification email with https://agrietech.onrender.com', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        fullName: 'Abebe Test',
        password: 'Password123!',
        role: 'FARMER',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.accessToken).toBeDefined();

    // Check sent emails log
    const emailLogs = getSentEmailsLog();
    expect(emailLogs.length).toBeGreaterThan(0);
    const lastEmail = emailLogs[emailLogs.length - 1];
    expect(lastEmail.to).toBe(testEmail);
    expect(lastEmail.html).toContain('https://agrietech.onrender.com/api/v1/auth/verify-email?token=');
    expect(lastEmail.html).toContain('24 hours');

    // Extract token from email html
    const match = lastEmail.html.match(/token=([a-f0-9]+_\d+)/);
    expect(match).not.toBeNull();
    verificationToken = match[1];
  });

  it('2. Verify email via API (JSON) - should mark user as verified', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: verificationToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('verified successfully');
  });

  it('3. Verify email with already-used or invalid token - should return 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: verificationToken });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('4. Resend verification email - should generate a new token and send email', async () => {
    // Create an unverified user
    const unverifiedEmail = `unverified_${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: unverifiedEmail,
        fullName: 'Unverified Farmer',
        password: 'Password123!',
      });

    clearSentEmailsLog();

    const res = await request(app)
      .post('/api/v1/auth/resend-verification')
      .send({ email: unverifiedEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const emailLogs = getSentEmailsLog();
    expect(emailLogs.length).toBe(1);
    expect(emailLogs[0].to).toBe(unverifiedEmail);
  });

  it('5. Verify email via browser GET request - should return styled HTML page', async () => {
    // Register new user to get fresh token
    const browserTestEmail = `browser_${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: browserTestEmail,
        fullName: 'Browser Farmer',
        password: 'Password123!',
      });

    const emailLogs = getSentEmailsLog();
    const lastEmail = emailLogs[emailLogs.length - 1];
    const match = lastEmail.html.match(/token=([a-f0-9]+_\d+)/);
    const freshToken = match[1];

    // Simulate clicking the link in a web browser
    const res = await request(app)
      .get(`/api/v1/auth/verify-email?token=${freshToken}`)
      .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');

    expect(res.status).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html>');
    expect(res.text).toContain('Email Verified Successfully');
    expect(res.text).toContain('AgriEtech');
  });

  it('6. Top-level /verify-email route - should also work for browser clicks', async () => {
    const topLevelTestEmail = `toplevel_${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: topLevelTestEmail,
        fullName: 'TopLevel Farmer',
        password: 'Password123!',
      });

    const emailLogs = getSentEmailsLog();
    const lastEmail = emailLogs[emailLogs.length - 1];
    const match = lastEmail.html.match(/token=([a-f0-9]+_\d+)/);
    const freshToken = match[1];

    const res = await request(app)
      .get(`/verify-email?token=${freshToken}`)
      .set('Accept', 'text/html');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Email Verified Successfully');
  });

  it('7. Expired verification token (>24h) - should be rejected', async () => {
    const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
    const expiredToken = `fakehex123_${expiredTimestamp}`;

    // Register user with fake token in mock map
    authService.mockUsers.set('expired@test.com', {
      id: 'usr_expired',
      email: 'expired@test.com',
      verificationToken: expiredToken,
      isEmailVerified: false,
    });

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: expiredToken });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('expired');
  });
});

