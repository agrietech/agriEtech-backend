const request = require('supertest');
const app = require('../../src/app');
const { prisma } = require('../../src/config/db');

describe('Sign-Up Phone Ownership Verification Suite', () => {
  const testPhone = `+251912${Math.floor(100000 + Math.random() * 900000)}`;
  let capturedCode = null;

  afterAll(async () => {
    // Clean up test user
    try {
      await prisma.user.deleteMany({
        where: { phoneNumber: testPhone },
      });
    } catch (_e) {}
  });

  it('1. Register user with phone number - generates OTP, dispatches SMS, marks isPhoneVerified false', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        phoneNumber: testPhone,
        fullName: 'Chala Gemechu',
        password: 'Password123!',
        role: 'FARMER',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.phoneNumber).toBe(testPhone);
    expect(res.body.data.user.isPhoneVerified).toBe(false);
    expect(res.body.data.requiresPhoneVerification).toBe(true);
    expect(res.body.data.phoneVerificationCode).toBeDefined();

    capturedCode = res.body.data.phoneVerificationCode;
    expect(capturedCode).toMatch(/^\d{6}$/);

    // Verify token is hashed in database
    const dbUser = await prisma.user.findFirst({
      where: { phoneNumber: testPhone },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser.isPhoneVerified).toBe(false);
    expect(dbUser.phoneVerificationToken).not.toBe(capturedCode); // Must NOT be plaintext
    expect(dbUser.phoneVerificationToken).toHaveLength(64); // SHA-256 hex string
    expect(dbUser.phoneVerificationExpires).not.toBeNull();
  });

  it('2. Verify phone with invalid OTP - should fail with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-phone-otp')
      .send({
        phoneNumber: testPhone,
        code: '000000',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it('3. Resend OTP within 60s cooldown - should fail with 400 cooldown notice', async () => {
    const res = await request(app)
      .post('/api/v1/auth/resend-phone-otp')
      .send({
        phoneNumber: testPhone,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/please wait \d+ second\(s\)/i);
  });

  it('4. Verify phone with correct OTP - marks isPhoneVerified true and returns JWT tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-phone-otp')
      .send({
        phoneNumber: testPhone,
        code: capturedCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.isPhoneVerified).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    // Verify database state: token wiped, isPhoneVerified true
    const dbUser = await prisma.user.findFirst({
      where: { phoneNumber: testPhone },
    });
    expect(dbUser.isPhoneVerified).toBe(true);
    expect(dbUser.phoneVerificationToken).toBeNull();
    expect(dbUser.phoneVerificationExpires).toBeNull();
  });

  it('5. Replay protection - reusing consumed OTP code should fail', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-phone-otp')
      .send({
        phoneNumber: testPhone,
        code: capturedCode,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });
});
