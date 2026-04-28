# Phase 3: Scalability & Isolation Test Guide

This guide provides test cases to verify the scalability and multi-tenant isolation of the QueueMD platform using Postman.

## Pre-requisites
- **JWT Token**: Login to the respective facility dashboard to get the Bearer token.
- **Facility Type**: Ensure your token is issued for the correct `facilityType` context (Clinic, Pathlab, or Dental).

---

## 🔬 Test Case 1: Pathlab Entry (Dynamic Fields)
Verify that the system accepts and validates custom fields for the Pathlab configuration.

- **Endpoint**: `POST /api/queue/add`
- **Method**: `POST`
- **Header**: `Authorization: Bearer {{JWT_TOKEN}}`
- **Body (JSON)**:
```json
{
  "patientName": "Priya Sharma",
  "phone": "9876543210",
  "customData": {
    "sampleId": "SAM-001",
    "testType": "Blood"
  }
}
```
- **Expected Result**: 
  - Status `201 Created`.
  - Token #1 generated for the Pathlab domain.
  - Successfully validated `sampleId` and `testType`.

---

## 🦷 Test Case 2: Dental Entry (Isolated Tokens)
Verify that tokens are isolated by `facilityType`, so a Dental entry gets its own Token #1 even if Pathlab already has a Token #1.

- **Endpoint**: `POST /api/queue/add`
- **Method**: `POST`
- **Header**: `Authorization: Bearer {{JWT_TOKEN}}`
- **Body (JSON)**:
```json
{
  "patientName": "Rohan Verma",
  "phone": "8765432109",
  "customData": {
    "procedure": "Root Canal",
    "toothNumber": "12"
  }
}
```
- **Expected Result**: 
  - Status `201 Created`.
  - Token #1 generated for the Dental domain (proves token counter isolation).

---

## 🛡️ Verification: Compound Index Isolation
Verify that queries strictly adhere to the `{ facilityId, facilityType }` context.

1. **Clinic Isolation Check**:
   - `GET /api/queue?status=waiting` (Using a Clinic Token)
   - **Expected**: Should **NOT** show Priya Sharma (Pathlab) or Rohan Verma (Dental).

2. **Pathlab Isolation Check**:
   - `GET /api/queue?status=waiting` (Using a Pathlab Token)
   - **Expected**: Should **ONLY** show Priya Sharma.

---

## 📈 Test Case 3: Intelligent Wait Time (Analytics)
Verify that the system correctly calculates the rolling average wait time for a facility.

- **Endpoint**: `GET /api/analytics/wait-time`
- **Method**: `GET`
- **Header**: `Authorization: Bearer {{JWT_TOKEN}}`
- **Expected Result**: 
  - Status `200 OK`.
  - JSON containing `avgWaitTime` (e.g., `15`).
  - Proves that the system is tracking `calledAt` vs `createdAt` timestamps.

---

## 💡 Notes for Defense
- **Compound Index**: This isolation is enforced by the MongoDB Compound Index: `{ facilityId: 1, facilityType: 1, tokenNumber: 1 }`.
- **Config-Driven**: The backend validates `testType` dynamically based on the Zod schema defined in `facilityTypeConfig.js`.
- **Intelligent Logic**: Wait time is not a static number but a dynamic average of the last 10 completed visits, ensuring high accuracy for different times of the day.
