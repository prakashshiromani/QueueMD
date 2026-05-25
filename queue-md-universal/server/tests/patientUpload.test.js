/**
 * Integration tests for Public Tracking, Identity Verification, and Patient Upload
 * Tests:
 * - GET /api/public/track/:facilityId/:tokenNumber
 * - POST /api/public/lobby/:facilityId/verify
 * - POST /api/patient/upload-prescription
 */

const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const Queue = require('../models/Queue');
const Facility = require('../models/Facility');
const User = require('../models/User');
const ClinicalVisit = require('../models/ClinicalVisit');

process.env.NODE_ENV = 'test';
require('dotenv').config();

jest.setTimeout(30000); // 30 seconds timeout for remote Atlas DB connection

// Mock Cloudinary Uploader
jest.mock('../config/cloudinary', () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test-url/image.png'
    })
  }
}));

let app;
let testFacility;
let testUser;
let testQueue;
let testClinicalVisit;
let validUploadToken;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  app = require('../server');

  // Create temporary test facility
  testFacility = await Facility.create({
    name: 'Verification Test Center',
    facilityType: 'clinic',
    address: '456 Verification St',
    contact: '+919876543210'
  });

  // Create test doctor
  testUser = await User.create({
    name: 'Dr. Upload Test',
    email: `upload_doc_${Date.now()}@queuemd.test`,
    password: 'password123',
    facilityId: testFacility._id,
    facilityType: 'clinic',
    role: 'admin'
  });

  // Create active completed queue entry for today
  testQueue = await Queue.create({
    facilityId: testFacility._id,
    facilityType: 'clinic',
    patientName: 'Aman Sharma',
    phone: '+91 70000 12345',
    tokenNumber: 99,
    status: 'completed',
    completedAt: new Date(),
    createdAt: new Date()
  });

  // Create corresponding Clinical Visit
  testClinicalVisit = await ClinicalVisit.create({
    patientPhone: testQueue.phone,
    patientName: testQueue.patientName,
    facilityId: testFacility._id,
    facilityType: 'clinic',
    doctorId: testUser._id,
    diagnosis: 'Common Cold',
    prescriptionNotes: 'Paracetamol twice daily',
    status: 'completed'
  });

  // Generate valid upload token
  validUploadToken = jwt.sign(
    {
      patientPhone: testQueue.phone,
      facilityId: testFacility._id,
      visitId: testClinicalVisit._id,
      scope: 'upload_only',
      tokenId: testQueue.tokenNumber
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
});

afterAll(async () => {
  // Clean up
  if (testUser) await User.deleteOne({ _id: testUser._id });
  if (testQueue) await Queue.deleteOne({ _id: testQueue._id });
  if (testFacility) await Facility.deleteOne({ _id: testFacility._id });
  if (testClinicalVisit) await ClinicalVisit.deleteOne({ _id: testClinicalVisit._id });
  await mongoose.connection.close();
});

describe('GET /api/public/track/:facilityId/:tokenNumber', () => {
  it('should return 404 for invalid token number', async () => {
    const res = await request(app)
      .get(`/api/public/track/${testFacility._id}/999`);
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 and tracking details for valid completed token today', async () => {
    const res = await request(app)
      .get(`/api/public/track/${testFacility._id}/${testQueue.tokenNumber}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.myTokenNumber).toBe(testQueue.tokenNumber);
    expect(res.body.data.status).toBe('completed');
  });
});

describe('POST /api/public/lobby/:facilityId/verify', () => {
  it('should fail if phone does not match queue entry', async () => {
    const res = await request(app)
      .post(`/api/public/lobby/${testFacility._id}/verify`)
      .send({
        phone: '+91 99999 99999',
        tokenNumber: testQueue.tokenNumber
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should succeed and return uploadToken with scope upload_only for correct phone and token', async () => {
    const res = await request(app)
      .post(`/api/public/lobby/${testFacility._id}/verify`)
      .send({
        phone: '+91 70000 12345',
        tokenNumber: testQueue.tokenNumber
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uploadToken).toBeDefined();
    expect(res.body.data.patientNameMasked).toBe('A***');

    // Verify token scope
    const decoded = jwt.verify(res.body.data.uploadToken, process.env.JWT_SECRET);
    expect(decoded.scope).toBe('upload_only');
    expect(decoded.patientPhone).toBe(testQueue.phone);
  });
});

describe('POST /api/patient/upload-prescription', () => {
  it('should return 401 if no authorization header is provided', async () => {
    const res = await request(app)
      .post('/api/patient/upload-prescription')
      .attach('prescription', Buffer.from('dummy file content'), 'test.png');
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 403 if token scope is not upload_only', async () => {
    const wrongScopeToken = jwt.sign(
      {
        patientPhone: testQueue.phone,
        facilityId: testFacility._id,
        visitId: testClinicalVisit._id,
        role: 'admin' // Not upload_only scope
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .post('/api/patient/upload-prescription')
      .set('Authorization', `Bearer ${wrongScopeToken}`)
      .attach('prescription', Buffer.from('dummy file content'), 'test.png');
    
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/patient/upload-prescription')
      .set('Authorization', `Bearer ${validUploadToken}`);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully upload prescription and save to ClinicalVisit documents', async () => {
    const res = await request(app)
      .post('/api/patient/upload-prescription')
      .set('Authorization', `Bearer ${validUploadToken}`)
      .attach('prescription', Buffer.from('dummy file content'), {
        filename: 'test.png',
        contentType: 'image/png'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify clinical visit in DB was updated
    const updatedVisit = await ClinicalVisit.findById(testClinicalVisit._id);
    expect(updatedVisit.documents).toHaveLength(1);
    expect(updatedVisit.documents[0].url).toBe('https://res.cloudinary.com/test-url/image.png');
    expect(updatedVisit.documents[0].uploadedBy).toBe('patient');
  });
});

describe('GET /api/patient/history', () => {
  it('should return 401 if no authorization header is provided', async () => {
    const res = await request(app)
      .get('/api/patient/history');
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 with patient clinical history for valid token', async () => {
    const res = await request(app)
      .get('/api/patient/history')
      .set('Authorization', `Bearer ${validUploadToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patientPhone).toBe(testQueue.phone);
    expect(res.body.data.totalVisits).toBe(1);
    expect(res.body.data.visits[0].diagnosis).toBe('Common Cold');
    expect(res.body.data.visits[0].prescriptionNotes).toBe('Paracetamol twice daily');
  });
});

