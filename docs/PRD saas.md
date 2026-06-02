# 📄 Product Requirements Document (PRD)
**Product Name:** QueueMD
**Current API Version:** v3.2
**Product Type:** Multi-Tenant SaaS
**Last Updated:** May 2026

## 1. Executive Summary
QueueMD is a universal queue management system aimed at healthcare and wellness facilities (clinics, hospitals, pathlabs, dental offices, physiotherapy centers, veterinary clinics). It digitizes patient check-ins, provides real-time wait-time predictions backed by an EMA algorithm and an optional Python FastAPI microservice, tracks patient EMR histories, manages lab reports, schedules appointments, handles facility subscriptions with automated billing, and sends asynchronous notifications via SMS/WhatsApp.

## 2. Target Audience
- **Facility Owners (Admins):** Monitor patient flow, oversee billing and subscription plan, manage staff access, and customize facility branding.
- **Receptionists:** Fast, intuitive interface to add patients to the queue, manage on-hold states, and update statuses.
- **Doctors/Specialists:** See the active queue and click "Call Next" from their private rooms; log diagnosis, prescriptions, and notes after each session.
- **Patients (End Users):** Receive accurate SMS/WhatsApp notifications and may visit a public tracking URL to see their real-time position in queue.

## 3. Core Features (v3.2 Scope)

### 3.1 Facility Isolation (Multi-Tenancy)
- Support for multiple facility types (clinic, hospital, pathlab, dental, physio, vet) driven by `facilityTypeConfig.js`.
- Strict data partitioning by `facilityId` and `facilityType` enforced at the middleware level (`auth.middleware.js`).
- Role-based access control via `authorize()` middleware supporting `admin`, `doctor`, `receptionist` roles.

### 3.2 Live Queue Management
- Add, Call Next, Mark Completed, Pause (On Hold), and Resume functionality.
- Real-time UI updates via Socket.io organized into facility-specific rooms (`${facilityId}_${facilityType}`).
- Intelligent estimated wait-time calculation using a rolling Exponential Moving Average (EMA) algorithm with active-cabin elapsed-time clamping.
- Python FastAPI microservice (`python_service/main.py`) provides supplementary ML-assisted per-type wait-time predictions.

### 3.3 Patient Directory & EMR
- A unified view of all past patients with visit counters and last-visit tracking.
- Auto-upsert into the Directory when a patient is added to the temporary Queue.
- `ClinicalVisit` logs capture doctor notes, prescriptions, diagnoses per session.
- Cloudinary-backed prescription/document upload via `UploadPrescriptionModal` + `ImageUploader`.
- Patient history accessible via `PatientHistoryDrawer` and `PatientHistoryTimeline`.

### 3.4 Lab Reports
- Dedicated `LabReports.jsx` page and `lab.controller.js`/`lab.routes.js` for pathlab-specific sample tracking.
- `LabStore` (Zustand) manages lab entry state client-side.

### 3.5 Appointment Scheduling
- Full calendar-based appointment system via `Appointments.jsx`.
- Components: `CalendarView`, `DayView`, `DailySchedule`, `AppointmentModal`.
- Backend: `appointment.controller.js` + `appointment.routes.js` + `Appointment.js` model.
- Real-time appointment socket events via `appointment.socket.js`.

### 3.6 Notification System
- `Notifications.jsx` page and `NotificationPage.jsx` for in-app notification feeds (under `pages/notifications/`).
- `notificationStore.js` tracks unread counts and notification list.
- BullMQ-powered background worker (`jobs/workers/notification.worker.js`) for non-blocking async SMS/WhatsApp delivery.
- `Notification.js` model persists notification records.
- `notification.controller.js` + `notification.routes.js` for CRUD.

### 3.7 Ticket System
- `Ticket.js` model and `ticket.controller.js`/`ticket.routes.js` for support/issue tickets.

### 3.8 Automated Notifications
- BullMQ powered background worker for sending non-blocking asynchronous alerts to patients.
- Exponential backoff retry policy (3 attempts, 5-second initial delay).
- `jobs/crons/directorySync.job.js` — Scheduled cron job that synchronizes orphaned queue entries back into the persistent Patient Directory.

### 3.9 SaaS Billing & Monetization
- **Free Tier:** Basic queue limits, standard wait-time calculations.
- **Pro Tier:** Unlimited queues, advanced Analytics Dashboard, AI-assisted wait-time predictions, PDF invoice generation, and full audit history.
- Integrated Razorpay checkout with webhook-driven status updates and HMAC SHA256 signature verification.
- `jobs/crons/subscriptionExpiry.job.js` — Daily `node-cron` job (runs at 00:00) that automatically downgrades expired Pro facilities to the Free plan.
- `requirePro` middleware (exported from `auth.middleware.js`) blocks premium routes for non-Pro facilities.
- `Subscription.js` model tracks subscription lifecycle events.
- `billingStore.js` (Zustand) manages invoice state client-side.

### 3.10 Help Center
- `HelpCenter.jsx` (under `pages/help/`) — Comprehensive in-app knowledge base with searchable FAQ, feature walkthroughs, and contextual guides.

### 3.11 Settings
- `Settings.jsx` (under `pages/settings/`) — The coordinator component for settings. Delegates to modular components: `ProfileSettings.jsx`, `BranchSettings.jsx`, `StaffSettings.jsx`, `SubscriptionSettings.jsx`, and `AppearanceSettings.jsx` for managing branding, base timers, accent color picker, font size, compact mode, subscription plan view, and staff access controls.

## 4. Non-Functional Requirements
- **Performance:** Complex aggregations must run in <200ms using compound MongoDB indexes. Python microservice predictions serve in <50ms from in-memory averaged data.
- **Security:** Dual JWT token architecture (Access Token in memory, Refresh Token in HTTP-only `sameSite: strict` cookie). Form validation via Zod schemas (`server/schemas/`). Helmet security headers. Rate limiting on auth routes (`express-rate-limit`).
- **Reliability:** Background jobs (BullMQ + Redis) must gracefully retry on failure without dropping notifications. Subscription expiry cron runs daily with startup scan in development mode.
- **Observability:** Winston-based structured logging (`utils/logger.js`) outputs to `combined.log` and `error.log`. Request-level middleware logs method, URL, status code, and duration.
- **Testing:** Jest + Supertest test suite (`server/tests/`). `npm test` runs with `--forceExit --detectOpenHandles`.
- **API Documentation:** Swagger UI auto-generated from JSDoc comments, served at `/api-docs`.

## 5. Future Roadmap (v4.0+)
- Patient-facing SMS tracking links to see their live position in queue on mobile browsers.
- Multi-branch enterprise support (multiple locations under one Facility account).
- Full AI/ML integration — replace EMA with LSTM-based forecasting via the Python microservice.
- Push notification support (Firebase Cloud Messaging) as alternative to SMS.
- WhatsApp Business API integration for richer notification templates.
- Mobile apps (React Native) for Doctors and Receptionists.
