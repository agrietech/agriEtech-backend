const request = require('supertest');
const app = require('../../src/app');

describe('Core Backend - Authentication & RBAC Suite', () => {
  const testPhone = `+2519${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testEmail = `farmer_${Date.now()}@agrietech.et`;
  let accessToken = '';
  let refreshToken = '';

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully with phone number and return tokens', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        phoneNumber: testPhone,
        fullName: 'Test Farmer Abebe',
        password: 'SecurePassword123!',
        role: 'FARMER',
        preferredLang: 'am',
        woredaId: 'woreda-test-01',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.phoneNumber).toBe(testPhone);
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Should be stripped
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should register a new user successfully with email address and return tokens', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: testEmail,
        fullName: 'Email Registered Farmer',
        password: 'SecurePassword123!',
        role: 'FARMER',
        preferredLang: 'en',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject registration with duplicate phone number (409 Conflict)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        phoneNumber: testPhone,
        fullName: 'Duplicate Phone User',
        password: 'Password123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should reject registration with duplicate email address (409 Conflict)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: testEmail,
        fullName: 'Duplicate Email User',
        password: 'Password123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should reject registration when both email and phone are missing (400 Bad Request)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        fullName: 'No Contact User',
        password: 'Password123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid email format (400 Bad Request)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'invalid-email-format',
        fullName: 'Bad Email User',
        password: 'Password123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in successfully with valid phone number', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        phoneNumber: testPhone,
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.phoneNumber).toBe(testPhone);
    });

    it('should log in successfully with valid email address', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testEmail,
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
    });

    it('should log in successfully using generic identifier field (with email)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: testEmail,
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject login with incorrect password (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testEmail,
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Forgot Password & Reset Flow via Email', () => {
    let resetToken = '';

    it('should request a password reset link for valid registered email', async () => {
      const res = await request(app).post('/api/v1/auth/forgot-password').send({
        email: testEmail,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.resetLink).toContain('/reset-password?token=');

      resetToken = res.body.data.token;
    });

    it('should reset the password successfully with valid reset token', async () => {
      const res = await request(app).post('/api/v1/auth/reset-password').send({
        token: resetToken,
        newPassword: 'BrandNewPassword456!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/success/i);
    });

    it('should allow logging in with the newly reset password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testEmail,
        password: 'BrandNewPassword456!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject password reset with invalid or already used token (400 Bad Request)', async () => {
      const res = await request(app).post('/api/v1/auth/reset-password').send({
        token: resetToken, // Already consumed
        newPassword: 'AnotherPassword789!',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should issue a new access token when given a valid refresh token', async () => {
      const res = await request(app).post('/api/v1/auth/refresh-token').send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid or malformed refresh token (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalid.jwt.token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user profile when authenticated with Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phoneNumber).toBe(testPhone);
    });

    it('should reject unauthenticated request without token (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should blacklist the access token and revoke session', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Attempting to use the revoked token should now fail
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meRes.status).toBe(401);
      expect(meRes.body.error.message).toMatch(/revoked/i);
    });
  });
});
