# 🎨 QueueMD Design System & UI Architecture (v3.2)

## 1. Global Theme & Aesthetics
QueueMD employs a modern, premium "Glassmorphism & Neon" aesthetic, designed to feel robust, clean, and futuristic for healthcare environments.

- **Background:** Deep dark slate (`bg-[#0B1120]`) with subtle radial gradients for depth.
- **Typography:** `Inter` font family, utilizing heavy uppercase tracking (`tracking-widest`, `font-black`) for labels and headers to create a highly structured, data-dense look.
- **Micro-interactions:** Framer Motion is used globally for `whileHover` and `whileTap` scale effects on cards and buttons.
- **Skeletons:** Loading states use animated pulse cards (`<SkeletonCard />`, `<SkeletonQueue />`) instead of generic spinners to reduce perceived wait times.
- **Theme Persistence:** On mount, `App.jsx` restores user preferences from `localStorage`: dark/light theme, accent color (`--primary-container` CSS variable), font size, and compact mode toggled via `data-*` attributes on the `<html>` element.
- **Error Boundaries:** `<ErrorBoundary />` (now in `components/providers/`) wraps critical subtrees to prevent full-page crashes.
- **Toast Notifications:** `<ToastProvider />` (now in `components/providers/`) delivers global non-blocking alerts using a shared toast context.

## 2. Dynamic Facility Theming
The UI automatically adapts based on the active `facilityType` selected from the Sidebar/Config.
Driven by `facilityTypeConfig.js` (present in **both** `client/src/utils/` and `server/utils/`):

| Facility | Theme Primary | Theme Secondary | Icon |
|----------|---------------|-----------------|------|
| Clinic   | `#2563EB` (Blue) | `#10B981` (Green) | 🏥 |
| Pathlab  | `#7C3AED` (Purple)| `#F59E0B` (Amber) | 🔬 |
| Dental   | `#EC4899` (Pink) | `#F472B6` (Pink) | 🦷 |
| Physio   | `#10B981` (Green) | `#059669` (Dark Green)| 🧘 |
| Hospital | `#0EA5E9` (Sky) | `#38BDF8` (Light Sky) | 🏨 |
| Vet      | `#F97316` (Orange) | `#FB923C` (Light Orange) | 🐾 |

*UI elements like primary buttons, badges, and glowing borders automatically inherit these hex codes.*

## 3. Core Component Layouts

### 3.1 Sidebar Navigation
- **State:** Controlled globally. Expandable/Collapsible.
- **Features:** Shows user profile, facility switcher (for Admins), and core routes (Dashboard, Patients, Appointments, Lab Reports, Billing, Analytics, Staff, Help, Settings, Notifications).
- **Design:** Frosted glass effect (`backdrop-blur-md`, `bg-white/5`), sticky positioning (defined in `components/layout/Layout.jsx`).

### 3.2 Dashboard Main View
- **Top Stats:** 3-column grid showing Waiting Patients, Avg Wait Time (Dynamic), and Completed Today.
- **Currently Serving Window:** Highlighted box displaying the active Token number and a timer tracking the duration of the current consultation.
- **Waiting Queue List:** Scrollable list with hovering effects (defined in `components/features/queue/QueueList.jsx`). Each row shows Token #, Name, Phone, and dynamically calculated Estimated Wait Time.
- **On-Hold Section:** Dedicated "Paused Patients" area, visually distinct from the active queue, allowing one-click Resume.

### 3.3 Forms & Validation
- Powered by `react-hook-form` + `zod` (schemas live in `server/schemas/`).
- **Inputs:** Dark themed, rounded corners, subtle white borders on focus.
- **Errors:** Real-time red borders and inline red text directly below the offending input. Prevents form submission until valid.

### 3.4 Modals
- `<AddPatientModal />` (in `components/features/patient/`) — Enriched patient registration modal, supporting doctor selection, multi-department targeting, and real-time validation.
- `<StaffEditModal />` (in `components/features/staff/`) — Edit existing staff records in-place without leaving the Staff page.
- `<UploadPrescriptionModal />` / `<ViewPrescriptionsModal />` (in `components/features/prescription/`) — Secure prescription file upload and timeline viewer wired to Cloudinary via `<ImageUploader />` (in `components/ui/`).
- `<AppointmentModal />` (in `components/features/appointments/`) — Full-featured appointment creation and edit modal.

### 3.5 Patient History Components
- `<PatientHistoryDrawer />` (in `components/features/patient/`) — Slide-in panel showing the full EMR snapshot for a selected patient.
- `<PatientHistoryTimeline />` (in `components/features/patient/`) — Chronological timeline of all clinical visits, diagnoses, and uploaded documents.
- `<PrescriptionPrintView />` (in `components/features/patient/`) — Printer-ready prescription layout with facility branding.

## 4. Pages (Full Route Inventory)

| Route | Component | Access | File Location |
|-------|-----------|--------|---------------|
| `/login` | `Login.jsx` | Public | `pages/auth/Login.jsx` |
| `/register` | `Register.jsx` | Public | `pages/auth/Register.jsx` |
| `/dashboard` | `Dashboard.jsx` | Protected | `pages/dashboard/Dashboard.jsx` |
| `/patients` | `Patients.jsx` | Protected | `pages/patients/Patients.jsx` |
| `/appointments` | `Appointments.jsx` | Protected | `pages/appointments/Appointments.jsx` |
| `/lab-reports` | `LabReports.jsx` | Protected | `pages/lab/LabReports.jsx` |
| `/billing` | `Billing.jsx` | Protected | `pages/billing/Billing.jsx` |
| `/billing/create-invoice` | `CreateInvoice.jsx` | Protected | `pages/billing/CreateInvoice.jsx` |
| `/staff` | `Staff.jsx` | Protected | `pages/staff/Staff.jsx` |
| `/staff/add` | `AddStaff.jsx` | Protected | `pages/staff/AddStaff.jsx` |
| `/analytics` | `Analytics.jsx` | Protected | `pages/analytics/Analytics.jsx` |
| `/settings` | `Settings.jsx` | Protected | `pages/settings/Settings.jsx` |
| `/notifications` | `Notifications.jsx` | Protected | `pages/notifications/Notifications.jsx` |
| `/help` | `HelpCenter.jsx` | Protected | `pages/help/HelpCenter.jsx` |
| `/track/:facilityId/:tokenNumber` | `PublicTracking.jsx` | Public | `pages/public/PublicTracking.jsx` |
| `/lobby/:facilityId` | `LobbyPortal.jsx` | Public | `pages/queue/LobbyPortal.jsx` |

## 5. Analytics Chart Components (`components/features/charts/`)
| Component | Purpose |
|-----------|---------|
| `AIInsightsCard.jsx` | AI-generated insight summaries via Python FastAPI microservice |
| `DailyTrendChart.jsx` | Daily patient volume line/area chart |
| `FacilityDonutChart.jsx` | Per-department share donut visualization |
| `HourlyBarChart.jsx` | Hourly patient traffic bar chart |
| `TopDoctorsCard.jsx` | Ranked list of top-performing doctors by completion |
| `ChartSkeleton.jsx` | Loading skeleton for chart cards |

## 6. Appointment Components (`components/features/appointments/`)
- `AppointmentModal.jsx` — Full appointment form with date picker, doctor, patient search.
- `CalendarView.jsx` — Month/week calendar grid.
- `DailySchedule.jsx` — Day's agenda view.
- `DayView.jsx` — Detailed single-day time-slot grid.

## 7. Zustand Global State
| Store | Manages |
|-------|---------|
| `authStore.js` | JWT access token in memory, user profile, auth status |
| `facilityStore.js` | Active `facilityId`, `facilityType`, Demo Mode toggle |
| `billingStore.js` | Invoice list, Razorpay session, billing filters |
| `labStore.js` | Lab report entries and filter state |
| `notificationStore.js` | Notification feed, unread counts, real-time push state |

## 8. Animation & Transitions
- **Page Transitions:** `<AnimatePage />` (in `components/layout/`) wrapper uses Framer Motion (`initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`) to smoothly fade and slide pages in.
- **Queue Updates:** When a patient is added, called, paused, or resumed, the list animates smoothly without jarring layout shifts.
- **Loading States:** `<LoadingOverlay />` (in `components/ui/`) provides a full-screen centered spinner for route-level async operations.
- **Empty States:** `<EmptyState />` (in `components/ui/`) and `<StaffEmptyState />` (in `components/features/staff/`) render contextual zero-data illustrations.

## 9. Settings Modular UI Architecture (`pages/settings/`)
The settings interface is split into single-responsibility sub-components to reduce file footprint and improve load speed:
- `Settings.jsx`: The central coordinator managing `activeTab`, `pendingChanges`, API fetches and saves.
- `ProfileSettings.jsx`: Includes `MyAccountTab` (password changes), `FacilityProfileTab` (working hours, addresses, static QR codes stand print view), and `NotificationsTab` (app alerts, sounds, emails).
- `BranchSettings.jsx`: Includes `BranchesTab` (multi-location management).
- `StaffSettings.jsx`: Includes `QueueSettingsTab` (prefix configurations, timings), `FacilityTypesTab` (departments mapping), `DangerZoneTab` (database exports, facility archive/restores), and `SecurityAuditModal` (admin logs lookup).
- `SubscriptionSettings.jsx`: Includes `SubscriptionTab` (plan matrices, billing history invoices, Razorpay upgrades).
- `AppearanceSettings.jsx`: Includes `AppearanceTab` (fonts sizing, light/dark themes, compact grid views).
