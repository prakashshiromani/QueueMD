# QueueMD Server Documentation

This document providing a technical deep-dive into the backend architecture of the QueueMD Universal SaaS platform.

## 🛠 Tech Stack
- **Core**: Node.js & Express
- **Database**: MongoDB (Mongoose ODM)
- **Validation**: Zod (Dynamic schemas)
- **Security**: JWT & BcryptJS
- **Real-time**: Socket.io
- **Logging**: Winston

---

## 🗄 Database & Scaling
The system uses **Compound Indexing** for multi-tenant isolation and performance.

### Isolation Strategy
Every record (User, Queue, Payment) is tagged with `{ facilityId, facilityType }`.
- **Compound Index**: `{ facilityId: 1, facilityType: 1, tokenNumber: 1 }`
- **Benefit**: Ensures that tokens are unique *per facility per type*. Token #1 for Pathlab never conflicts with Token #1 for Dental in the same facility.

---

## 🛡 Dynamic Validation (Zod)
The server implements **Structural Scalability** via `utils/facilityTypeConfig.js`.
- **`getValidationSchema(type)`**: Dynamically returns a customized Zod schema.
- **Strict Mode**: If a Pathlab entry comes in, Zod *requires* `sampleId`. If it's a Clinic entry, it allows flexible `customData`.
- **Safety**: Controllers never manual-check fields; they rely on `schema.safeParse()`.

---

## 📡 Socket.io Room Architecture
Real-time events are isolated using a specialized room pattern.

### Room Naming: `${facilityId}_${facilityType}`
- **Join**: Triggered by `join_facility` event.
- **Isolation**: Events emitted to a Pathlab room are never received by a Dental dashboard, even within the same physical building.
- **Safety**: Emission logic is wrapped in `try-catch` to ensure socket hiccups never crash critical database transactions.

---

## 🔐 Auth & Middleware

### 1. Unified Registration
Supports both **Auto-Creation** of facilities (for first-time admins) and **Dynamic Join** (for adding users to existing facilities).

### 2. Multi-Context JWT
The JWT includes both `facilityId` and `facilityType`. These are the "Source of Truth" for all subsequent API calls. Controllers never trust `facilityId` from a request body.

### 3. Role-Based Access Control (RBAC)
- **`authorize`**: Middleware that checks both global roles (e.g., `admin`) and sanctioned facility types.

### 4. Staff & Professional Management
- **Endpoint**: `POST /user/create` — Allows admins to manually register staff members (Doctors, Technicians, Receptionists, **Nurses**).
- **Automation**: Automatically links new staff to the admin's `facilityId` and `facilityType` based on the admin's JWT context.
- **Validation**: Enforces role-specific constraints and unique email checks. Supports expanded roles like `nurse` and `physiotherapist` since v3.2.

---

## 🌍 Localization & Global Support
- **Regional Defaults**: The server-side validation and response formatting are optimized for Indian operations (+91).
- **Expanded Types**: Now supports **Physio** (🧘) with specialized `PHY` token prefixes and session-based status flows.
- **Help Logic**: The server is prepared to support future help-ticket and live-chat integrations initiated from the frontend Help Center.

---

## 🚀 Future Scalability
- **Redis Ready**: The socket server is scaffolded for the `socket.io-redis` adapter for multi-instance deployments.
- **Config-First**: Adding a new healthcare category requires zero changes to the Express routes or Mongoose models.
