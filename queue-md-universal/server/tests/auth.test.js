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

describe('GET /api/health', () => {
  it('should return 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
