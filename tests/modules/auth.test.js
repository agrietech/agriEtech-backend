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
    expect(lastEmail.html).toMatch(/\/api\/v1\/auth\/verify-email\?token=/);
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
    expect(res.text).toMatch(/AgriEtech|EthioFarm/);
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
    const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
    const expiredToken = `fakehex123_${expiredTimestamp}`;

    // Register user then assign expired verification token
    const testEmail = `expired_${Date.now()}@example.com`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        fullName: 'Expired User',
        password: 'Password123!',
      });

    const { prisma } = require('../../src/config/db');
    if (regRes.body?.data?.user?.id) {
      await prisma.user.update({
        where: { id: regRes.body.data.user.id },
        data: { verificationToken: expiredToken },
      });
    }

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: expiredToken });

    expect(res.status).toBe(400);
    expect(res.body.error?.message || res.body.message).toMatch(/expired|invalid/i);
  });
});

describe('Enterprise Phone & OTP Hardening Suite', () => {
  const { prisma } = require('../../src/config/db');
  const crypto = require('crypto');
  const timestamp = Date.now();
  const testPhoneRaw = `0911${String(timestamp).slice(-6)}`;
  const testPhoneCanonical = `+251911${String(timestamp).slice(-6)}`;
  let registeredUserId = null;

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { phoneNumber: testPhoneCanonical },
          { phoneNumber: testPhoneRaw },
        ],
      },
    });
  });

  it('1. Phone Registration Normalization - should store phone in canonical E.164 (+251...) format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        phoneNumber: testPhoneRaw,
        fullName: 'Ethiopian Enterprise Farmer',
        password: 'Password123!',
        role: 'FARMER',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.phoneNumber).toBe(testPhoneCanonical);
    registeredUserId = res.body.data.user.id;

    // Direct DB check
    const userInDb = await prisma.user.findUnique({ where: { id: registeredUserId } });
    expect(userInDb.phoneNumber).toBe(testPhoneCanonical);
  });

  it('2. Prevent Duplicate Accounts - should reject equivalent format (+251...) with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        phoneNumber: testPhoneCanonical,
        fullName: 'Duplicate Farmer',
        password: 'Password123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.error?.message || res.body.message).toMatch(/already exists/i);
  });

  it('3. Multi-Format Login - should allow login using local 09... format even when stored as +251...', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: testPhoneRaw,
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(registeredUserId);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('4. SHA-256 OTP Hashing - Password reset OTP should be hashed in DB, never plain text', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ phoneNumber: testPhoneRaw });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();

    const plainOtp = res.body.data.token;
    expect(plainOtp).toMatch(/^\d{6}$/);

    // Direct DB check: verify the DB contains the SHA-256 hash, NOT the plain 6-digit OTP
    const userInDb = await prisma.user.findUnique({ where: { id: registeredUserId } });
    const expectedHash = crypto.createHash('sha256').update(plainOtp).digest('hex');

    expect(userInDb.resetPasswordToken).toBe(expectedHash);
    expect(userInDb.resetPasswordToken).not.toBe(plainOtp);

    // Reset password using the plain OTP
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: plainOtp,
        newPassword: 'NewPassword999!',
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Verify OTP token is purged
    const updatedUser = await prisma.user.findUnique({ where: { id: registeredUserId } });
    expect(updatedUser.resetPasswordToken).toBeNull();
    expect(updatedUser.resetPasswordExpires).toBeNull();
  });

  it('5. Passwordless Phone OTP Login - should request login OTP and authenticate via SMS code', async () => {
    const otpPhone = `0977${String(Date.now()).slice(-6)}`;
    const expectedCanonical = `+251977${otpPhone.slice(4)}`;

    // Request Login OTP
    const reqRes = await request(app)
      .post('/api/v1/auth/request-login-otp')
      .send({ phoneNumber: otpPhone });

    expect(reqRes.status).toBe(200);
    expect(reqRes.body.success).toBe(true);
    expect(reqRes.body.data.code).toBeDefined();

    const loginCode = reqRes.body.data.code;
    expect(loginCode).toMatch(/^\d{6}$/);

    // Verify Login OTP
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-login-otp')
      .send({
        phoneNumber: otpPhone,
        code: loginCode,
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.accessToken).toBeDefined();
    expect(verifyRes.body.data.refreshToken).toBeDefined();
    expect(verifyRes.body.data.user.role).toBe('FARMER');

    // Clean up created user
    await prisma.user.deleteMany({ where: { phoneNumber: expectedCanonical } });
  });
});

