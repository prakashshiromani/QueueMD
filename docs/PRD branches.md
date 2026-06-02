# 📄 Product Requirements Document (PRD) — Multi-Branch Support

**Product Name:** QueueMD  
**Feature:** Multi-Branch Support (Enterprise Module)  
**Status:** Implemented & Verified  
**Target Tier:** Free (1 Branch Limit) / Pro (Unlimited Branches)  
**Author:** Antigravity Code Assistant  
**Last Updated:** June 2026  

---

## 1. Executive Summary
QueueMD is a multi-tenant SaaS queue management system for healthcare facilities. To enable healthcare organizations (clinics, hospitals, diagnostics centers) to scale their physical operations without creating duplicate tenant accounts, the **Multi-Branch Support** feature was introduced.

This feature allows a single registered Facility (Tenant) to establish multiple geographic or organizational sub-locations (Branches). Each branch operates its own isolated queue, receives location-specific analytics, and supports independent management, all while sharing consolidated tenant billing, patient directories, and account credentials.

---

## 2. Problem Statement & Goals
### 2.1 Problem Statement
Previously, a clinic group with locations in different cities or sectors had to register separate QueueMD tenant accounts. This created several operational friction points:
1. **Siloed Patient Records:** No shared patient directory across locations.
2. **Fragmented Billing:** Paying for multiple subscriptions individually.
3. **No Executive View:** Administrators could not monitor groups or view combined analytics.
4. **Credentials Overhead:** Staff working across branches had to maintain multiple logins.

### 2.2 Product Goals
- **Unified Organization Model:** Create a parent-child structure where a `Facility` owns multiple `Branches`.
- **Zero-Contamination Queue Operations:** Ensure receptionist and doctor queue operations are isolated to the selected branch.
- **Granular Branch-wise Analytics:** Allow filtering of wait-times, volumes, and consultation metrics by branch.
- **Pro-Tier Monetization Gating:** Restrict free-tier facilities to 1 branch, utilizing additional branches as a core upgrade driver for the Pro plan.
- **Seamless Retrofitting:** Maintain backward compatibility for existing facilities and queues.

---

## 3. User Personas & Flows
### 3.1 Facility Owner / Admin
- **Goal:** Configure multiple physical locations and view aggregated performance.
- **Flow:**
  1. Access **Settings > Manage Branches**.
  2. Register new branches (Name, Address). If on the Free plan, receives an upgrade prompt upon adding a second branch.
  3. Toggle branch active/inactive states or edit location addresses.
  4. Access **Analytics** and use the global selector to inspect performance comparison between Noida, Delhi, etc., or view global numbers.

### 3.2 Receptionist
- **Goal:** Fast patient check-in for the local branch.
- **Flow:**
  1. Login to the dashboard. Select the local physical branch from the sticky header dropdown.
  2. Add patients to the queue. The system automatically associates the selected `branchId` to the patient's queue record.
  3. Manage local queue (Hold, Resume, Complete).

### 3.3 Doctor / Consultant
- **Goal:** Call next patient waiting at their local branch.
- **Flow:**
  1. Select the branch filter at the top of the dashboard.
  2. Click **Call Next** to pop the next patient in line specifically for that branch.
  3. Perform consultations without seeing patients checked into other physical locations.

---

## 4. Feature Specifications

### 4.1 Data Model Adjustments
To support branches, the schema model was enhanced with parent-child relationships and references:

#### Parent: `Facility` Schema (`server/models/Facility.js`)
An embedded array of sub-documents representing the branches:
```javascript
branches: [{
  name: { type: String, required: true, trim: true },
  address: { type: String },
  isActive: { type: Boolean, default: true }
}]
```

#### Child: `Queue` Schema (`server/models/Queue.js`)
Each queue entry references the branch it belongs to:
```javascript
branchId: {
  type: mongoose.Schema.Types.ObjectId,
  default: null,
  index: true
}
```
*Compound indexes optimized for query performance when fetching filtered queues:*
- `{ facilityId: 1, facilityType: 1, tokenNumber: 1 }`
- `{ facilityId: 1, facilityType: 1, status: 1 }`
- `{ facilityId: 1, facilityType: 1, status: 1, tokenNumber: 1 }`

#### Child: `Appointment` Schema (`server/models/Appointment.js`)
Each appointment slot records the branch context:
```javascript
branchId: {
  type: mongoose.Schema.Types.ObjectId,
  default: null,
  index: true
}
```
*Compound indexes optimized for branch-scoped overlap detection and schedule listing:*
- `{ facilityId: 1, facilityType: 1, branchId: 1, appointmentDate: 1, startTime: 1, endTime: 1 }`
- `{ facilityId: 1, branchId: 1, status: 1, appointmentDate: 1 }`

---

### 4.2 API Routes & Controllers (`server/routes/facility.routes.js`)
Four RESTful endpoints handle Branch configuration under the Facility scope:

| Method | Endpoint | Description | Access Control |
|---|---|---|---|
| **GET** | `/api/facility/:id/branches` | Fetches all branches for the facility. | Registered Staff/Admin |
| **POST** | `/api/facility/:id/branch` | Adds a new branch. Enforces Pro plan limit. | Admin Only |
| **PUT** | `/api/facility/:id/branch/:branchId` | Updates name, address, or active state. | Admin Only |
| **DELETE** | `/api/facility/:id/branch/:branchId` | Deletes a branch. | Admin Only |

---

### 4.3 SaaS Monetization Gates (`server/controllers/facility.controller.js`)
The `addBranch` controller intercepts creation requests and verifies subscription status:
- **Rule:** If `subscriptionPlan !== "pro"` and `branches.length >= 1`, reject request.
- **Payload Response:**
  ```json
  {
    "success": false,
    "message": "Upgrade to Pro to add more branches.",
    "upgradeRequired": true
  }
  ```

---

### 4.4 Frontend Architecture & Zustand State
The frontend handles branch filtering globally:

#### 1. State Store (`client/src/store/facilityStore.js`)
Tracks the active branch filter in the client state:
- State Variable: `selectedBranch` (UUID/ObjectId or `null` for "All Locations").
- Action: `setSelectedBranch(branchId)` to mutate the active branch.
- Persistent Key: LocalStorage key `queue-md-facility` ensures filter persistence across page refreshes.

#### 2. Auto-Interceptor (`client/src/services/api.js`)
HTTP requests dynamically append the active branch context:
- Whenever a GET query is made (`fetchQueueApi`, `fetchAnalyticsStatsApi`), the request helper checks `facilityStore` and attaches `branchId = selectedBranch` to URL query params.
- Whenever a POST payload is created (`addPatientApi`, `addPatientToDirectoryApi`), the helper injects the `branchId` directly into the request body.

#### 3. Real-time Socket Filtering (`client/src/pages/Dashboard.jsx`)
To prevent websocket updates from unrelated branches from refreshing the local screen, updates are filtered client-side:
```javascript
const handleQueueUpdate = (data) => {
  // Branch isolation check
  if (selectedBranch && data.patient && data.patient.branchId !== selectedBranch) return;
  
  // Proceed with updating state...
}
```

---

### 4.5 UI Elements
1. **Branch Management Tab (`Settings.jsx`)**:
   - A dedicated **Manage Branches** sub-section inside the Settings page.
   - Admin features: Inline form to add branches, inline name/address edit inputs, slide toggles for active status, and custom delete buttons.
2. **Sticky Branch Dropdown Selector (`Dashboard.jsx` & `Analytics.jsx`)**:
   - A modern dropdown select widget next to the Department badge.
   - Shows standard facility type icon and gives options: `All Locations (Main)` and specific registered branches.

---

## 5. Backward Compatibility & Migration
Because legacy queues existed before branch tracking was implemented, a data migration strategy was required:
- **Migration Script (`server/scripts/migrate-branches.js`)**:
  - Connects to MongoDB.
  - Finds all Queue records where `branchId` does not exist (`{ branchId: { $exists: false } }`).
  - Sets the `branchId` to `null` to ensure consistent data structure and avoid undefined lookup issues.
  - Connects and runs the same operation for the `Appointment` collection.
- **Schema Safety:** All fields referencing `branchId` default to `null` on insertion.

---

## 6. Future Enhancements (v4.0+)
- **Staff-to-Branch Association:** Restrict receptionist/doctor log-ins so they are automatically tied to a single branch, rather than using a global selector.
- **Custom Branch Settings:** Enable branch-specific working hours, base consultation times, and custom prefixes (e.g., `NOIDA-001`, `DELHI-002`).
- **Branch-wise Inventory & Billing:** Track drug inventory or invoices separately for each physical warehouse/branch.

---

## 7. Security & Architectural Loop-holes Analysis
Through a deep analysis of the current implementation across controllers, models, and background services, several critical architectural loopholes and security risks were identified:

### 7.1 Cross-Tenant / Cross-Branch Data Pollution (Lack of Input Validation)
> [!WARNING]
> **Severity: High**  
> While the REST endpoints for managing branches (`POST`, `PUT`, `DELETE` branch) enforce checking `id === req.user.facilityId.toString()`, the core transaction endpoints do not perform validation on input parameters.
- **Endpoint Gaps:** Endpoints such as `createAppointment`, `addPatient` (check-in), and `addPatientToDirectory` accept a `branchId` directly from the request body or query parameters.
- **Loophole:** The backend does not verify if the supplied `branchId` is actually owned by the user's `facilityId`. An authenticated user from `Facility A` could inject a `branchId` belonging to `Facility B` into booking payloads. This leads to cross-facility data pollution where Noida's appointments could contain records pointing to Gurgaon's branch.

### 7.2 Predictable WebSocket Leakage via Client-Side Filtering
> [!CAUTION]
> **Severity: Critical (Data Leakage & HIPAA/DPDP Risk)**  
> Real-time queue updates are broadcast using `emitQueueUpdate(facilityId, facilityType, data)`. 
- **Endpoint Gaps:** The WebSocket rooms are scoped only to `facilityId` and `facilityType` via a cryptographic room hash `getRoomHash(facilityId, facilityType)`. There is no `branchId` context in the socket room designation.
- **Loophole:** The server broadcasts Noida's real-time patient status changes (containing PII such as `patientName`, `phone`, `tokenNumber`, `doctorName`) to the entire facility room. The client is trusted to filter out mismatching branch updates. A receptionist at the Delhi branch can inspect their browser's WebSocket network traffic and view all clinical check-ins occurring at the Noida branch.

### 7.3 Shared Sequence Counter & Race Conditions
> [!WARNING]
> **Severity: Medium**  
> The atomic queue token counter sequence relies on MongoDB sequences identified by `token:${facilityId}:${facilityType}`.
- **Loophole:** The sequence identifier is not branch-aware. Therefore, if Noida and Delhi branches both run the "General Medicine" department, they share the same token sequence numbers (e.g., Noida checks in token #1, Delhi gets token #2). For true branch isolation, each branch should be able to run its independent sequence starting from #1 daily.
- **Concurrency Issue:** In `queue.controller.js` and `patient.controller.js`, resetting the counter daily is handled by a non-atomic `findOne` check:
  ```javascript
  const todayEntry = await Queue.findOne({ ... });
  if (!todayEntry) {
    await Counter.findOneAndUpdate({ _id: counterId }, { seq: 0 }, ...);
  }
  ```
  During the first concurrent check-ins of the day, a race condition can cause multiple clients to reset the counter, resulting in duplicate token numbers (e.g., two patients getting Token #1).

### 7.4 Non-Branch-Aware Wait Time Predictions
> [!NOTE]
> **Severity: Medium**  
> The predictive wait time microservice (`getPredictedWait`) is triggered using only `facilityId` and `facilityType`.
- **Loophole:** Redis keys (`wait_time:${facilityId}:${facilityType}`) and FastAPI python service calls do not incorporate `branchId`. If Noida is quiet but Delhi is overloaded, a Noida patient fetching their predicted wait time will see a massive delay computed from Delhi's traffic.

### 7.5 GET Branches Authorization Leak
> [!WARNING]
> **Severity: Low-Medium**  
> The GET branches endpoint `/api/facility/:id/branches` runs `auth` middleware but does not verify ownership:
  ```javascript
  exports.getBranches = async (req, res, next) => {
    const { id } = req.params;
    const facility = await Facility.findById(id).select("branches");
    // ...
  ```
- **Loophole:** Any logged-in user in the system can query the branches (including names and physical addresses) of any other facility if they know or guess the target facility's `ObjectId`.

---

## 8. Recommended Mitigations & Implementation Plan
To resolve these security vulnerabilities and logical gaps, the following enhancements should be implemented in future cycles:

### 8.1 Enforcing Strict Branch Authorization Middleware
Implement a utility function to validate branch ownership on the server side:
```javascript
// server/utils/branchValidator.js
const Facility = require("../models/Facility");

exports.validateBranchOwnership = async (facilityId, branchId) => {
  if (!branchId) return true; // null is valid (legacy / global)
  
  const facility = await Facility.findOne({
    _id: facilityId,
    "branches._id": branchId
  });
  
  return !!facility;
};
```
Apply this check in `createAppointment`, `addPatient`, and `addPatientToDirectory`:
```javascript
const { validateBranchOwnership } = require("../utils/branchValidator");

if (branchId) {
  const isValid = await validateBranchOwnership(facilityId, branchId);
  if (!isValid) {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Requested branch does not belong to your facility."
    });
  }
}
```

### 8.2 Securing WebSocket Broadcasters (Branch Scoping)
Modify the room hashing utility to accept an optional `branchId`. 
1. **Room Scoping:** Hashing function in `server/sockets/index.js` becomes:
   ```javascript
   exports.getRoomHash = (facilityId, facilityType, branchId = null) => {
     const hashInput = branchId 
       ? `${facilityId}:${facilityType}:${branchId}` 
       : `${facilityId}:${facilityType}`;
     return crypto.createHash("sha256").update(hashInput).digest("hex");
   };
   ```
2. **Websocket Connection:** Clients must join rooms specific to their active branch.
3. **Broadcaster Updates:** `emitQueueUpdate` will fetch the patient's `branchId` and broadcast specifically to that branch's hashed room, eliminating client-side filtering and preventing raw PII leaks.

### 8.3 Branch-Aware Token Sequences
Transition counter document identifiers to incorporate `branchId` context:
- **Identifier:** `token:${facilityId}:${facilityType}:${branchId || 'global'}`
- This guarantees that Noida and Delhi operate separate sequence loops starting from 1 every day, matching physical operational expectations.
- **Race Condition Resolution:** Instead of performing a non-atomic `findOne` daily check, implement an upsert token resetting mechanism using a unique index on the date or by scheduling a daily midnight cron job to reset all counter collections atomically.

### 8.4 Branch-Aware Predictive Analytics
- Modify Redis caching keys: `wait_time:${facilityId}:${facilityType}:${branchId || 'global'}`
- Update wait time aggregation calculations in `analytics.controller.js` to match the specific `branchId`.

### 8.5 Enforcing ID Verification in GET Branches Route
Update `getBranches` inside `facility.controller.js` to verify user authority:
```javascript
exports.getBranches = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id !== req.user.facilityId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to view these branches" });
    }
    const facility = await Facility.findById(id).select("branches");
    if (!facility) return res.status(404).json({ success: false, message: "Facility not found" });

    res.json({ success: true, data: facility.branches });
  } catch (err) {
    next(err);
  }
};
```

---
