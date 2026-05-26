/**
 * Integration tests for Auth API routes
 * Tests: /api/auth/login, /api/auth/refresh
 * 
 * Note: These tests connect to the real DB (defined in .env).
 * For a pure unit test setup, you would mock mongoose.
 */

const mongoose = require('mongoose');
const request = require('supertest');

// Load app without starting the server
process.env.NODE_ENV = 'test';
require('dotenv').config();

let app;

beforeAll(async () => {
  // Connect to MongoDB before running tests
  await mongoose.connect(process.env.MONGO_URI);
  app = require('../server');
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /api/auth/login', () => {
  it('should return 400 or 401 for missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    
    expect([400, 401]).toContain(res.statusCode);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for invalid email credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent_user_xyzabc@fake.test', password: 'wrongpassword123' });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for short password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: '123' }); // less than 6 chars
    
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/refresh', () => {
  it('should return 401 when no refresh cookie is present', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/refresh token missing/i);
  });

  it('should return 403 when an invalid refresh token is sent', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=invalid.jwt.token.here')
      .send({});
    
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('Password Reset Flows', () => {
  const testEmail = 'reset-test@queuemd.com';
  const testPassword = 'oldPassword123';
  const newPassword = 'newPassword123';
  let User;

  beforeAll(async () => {
    User = require('../models/User');
    // Ensure test user doesn't exist
    await User.deleteMany({ email: testEmail });
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({ email: testEmail });
  });

  it('should return 404 for forgot password with unregistered email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unregistered@queuemd.com' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 and generate OTP for registered email', async () => {
    // Create a dummy user first
    const Facility = require('../models/Facility');
    let facility = await Facility.findOne();
    if (!facility) {
      facility = await Facility.create({ name: 'Test Facility', facilityType: 'clinic' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);

    await User.create({
      name: 'Reset Tester',
      email: testEmail,
      password: hashedPassword,
      facilityId: facility._id,
      facilityType: facility.facilityType,
      role: 'receptionist'
    });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testEmail });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify OTP was stored in DB
    const updatedUser = await User.findOne({ email: testEmail });
    expect(updatedUser.resetPasswordOTP).toBeDefined();
    expect(updatedUser.resetPasswordOTP.length).toBe(6);
  });

  it('should fail reset with invalid OTP code', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: testEmail, code: '000000', newPassword });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully reset password with development code 123456', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: testEmail, code: '123456', newPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify password was updated by trying to login with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: newPassword });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });
});

describe('GET /api/health', () => {
  it('should return 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
