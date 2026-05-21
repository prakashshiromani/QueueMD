/**
 * Integration tests for Facility API routes
 * Tests: GET /api/facility/me, PUT /api/facility/update
 */

const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const Facility = require('../models/Facility');
const User = require('../models/User');

process.env.NODE_ENV = 'test';
require('dotenv').config();

let app;
let testFacility;
let testUser;
let authToken;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  app = require('../server');

  // Create temporary test facility and user
  testFacility = await Facility.create({
    name: 'Test Medical Center',
    facilityType: 'clinic',
    address: '123 Health Ave',
    contact: '+919999999999'
  });

  testUser = await User.create({
    name: 'Dr. Test',
    email: `test_doc_${Date.now()}@queuemd.test`,
    password: 'password123', // unhashed for mock user is fine since we won't log in via route
    facilityId: testFacility._id,
    facilityType: 'clinic',
    role: 'admin'
  });

  // Generate valid JWT token
  authToken = jwt.sign(
    {
      id: testUser._id,
      facilityId: testUser.facilityId,
      facilityType: testUser.facilityType,
      role: testUser.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
});

afterAll(async () => {
  // Clean up test data
  if (testUser) await User.deleteOne({ _id: testUser._id });
  if (testFacility) await Facility.deleteOne({ _id: testFacility._id });
  await mongoose.connection.close();
});

describe('GET /api/facility/me', () => {
  it('should return 401 if unauthorized', async () => {
    const res = await request(app).get('/api/facility/me');
    expect(res.statusCode).toBe(401);
  });

  it('should return current facility details when authorized', async () => {
    const res = await request(app)
      .get('/api/facility/me')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Medical Center');
    expect(res.body.data.address).toBe('123 Health Ave');
  });
});

describe('PUT /api/facility/update', () => {
  it('should return 401 if unauthorized', async () => {
    const res = await request(app).put('/api/facility/update').send({ name: 'New Clinic Name' });
    expect(res.statusCode).toBe(401);
  });

  it('should update schema fields and custom fields correctly', async () => {
    const updateData = {
      name: 'Updated Health Center',
      address: '456 Wellness Rd',
      logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 pixel base64 image
      tokenPrefix: 'UTST',
      baseConsultTime: 20
    };

    const res = await request(app)
      .put('/api/facility/update')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(updateData.name);
    expect(res.body.data.address).toBe(updateData.address);
    expect(res.body.data.logo).toBe(updateData.logo);

    // Verify it was persisted in database
    const updatedDbFacility = await Facility.findById(testFacility._id);
    expect(updatedDbFacility.name).toBe(updateData.name);
    expect(updatedDbFacility.logo).toBe(updateData.logo);
    
    // Verify customFields Map got populated
    expect(updatedDbFacility.customFields.get('tokenPrefix')).toBe(updateData.tokenPrefix);
    expect(updatedDbFacility.customFields.get('baseConsultTime')).toBe(updateData.baseConsultTime);
  });

  it('should fail if facility name is less than 2 characters', async () => {
    const res = await request(app)
      .put('/api/facility/update')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'A' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
