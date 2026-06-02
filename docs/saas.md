# 🏛️ QueueMD SaaS Architecture (v3.2)

## 1. System Overview
QueueMD is a Multi-Tenant Software-as-a-Service (SaaS) built on the MERN stack (MongoDB, Express.js, React, Node.js), supplemented by a Python FastAPI microservice for ML-assisted wait-time predictions. It handles distinct healthcare facilities using a single universal codebase, currently on **API v3.2**.

## 2. Multi-Tenant Architecture
Data isolation is strictly enforced at the database and application levels.
- **Database:** A single MongoDB database is used (Shared Database, Isolated Schema strategy).
- **Isolation Keys:** Every document in `User`, `Queue`, `Patient`, `Appointment`, `Invoice`, `Notification`, and `Ticket` collections contains a `facilityId` (ObjectId referencing the Facility) and a `facilityType` (e.g., `'clinic'`, `'pathlab'`, `'dental'`).
- **Queries:** All backend controllers extract `facilityId`, `facilityType`, and `role` from the decoded JWT token injected by `auth.middleware.js`. The `find()` queries are hardcoded to include these keys:
  ```javascript
  const activeQueue = await Queue.find({
    facilityId: req.user.facilityId,
    facilityType: req.user.facilityType,
    status: "waiting"
  });
  ```
  This guarantees cross-tenant data leaks are impossible.
- **Role-Based Access:** The `authorize(...roles)` middleware exported from `auth.middleware.js` enforces role-level restrictions (`admin`, `doctor`, `receptionist`) in addition to tenant isolation.

## 3. Real-Time Infrastructure
- **Socket.io:** Handles live queue, appointment, and notification updates across multiple devices (e.g., Doctor's tablet and Receptionist's PC).
- **Rooms Pattern:** Sockets join specific rooms named `${facilityId}_${facilityType}`. Emitted events (`queue_update`, `appointment_update`) only broadcast to users authenticated and actively viewing that specific facility's dashboard.
- **Socket Entry Point:** `sockets/index.js` initializes all socket namespaces and routes events to:
  - `queue.socket.js` — Multi-department queue room emitter.
  - `notification.socket.js` — Centralized clinic alert signals.
  - `appointment.socket.js` — Real-time appointment change events.

## 4. Background Job Processing
- **BullMQ & Redis:** Used to handle asynchronous tasks that shouldn't block the main Node.js event loop.
- **Notification Worker:** A dedicated Node process (`npm run worker` ➔ `jobs/workers/notification.worker.js`) listens to the Redis queue to process and send SMS/WhatsApp notifications to patients when their token is approaching. Uses exponential backoff retry (3 attempts, 5-second initial delay).
- **Subscription Expiry Cron (`jobs/crons/subscriptionExpiry.job.js`):** A `node-cron` job scheduled at midnight daily (`0 0 * * *`) that finds all Pro facilities with a past `subscriptionEnd` date and automatically downgrades them to the Free plan. In development, it also runs once on server startup.
- **Directory Sync Cron (`jobs/crons/directorySync.job.js`):** Periodic cron job that reconciles queue entries back into the persistent `Patient` directory, handling any edge-case orphaned records.

## 5. Python FastAPI Microservice (`python_service/`)
A lightweight Python FastAPI service provides supplementary ML-assisted wait-time predictions:
- **Endpoint:** `GET /predict-wait/{facility_id}?facility_type=clinic`
- **Logic:** Fetches the last 30 completed queue entries for the given facility+type, computes an average duration from `actualDuration` or derived timestamps, and clamps the result within per-type realistic ranges (e.g., Pathlab: 5–20 min, Dental: 15–60 min).
- **Confidence:** Returns `"high"` when ≥3 data points exist; falls back to `"low"` with type-based defaults.
- **Isolation:** Predictions are strictly per `facilityType` — Dental averages never pollute Pathlab estimates.

## 6. Billing & Subscriptions (Razorpay)
- **Flow:** Users upgrade to the "Pro" plan via a Razorpay checkout modal in `Settings.jsx` or `Billing.jsx`.
- **Webhooks:** Razorpay hits a public webhook endpoint `/api/subscription/webhook` when a payment succeeds.
- **Security:** The backend uses `crypto.createHmac('sha256', secret)` to verify the `x-razorpay-signature` header. Only if the signature matches is the Facility marked as `subscriptionPlan: 'pro'`.
- **Enforcement:** `requirePro` middleware (in `auth.middleware.js`) blocks access to premium routes (Analytics, Billing generation) if the facility is not on the Pro plan with `subscriptionStatus: 'active'`.
- **Auto-Expiry:** `subscriptionExpiryCron.js` auto-downgrades expired facilities daily.
- **Models:** `Subscription.js` tracks subscription lifecycle events; `Invoice.js` stores generated invoices.

## 7. Authentication Architecture
- **Dual JWT Strategy:**
  - **Access Token:** Short-lived (15 minutes), returned in the JSON response body, kept in Zustand `authStore` memory only.
  - **Refresh Token:** Long-lived (7 days), attached as an `httpOnly`, `secure`, `sameSite: strict` cookie.
- **Interceptor:** The frontend uses an Axios response interceptor (`services/api.js`). If an API call fails with `401 Unauthorized`, it pauses the request, silently calls `/api/auth/refresh` using the cookie, updates the Access Token in `authStore`, and retries the original request seamlessly.
- **Role Authorization:** `authorize(...roles)` middleware enforces route-level role checks with optional `allowedFacilityTypes` constraints.

## 8. Observability & Logging
- **Winston Logger (`utils/logger.js`):** Structured JSON logging to `combined.log` (all levels) and `error.log` (errors only).
- **Request Logger Middleware:** Inline Express middleware in `server.js` logs every request's method, URL, response status, and duration.
- **Swagger API Docs:** Auto-generated OpenAPI documentation available at `/api-docs`, configured via `config/swagger.js`.

## 9. Security Hardening
- **Helmet:** HTTP security headers applied globally.
- **CORS:** Strict origin allowlist — only `localhost:*` (development) and `process.env.CLIENT_URL` (production).
- **Rate Limiting:** `express-rate-limit` applied to sensitive auth routes.
- **Input Validation:** Zod schemas (`server/schemas/`) validate request bodies before controllers execute.
- **File Uploads:** Multer middleware (`middleware/multer.js`) + `verifyUploadToken.js` secure patient document uploads before Cloudinary streaming.
- **Error Handling:** Global `errorHandler` middleware (`middleware/error.middleware.js`) normalizes all error responses.

## 10. Testing
- **Framework:** Jest + Supertest (`server/tests/`).
- **Run Command:** `npm test` (with `--forceExit --detectOpenHandles` to handle open async handles).
- The `app` export from `server.js` is guarded by `process.env.NODE_ENV !== 'test'` to prevent the server from starting during test runs.
