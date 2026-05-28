/**
 * Integration tests for Security Audit Logs API
 */

const mongoose = require('mongoose');
const request = require('supertest');

process.env.NODE_ENV = 'test';
require('dotenv').config();

let app;
let User;
let Facility;
let AuditLog;

const testAdminEmail = 'audit-admin@queuemd.com';
const testStaffEmail = 'audit-staff@queuemd.com';
const testPassword = 'securePassword123';

let adminToken;
let staffToken;
let facilityId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  app = require('../server');
  User = require('../models/User');
  Facility = require('../models/Facility');
  AuditLog = require('../models/AuditLog');

  // Clean up existing test users and logs
  await User.deleteMany({ email: { $in: [testAdminEmail, testStaffEmail] } });
  
  // Get or create test facility
  let facility = await Facility.findOne({ name: 'Audit Test Facility' });
  if (!facility) {
    facility = await Facility.create({ name: 'Audit Test Facility', facilityType: 'clinic' });
  }
  facilityId = facility._id;

  // Register admin user via API to ensure correct password hashing and trigger hooks
  const adminRegisterRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Audit Admin',
      email: testAdminEmail,
      password: testPassword,
      facilityId: facilityId.toString(),
      role: 'admin'
    });

  adminToken = adminRegisterRes.body.token || adminRegisterRes.body.accessToken;

  // Register receptionist/staff user via API
  const staffRegisterRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Audit Staff',
      email: testStaffEmail,
      password: testPassword,
      facilityId: facilityId.toString(),
      role: 'receptionist'
    });

  staffToken = staffRegisterRes.body.token || staffRegisterRes.body.accessToken;
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: [testAdminEmail, testStaffEmail] } });
  await AuditLog.deleteMany({ facilityId });
  await mongoose.connection.close();
});

describe('Security Audit Logs Access Control', () => {
  it('should deny access to non-admin users (HTTP 403)', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow access to admin users (HTTP 200)', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });
});

describe('Security Audit Logs Hooks', () => {
  it('should log LOGIN_SUCCESS on successful login', async () => {
    // Clear logs first
    await AuditLog.deleteMany({ facilityId });

    // Perform a successful login
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testAdminEmail, password: testPassword });

    expect(res.statusCode).toBe(200);

    // Verify AuditLog entry was created
    const logs = await AuditLog.find({ facilityId, action: 'LOGIN_SUCCESS' });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].userEmail).toBe(testAdminEmail);
    expect(logs[0].severity).toBe('info');
    expect(logs[0].status).toBe('success');
  });

  it('should log LOGIN_FAILED on failed login', async () => {
    // Perform a failed login
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testAdminEmail, password: 'incorrectPassword' });

    expect(res.statusCode).toBe(401);

    // Verify AuditLog entry was created
    const logs = await AuditLog.find({ facilityId, action: 'LOGIN_FAILED' });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].userEmail).toBe(testAdminEmail);
    expect(logs[0].severity).toBe('warning');
    expect(logs[0].status).toBe('failed');
    expect(logs[0].details.reason).toBe('Incorrect password');
  });

  it('should log FACILITY_UPDATED on updating facility settings', async () => {
    // Perform a facility settings update
    const res = await request(app)
      .put('/api/facility/update')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Audit Test Facility Updated', contact: '9999999999' });

    expect(res.statusCode).toBe(200);

    // Verify AuditLog entry was created
    const logs = await AuditLog.find({ facilityId, action: 'FACILITY_UPDATED' });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].severity).toBe('info');
    expect(logs[0].status).toBe('success');
  });
});

describe('Security Audit Logs Clear Endpoint', () => {
  it('should deny clearing logs to non-admin users (HTTP 403)', async () => {
    const res = await request(app)
      .delete('/api/audit-logs')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow clearing logs to admin users (HTTP 200) and preserve audit trail', async () => {
    // Ensure we have some logs first
    await AuditLog.create({
      facilityId,
      action: 'LOGIN_SUCCESS',
      userEmail: testAdminEmail,
      severity: 'info',
      status: 'success'
    });

    const res = await request(app)
      .delete('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify all old logs for facilityId are deleted, but the AUDIT_LOGS_CLEARED log is created
    const logs = await AuditLog.find({ facilityId });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('AUDIT_LOGS_CLEARED');
    expect(logs[0].severity).toBe('critical');
    expect(logs[0].status).toBe('success');
  });
});
