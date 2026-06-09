# 🏥 QueueMD: Ultimate SaaS Architecture, Phase-by-Phase Development Manual, and Complete System Walkthrough

QueueMD is a state-of-the-art, multi-tenant Software-as-a-Service (SaaS) Platform engineered for healthcare and wellness facilities (OPD Clinics, Hospitals, Pathology Labs, Dental Clinics, Physiotherapy Centers, Veterinary clinics, etc.). It serves as a comprehensive system designed to digitize patient check-in flows, deliver real-time wait-time predictions, track EMR (Electronic Medical Record) history, handle multi-department queue isolation, and manage subscriptions with automated payment webhooks.

This document outlines the **Phase-by-Phase Implementation Journey** of the QueueMD project. It tracks exactly *what* was implemented in each phase, *how* it was built, and the current *development status* so you can instantly recognize where the system stands.

---

## 🧭 1. Executive Summary & SaaS Business Domain

### 1.1 The Business Problem
Healthcare waiting rooms suffer from high friction, stress, and inefficiency. The typical patient experience involves checking in, being given no indication of actual wait time, and sitting in a crowded lobby for an unpredictable period. For facility operators, managing patient queues across multiple doctors, rooms, or pathology sample processing desks is a complex challenge often reliant on paper tokens or manual ledger entries. 

### 1.2 QueueMD's Solution
QueueMD bridges this gap by digitizing the queue lifecycle from registration to completion. 
- **Admins & Receptionists** get an intuitive dashboard to register patients, assign them to departments, print or display token sheets, and put patients on hold (pause) or resume them.
- **Doctors** get a clean, hands-free "Call Next" interface in their private consulting rooms to call in the next waiting patient, complete sessions, and instantly log diagnosis/prescription details.
- **Patients** receive a public tracking URL via SMS/browser or a lobby screen showing real-time cabin status, people ahead, and intelligent, rolling estimated wait times synchronized instantly.

### 1.3 Monetization & Subscription Strategy

QueueMD is monetized under a **Freemium SaaS Model**:
- **Free Tier:** Basic usage capped at 3 active queues, standard manual wait-time calculations, and a hard capacity cap of **5 active staff members**.
- **Pro Tier:** Unlimited queues, access to advanced AI-assisted predicted wait-time engines, custom departments, unlimited staff members, professional PDF invoice generation, and full detailed historical Analytics dashboards.
- **Monetization Engine:** Handled via a secure Razorpay subscription checkout integration synced with live webhook processing to auto-renew or expire access based on transactional events.

---

## 🗺️ 2. Development Roadmap: Phase-by-Phase Status Tracker

Below is the logical evolutionary breakdown of the QueueMD platform. You can use this section to identify exactly which features belong to which phase and track their completion status.

| Phase | Module Name | Core Objectives | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Core MVP Queue Lifecycle | Base setup, Mongoose models, Express APIs (Add, Next, Complete), Token Counter sequence, basic layouts. | **100% Completed** |
| **Phase 2** | Department Isolation & Multi-Tenancy | Facility mapping, JWT-based tenant isolation middlewares, dynamic styling themes, Demo Mode. | **100% Completed** |
| **Phase 3** | EMR Timeline & Patient Directory | Unified patient index, auto-upserts on register, ClinicalVisit logs, Cloudinary image upload pipeline. | **100% Completed** |
| **Phase 4** | Advanced Predictive AI Engine | Rolling EMA calculations, elapsed time clamping, database bulk write, synced public tracking portal. | **100% Completed** |
| **Phase 5** | SaaS Billing, Webhooks & Workers | Razorpay subscription checkout, verified SHA256 HMAC webhook listener, BullMQ background notification worker. | **100% Completed** |
| **Phase 6** | Queue Optimization & Sync Refinement | Complete removal of "Skip/No-Show" logic, integration of "Pause/Resume" states, real-time wait updates. | **100% Completed** |

---

## 🚀 3. Phase 1: Core MVP Queue Lifecycle & Database Foundation

### 3.1 Goal & Business Objective
Set up the core data layer and basic endpoints to move a patient through a simple, chronological queue cycle.

### 3.2 Database Schema Design
We built the baseline database schemas in Mongoose. The core model is the **Queue** schema:
- **File:** [Queue.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/models/Queue.js)
- **Key Fields:**
  - `tokenNumber`: Unique sequential integer representing the patient's place in queue.
  - `status`: String enum representing the lifecycle: `['waiting', 'in-progress', 'paused', 'completed']`.
  - `createdAt`, `calledAt`, `completedAt`: Timestamps tracking efficiency.

### 3.3 Core Endpoint Implementation
1. **Add Patient (`POST /api/queue/add`):**
   - Registers a patient, atomically increments the department token counter, and saves a pending entry with a status of `'waiting'`.
2. **Call Next (`POST /api/queue/next`):**
   - Finds the oldest waiting patient (`status: 'waiting'`), updates their status to `'in-progress'`, and records the `calledAt` timestamp.
3. **Mark Completed (`PATCH /api/queue/:patientId/complete`):**
   - Moves the patient to `'completed'`, calculates total consultation duration, and saves doctor notes.

---

## 🔒 4. Phase 2: Multi-Tenancy, Department Isolation & Dynamic UI

### 4.1 Goal & Business Objective
Scale the system to support thousands of clinics (tenants) and multiple internal departments (e.g. Dental, Physiotherapy, Lab) using a single, unified database schema.

### 4.2 Strict Tenant Isolation Key Strategy
Every database model is dynamically partitioned using two scopes:
1. `facilityId`: Refers to the primary account ID of the registered clinic/hospital.
2. `facilityType`: Maps to the active department (e.g. `'dental'`, `'pathlab'`, `'physio'`).

We implemented an authentication middleware `auth.middleware.js` that decodes the user's JWT and injects these variables directly into `req.user`. This prevents cross-tenant data leaks because all queries are isolated:
```javascript
const activeQueue = await Queue.find({
  facilityId: req.user.facilityId,
  facilityType: req.user.facilityType,
  status: "waiting"
});
```

### 4.3 Dynamic Front-end Themes & Demo Mode
- **Dynamic Themes:** UI styles shift colors and branding rules based on the active department config (`facilityTypeConfig.js`) using Vanilla HSL CSS custom properties.
- **Demo Mode:** Allows operators to swap between department mock previews instantly in their browser while maintaining strict security checks in the backend database.

---

## 📇 5. Phase 3: EMR Timeline, Patient Directory & File Uploads

### 5.1 Goal & Business Objective
Maintain a persistent history of patients, allowing clinics to track visits, health conditions, diagnosis notes, and uploaded clinical files over time.

### 5.2 Atomic Patient Directory Upsert
When a patient is added to the daily queue, the system executes an atomic upsert on the `Patient` collection:
- If the patient is new, it creates a profile in the persistent directory.
- If the patient has visited before, it increments their `totalVisits` counter and updates `lastVisit`.

### 5.3 EMR Clinical Timeline & Cloudinary Storage
- **Clinical Visit Schema:** On session completion, the doctor's notes and prescriptions are logged inside the `ClinicalVisit` collection.
- **Cloudinary Prescription Upload:** The patient can securely upload prescriptions or lab bills via their browser. The backend utilizes `multer` to intercept the file buffer and stream it directly to **Cloudinary** using high-quality folder structures, saving the asset URL directly to the patient's EMR timeline.

---

## 📈 6. Phase 4: Advanced Predictive AI Engine & Wait-Time Sync

### 6.1 Goal & Business Objective
Provide highly accurate, rolling estimated wait times to patients, reducing anxiety and allowing them to wait from home or nearby cafes.

### 6.2 Exponential Moving Average (EMA) Algorithm
Instead of standard static multipliers, wait times are calculated dynamically inside [waitTimeCalculator.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/utils/waitTimeCalculator.js):
- It fetches the last 15 completed consultation durations.
- Calculates a rolling Exponential Moving Average (EMA) with $\alpha = 0.3$:
  $$\text{EMA}_{\text{new}} = (0.3 \times \text{Duration}_{\text{current}}) + (0.7 \times \text{EMA}_{\text{previous}})$$
- **Active Cabin Clamping:** Tracks the elapsed time of the patient currently inside the doctor's cabin and clamps the remaining time estimate between $30\%$ (min) and $180\%$ (max) of the EMA.

### 6.3 Sequential Wait Prediction
The estimated wait time for the $N$-th patient in queue is calculated as:
$$\text{WaitTime}_N = \text{round}\left( (N \times \text{EMA} \times 1.1) + \text{Remaining} \right)$$
- If the calculation results in $\le 0$ minutes, the system enforces a realistic **5-minute minimum** for waiting patients.
- The system executes a database `bulkWrite` operation to update all waiting cards instantly.

---

## ⚙️ 7. Phase 5: SaaS Billing, Webhooks & BullMQ Background Workers

### 7.1 Goal & Business Objective
Monetize the platform through premium plan tiers and optimize performance by offloading heavy, non-blocking notification tasks to background processes.

### 7.2 Razorpay Subscription Engine & HMAC Webhook Listener
- **Pro Tier Barriers & Resource Gates:**
  - Enforces a custom `requirePro` middleware to block access to premium routes (Analytics, invoice generation) for basic accounts.
  - Restricts resource usage on the Free Tier: Free plans are strictly capped at **5 active staff members**. This is atomically checked at the database controller level during registration (`user.controller.js`) and gated visually on the client frontend via tooltips, toast alerts, and a dynamic usage progress banner.
- **Cryptographic Webhook Verification:** When subscription payments succeed, Razorpay triggers a post webhook. The server validates the webhook signature using SHA256 HMAC:
  ```javascript
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");
  ```
  Only matching signatures upgrade the facility to `'pro'`.

### 7.3 BullMQ & Redis Background Worker
- **Non-blocking Notifications:** QueueMD runs a separate background thread (`npm run worker`) using **BullMQ** and **Redis**.
- When patients approach their turn, notification tasks are added to the Redis queue.
- The worker executes them asynchronously with an **exponential backoff retry policy** (3 attempts, 5-second initial delay), protecting API performance.

---

## 🔄 8. Phase 6: Queue Optimization & Sync Refinement (Latest Implementations)

### 8.1 Goal & Business Objective
Clean up the queue layout, remove outdated and confusing features, and add an advanced "On Hold" (Pause/Resume) system for patients who are not physically present when called.

### 8.2 Removal of "Skip Patient" (No-Show)
The "Skip Patient" concept was completely removed because it created confusion and orphaned data metrics.
- All `"no-show"` database status configurations and analytics counters were deleted.
- Frontend buttons for skipping patients were removed, making the "Complete Consultation" button a clean, prominent full-width CTA.

### 8.3 Implementation of "Pause & Resume" System
We introduced a high-fidelity **Pause/Resume (On Hold)** feature:
- **Pause Patient:** If a patient is not in the lobby when called, the receptionist clicks "Put on Hold". The backend updates their status to `'paused'`, records a `pausedAt` timestamp, and triggers a wait-time recalculation.
- **Resume Patient:** When the patient returns, clicking "Resume" moves them back to `'waiting'` status. They keep their position relative to their original token sequence.
- **Real-time Recalculations:** Both actions trigger an instant Socket.io broadcast to update wait times for all other waiting patients.

## 9. Comprehensive Project Folder Structure

Below is the complete folder structure representing the logical layout of the QueueMD platform:

```text
QueueMD/
├── docs/                             # Full Product and Tech Architecture documentation
│   ├── PRD saas.md                   # Product Requirements Document
│   ├── saas.md                       # Initial SaaS High-Level Outline
│   ├── saas1.md                      # [CURRENT] Core Detailed Architectural Document
│   └── WAIT_TIME_LOGIC.md            # Detailed wait-time logic mathematical documentation
│
├── queue-md-universal/
│   ├── client/                       # React Frontend Application (Vite + Tailwind/CSS)
│   │   ├── public/                   # Static public assets
│   │   ├── src/                      # Main Frontend Source folder
│   │   │   ├── assets/               # SVG, PNG Icons and visual branding resources
│   │   │   ├── components/           # Reusable Modular UI Components
│   │   │   │   ├── layout/           # Page layouts (Layout.jsx, ProtectedRoute.jsx)
│   │   │   │   ├── providers/        # Context Providers (ToastProvider.jsx, ErrorBoundary.jsx)
│   │   │   │   ├── ui/               # Base UI kits (Button, Modal, ImageUploader, Loaders)
│   │   │   │   └── features/         # Feature-specific components grouped by domain
│   │   │   │       ├── patient/      # AddPatientForm, PatientHistoryTimeline, etc.
│   │   │   │       ├── queue/        # QueueList.jsx
│   │   │   │       ├── staff/        # StaffEditModal.jsx
│   │   │   │       ├── appointments/ # CalendarView, DayView, AppointmentModal
│   │   │   │       ├── charts/       # AIInsightsCard, DailyTrendChart, etc.
│   │   │   │       └── notifications/ # NotificationCard.jsx
│   │   │   ├── pages/                # Core Router Page Views grouped by feature
│   │   │   │   ├── auth/             # Login.jsx, Register.jsx
│   │   │   │   ├── dashboard/        # Dashboard.jsx
│   │   │   │   ├── queue/            # LobbyPortal.jsx
│   │   │   │   ├── patients/         # Patients.jsx
│   │   │   │   ├── appointments/     # Appointments.jsx
│   │   │   │   ├── analytics/        # Analytics.jsx
│   │   │   │   ├── billing/          # Billing.jsx, CreateInvoice.jsx
│   │   │   │   ├── lab/              # LabReports.jsx
│   │   │   │   ├── staff/            # Staff.jsx, AddStaff.jsx
│   │   │   │   ├── settings/         # Settings.jsx (split coordinator) + sub-components
│   │   │   │   └── notifications/    # Notifications.jsx
│   │   │   ├── hooks/                # Custom React Hooks (useToast.jsx, useAuth.js, useSocket.js)
│   │   │   ├── store/                # Zustand global state modules
│   │   │   ├── services/             # Network services (api.js, socket.js, labApi.js, staffApi.js)
│   │   │   ├── utils/                # Utility configs (facilityTypeConfig.js)
│   │   │   ├── App.css               # Keyframe animations
│   │   │   ├── App.jsx               # Central React routing definition
│   │   │   ├── index.css             # Glassmorphic Vanilla CSS tokens
│   │   │   └── main.jsx              # Main DOM entrypoint
│   │
│   ├── server/                       # Node.js + Express Backend Server Application
│   │   ├── config/                   # Global database and cache drivers (db.js, redis.js, cloudinary.js)
│   │   ├── middleware/               # Auth, rate-limiter, requirement validation
│   │   ├── models/                   # Mongoose MongoDB Data Models (Queue, Patient, User, etc.)
│   │   ├── schemas/                  # Zod validation schemas
│   │   ├── controllers/              # Route request endpoint handlers
│   │   ├── routes/                   # Express server API endpoints
│   │   ├── services/                 # Core business services (waitTime, audit, tenant, branch, etc.)
│   │   ├── jobs/                     # Background queue processors
│   │   │   ├── queues/               # BullMQ queue configurations
│   │   │   ├── workers/              # BullMQ queue workers (notification.worker.js)
│   │   │   └── crons/                # Scheduled background tasks (subscriptionExpiry, directorySync)
│   │   ├── sockets/                  # Real-time WebSocket namespaces
│   │   ├── utils/                    # Server-side Winston logger, date helpers
│   │   ├── scripts/                  # Seeds and database migration actions
│   │   │   ├── seeds/                # Seed scripts for dev environments
│   │   │   └── migrations/           # Schema migration utilities (migrate-branches.js)
│   │   └── server.js                 # Express server initialization entry
│   │
│   └── python_service/               # FastAPI Wait-Time Predictor Microservice
│       ├── app.py                    # Predictor API and MongoDB query engine
│       ├── requirements.txt          # Python dependencies (fastapi, uvicorn, pymongo, redis, etc.)
│       └── .env                      # Environment configurations (MONGO_URI, PORT)
```

---

## 10. Step-by-Step Codebase Directory Walkthrough

Below is a complete file-by-file structural walkthrough of the active QueueMD codebase:

### 10.1 Backend Server Directory (`/server`)
- **[server.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/server.js):** The primary application entry point. Initializes Express, sets up Socket.io, binds connection listeners, and hooks up the MongoDB Mongoose connection.
- **`/models` (Database Schemas):**
  - **[Queue.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/models/Queue.js):** The temporary daily queue schema containing `tokenNumber`, status (`'waiting'`, `'in-progress'`, `'paused'`, `'completed'`), and predictions.
  - **[Patient.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/models/Patient.js):** The persistent patient directory collection.
  - **[ClinicalVisit.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/models/ClinicalVisit.js):** Stores EMR visits, notes, prescriptions, and Cloudinary-hosted documents.
  - **[Facility.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/models/Facility.js):** Represents the business tenant containing plan tier, branding logo, and customized base timings.
- **`/controllers` (Route Request Handlers):**
  - **[queue.controller.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/controllers/queue.controller.js):** Main queue operations (`addPatient`, `nextPatient`, `markPatientCompleted`, `pausePatient`, `resumePatient`).
  - **[analytics.controller.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/controllers/analytics.controller.js):** Aggregates daily charts, completion rates, traffic trends, and department-specific insights.
  - **[patientUpload.controller.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/controllers/patientUpload.controller.js):** Connects `multer` buffers with Cloudinary upload streams to securely attach documentation to clinical histories.
  - **[user.controller.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/controllers/user.controller.js):** Handles core staff user management (CRUD operations) and implements SaaS tier capacity limitations (e.g. Free plan capped at 5 staff members).
- **`/services` (Business logic layer):**
  - **[waitTime.service.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/services/waitTime.service.js):** Rolling EMA wait time calculator and database synchronizer.
  - **[tenant.service.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/services/tenant.service.js):** Isolated tenant checks and verification logic.
  - **[branch.service.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/services/branch.service.js):** Validate branch ownership dynamically.

### 10.2 Frontend Client Directory (`/client`)
- **`/src/pages` (Main Views grouped by feature):**
  - **[Dashboard.jsx](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/client/src/pages/dashboard/Dashboard.jsx):** The rich interactive Doctor/Receptionist panel showing active servings, waiting queues, on-hold patients, and live stats.
  - **[LobbyPortal.jsx](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/client/src/pages/queue/LobbyPortal.jsx):** Public dashboard for patients entering their credentials to track queues in real-time.
  - **[Analytics.jsx](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/client/src/pages/analytics/Analytics.jsx):** High-end business performance dashboards tracking hourly traffic, completion rates, and active wait trends.
  - **[Staff.jsx](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/client/src/pages/staff/Staff.jsx):** Displays active staff members and visual progress indicators for Free tier limits.
  - **[AddStaff.jsx](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/client/src/pages/staff/AddStaff.jsx):** Dedicated registration UI for new clinic operators, verifying limits dynamically on the client side.
  - **[Settings.jsx](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/client/src/pages/settings/Settings.jsx):** The coordinator view. Orchestrates tabs, fetches facility metadata, and delegates forms to sub-settings components.
- **`/src/store` (Zustand Stores):**
  - **[authStore.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/client/src/store/authStore.js):** Manages user session state, automatic token silent refreshes, and access token buffers.
  - **[facilityStore.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/client/src/store/facilityStore.js):** Manages Demo Mode states, active facility types, and isolated branch scopes.
- **`/src/services` (API & Socket):**
  - **[api.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/client/src/services/api.js):** Configured Axios wrapper with automatic token refresh headers.
  - **[socket.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/client/src/services/socket.js):** Enforces a singular socket client instance across all React sub-pages to optimize network traffic.

### 10.3 Python Microservice Directory (`/python_service`)
- **[app.py](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/python_service/app.py):** The primary FastAPI microservice entry point. It connects directly to MongoDB to execute calculations and provides a health check and prediction endpoint.
- **[requirements.txt](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/python_service/requirements.txt):** Declares pinned Python dependencies (FastAPI, Uvicorn, PyMongo, Redis, and dotenv).

---

This complete technical architecture documentation establishes the benchmark for modern Software-as-a-Service system implementations, showcasing robust logical isolation, highly accurate mathematical predictions, non-blocking asynchronous backgrounds, and an overall elegant visual aesthetic.
