
# QueueMD Universal - Comprehensive Project Documentation

## Executive Summary

QueueMD Universal is a comprehensive healthcare queue management system designed for clinics, path labs, dental clinics, and physiotherapy centers. The system provides real-time patient queue management, smart wait time prediction, and multi-facility support through a modern React frontend and Node.js/Express/MongoDB backend.

The application features:
- **Multi-facility Support**: Clinic, Pathlab, Dental Clinic, and Physiotherapy modes
- **Real-time Queue Management**: Socket.io powered real-time updates across all connected clients
- **Smart Wait Time Prediction**: Machine learning-inspired wait time calculations based on historical consultation data
- **Role-based Access Control**: JWT authentication with role-based permissions
- **Analytics Dashboard**: Real-time statistics, paginated consultation history, and doctor performance tracking
- **Security & Integrity**: Duplicate entry prevention and automatic CRM demographic synchronization
- **Responsive Design**: Tailwind CSS with custom theme support per facility type

## Technology Stack

### Frontend
- **React 18.2.0**: Component-based UI framework
- **React Router 6.20.0**: Client-side routing with future flags
- **Vite 5.0.0**: Build tool and development server
- **Zustand 4.4.7**: State management with persistence
- **Socket.io-client 4.7.2**: Real-time bidirectional communication
- **Axios 1.6.0**: HTTP client with interceptors
- **Tailwind CSS 3.4.0**: Utility-first CSS framework
- **Lucide React 0.300.0**: Icon library

### Backend
- **Node.js**: Runtime environment
- **Express 5.2.1**: Web application framework
- **MongoDB/Mongoose 9.4.1**: NoSQL database with ODM
- **Socket.io 4.8.3**: Real-time event-based communication
- **JWT (jsonwebtoken 9.0.3)**: Token-based authentication
- **bcryptjs 3.0.3**: Password hashing
- **Zod 4.3.6**: Runtime type validation
- **Winston 3.19.0**: Logging library

### Database
- **MongoDB**: Document-based NoSQL database
- **Mongoose ODM**: Schema validation and modeling

## Project Structure

```
queue-md-universal/
├── client/                          # React Frontend Application
│   ├── public/
│   │   └── index.html              # Main HTML template
│   ├── src/
│   │   ├── assets/                 # Static assets (images, icons)
│   │   ├── components/             # Reusable UI components
│   │   │   ├── AddPatientForm.jsx
│   │   │   ├── FacilitySelector.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── QueueList.jsx
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── pages/                  # Route-level page components
│   │   │   ├── AddStaff.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── Billing.jsx
│   │   │   ├── CreateInvoice.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── HelpCenter.jsx
│   │   │   ├── LabReports.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Patients.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Staff.jsx
│   │   ├── services/               # API and Socket services
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── store/                  # Zustand state management
│   │   │   ├── authStore.js
│   │   │   └── facilityStore.js
│   │   ├── utils/                  # Utility functions
│   │   │   └── facilityTypeConfig.js
│   │   ├── index.css
│   │   ├── App.jsx                 # Main router component
│   │   └── main.jsx                # Application entry point
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json                # Frontend dependencies
│   ├── postcss.config.js
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   └── vite.config.js              # Vite configuration
└── server/                          # Node.js Backend Application
    ├── config/
    │   └── db.js                    # Database connection
    ├── controllers/                # Route controllers
    │   ├── analytics.controller.js
    │   ├── auth.controller.js
    │   ├── facility.controller.js
    │   ├── patient.controller.js
    │   └── queue.controller.js
    ├── middleware/                 # Express middleware
    │   ├── auth.middleware.js
    │   └── error.middleware.js
    ├── models/                     # Mongoose data models
    │   ├── Facility.js
    │   ├── Patient.js
    │   ├── Queue.js
    │   └── User.js
    ├── routes/                     # Express routes
    │   ├── analytics.routes.js
    │   ├── auth.routes.js
    │   ├── facility.routes.js
    │   ├── patient.routes.js
    │   ├── queue.routes.js
    │   └── user.routes.js
    ├── sockets/                    # Socket.io handlers
    │   ├── index.js
    │   └── queue.socket.js
    ├── utils/                      # Utility functions
    │   ├── facilityTypeConfig.js
    │   ├── logger.js
    │   └── waitTimeCalculator.js
    ├── .env                        # Environment variables
    ├── .gitignore
    ├── package.json                # Backend dependencies
    └── server.js                   # Main server entry point
```

## Architecture and Design Patterns

### Frontend Architecture

#### State Management (Zustand)
The application uses Zustand for global state management with two main stores:

1. **authStore.js**: Manages authentication state
   - User object and JWT token
   - Login/logout actions
   - Token-based header generation
   - Persisted to localStorage

2. **facilityStore.js**: Manages facility context
   - Current facility ID, name, and type
   - Global facility switching
   - Persisted to localStorage

#### Routing Pattern
React Router 6 with nested routes and protected routes:
```
- Public routes: /login, /register
- Protected routes (require auth): /dashboard, /patients, /analytics, etc.
- ProtectedRoute component wraps authenticated routes
```

#### Component Structure
- **Layout.jsx**: Master layout with sidebar, top navigation, and responsive design
- **ProtectedRoute.jsx**: Route protection wrapper
- **AddPatientForm.jsx**: Dynamic form with facility-specific fields
- **QueueList.jsx**: Real-time queue display with status indicators
- **FacilitySelector.jsx**: Horizontal pill-based facility switcher
- **Page Components**: Dashboard, Analytics, Settings, etc.

### Backend Architecture

#### MVC Pattern with Service Layer
```
Routes → Controllers → Models
                    ↓
              Services (socket)
                    ↓
              Utils (validation, calculation)
```

#### Middleware Stack
1. **CORS**: Cross-origin resource sharing
2. **body-parser**: Request body parsing
3. **auth.middleware**: JWT verification
4. **error.middleware**: Centralized error handling

#### Real-time Communication
Socket.io rooms based on `facilityId_facilityType`:
```
Client joins room → Queue operations → Emit event → Room receives update
```

## Database Models and Schemas

### 1. User Model (`models/User.js`)
```javascript
{
  facilityId: ObjectId (ref: Facility)  // Required, indexed
  facilityType: String (enum)            // Required, indexed  
    // Values: "clinic", "hospital", "pathlab", "dental", "physio", "other"
  name: String                           // Required, trimmed
  email: String                          // Required, unique, lowercase, indexed
  password: String                       // Required, hashed, hidden by default
  role: String (enum)                    // Default: "receptionist"
  isActive: Boolean                      // Default: true
}
```
**Indexes**:
- `{ facilityId: 1, facilityType: 1, role: 1 }`
- `email` (unique)

### 2. Facility Model (`models/Facility.js`)
```javascript
{
  name: String                           // Required, indexed
  facilityType: String (enum)            // Required, indexed
    // Values: "clinic", "hospital", "pathlab", "dental", "physio", "other"
  address: String
  contact: String
  customFields: Map                      // Dynamic key-value pairs
  subscriptionPlan: String (enum)        // Default: "free"
  subscriptionStatus: String (enum)      // Default: "active"
  subscriptionEnd: Date
  isActive: Boolean                      // Default: true
}
```
**Indexes**:
- `{ facilityType: 1, name: 1 }`
- `{ facilityType: 1, subscriptionPlan: 1 }`

### 3. Queue Model (`models/Queue.js`)
```javascript
{
  facilityId: ObjectId (ref: Facility)   // Required, indexed
  facilityType: String (enum)            // Required, indexed
  patientName: String                    // Required
  phone: String                          // Optional
  tokenNumber: Number                    // Required, indexed
  customData: Map                        // Dynamic fields per facility type
  status: String (enum)                  // Default: "waiting"
    // Values: "waiting", "in-progress", "completed", "no-show", "cancelled"
  calledAt: Date                         // When patient called from queue
  completedAt: Date                      // When consultation completed
  actualDuration: Number                 // In minutes (calculated after completion)
  estimatedWaitTime: Number              // Default: 0 (predictive, in minutes)
}
```
**Compound Indexes**:
- `{ facilityId: 1, facilityType: 1, tokenNumber: 1 }`
- `{ facilityId: 1, facilityType: 1, status: 1 }`
- `{ facilityId: 1, facilityType: 1, status: 1, completedAt: -1 }`

### 4. Patient Model (`models/Patient.js`)
```javascript
{
  facilityId: ObjectId (ref: Facility)   // Required, indexed
  name: String                           // Required, indexed
  phone: String                          // Required, indexed
  email: String                          // Optional
  gender: String (enum)                  // "Male", "Female", "Other"
  age: Number
  medicalHistory: [{                     // Embedded array
    condition: String
    diagnosedAt: Date
    notes: String
  }]
  lastVisit: Date
  status: String (enum)                  // Default: "Active"
}
```
**Compound Index**:
- `{ facilityId: 1, name: 1, phone: 1 }` (unique constraint)

## API Endpoints Documentation

### Authentication Routes (`/api/auth/*`)

#### POST `/api/auth/register`
Registers a new user and optionally creates a facility.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@clinic.com",
  "password": "password123",
  "facilityName": "City Clinic",
  "facilityType": "clinic",
  "role": "admin"
}
```

**Response (201)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "...",
    "name": "John Doe",
    "email": "john@clinic.com",
    "facilityId": "...",
    "facilityType": "clinic",
    "role": "admin"
  }
}
```

#### POST `/api/auth/login`
Authenticates user and returns JWT token.

**Request Body**:
```json
{
  "email": "john@clinic.com",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "facilityId": "...",
    "facilityType": "clinic"
  }
}
```

### Queue Management Routes (`/api/queue/*`)
*All require authentication (JWT in Authorization header)*

#### POST `/api/queue/add`
Adds a new patient to queue with auto-generated token number.

**Request Body**:
```json
{
  "name": "Jane Smith",
  "phone": "9876543210",
  "customData": {
    "sampleId": "SAM-001",
    "testType": "Blood"
  }
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "patientName": "Jane Smith",
    "tokenNumber": 42,
    "status": "waiting",
    "createdAt": "2023-10-24T10:00:00.000Z"
  }
}
```

**Emits via Socket**: `queue_update` with action `"add"`

#### GET `/api/queue?status=waiting&limit=50`
Retrieves patients filtered by status.

**Query Parameters**:
- `status` (optional): "waiting", "in-progress", "completed"
- `limit` (optional): Number of results (default: 50)

**Response (200)**:
```json
{
  "success": true,
  "count": 15,
  "queue": [{
    "_id": "...",
    "patientName": "Jane Smith",
    "tokenNumber": 42,
    "status": "waiting",
    "estimatedWaitTime": 25
  }]
}
```

#### POST `/api/queue/next`
Marks next waiting patient as "in-progress" and emits real-time update.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "patientName": "Jane Smith",
    "tokenNumber": 42,
    "status": "in-progress",
    "calledAt": "2023-10-24T10:05:00.000Z"
  },
  "stats": {
    "avgConsultationTime": 12
  }
}
```

**Emits via Socket**: `queue_update` with action `"next"` and predicted wait times

#### PUT `/api/queue/:patientId/complete`
Marks in-progress patient as completed.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "completed",
    "completedAt": "2023-10-24T10:17:00.000Z",
    "actualDuration": 12
  },
  "stats": {
    "newAvgConsultationTime": 12
  }
}
```

**Emits via Socket**: `queue_update` with action `"completed"`

#### GET `/api/queue/stats/completed`
Gets count of patients completed today.

**Response (200)**:
```json
{
  "success": true,
  "completedToday": 23
}
```

### Facility Routes (`/api/facility/*`)
*All require authentication*

- `POST /api/facility/create` - Create new facility
- `GET /api/facility` - Get facilities for user

### Patient Directory Routes (`/api/patients/*`)
*All require authentication*

- `GET /api/patients` - List all patients
- `GET /api/patients/search?q=query` - Search patients
- `POST /api/patients/add` - Add patient to CRM

### Analytics Routes (`/api/analytics/*`)
*All require authentication*

#### GET `/api/analytics/stats`
Retrieves dashboard statistics.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "totalToday": 45,
    "completedTodayCount": 38,
    "avgWaitTime": 14,
    "efficiency": 84,
    "hourlyData": [
      {"time": "09:00-10:00", "count": 8}
    ]
  }
}
```

## Socket.io Events

### Connection Setup
```javascript
socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  transports: ['websocket', 'polling']
});
```

### Events Emitted by Client

#### `join_facility`
Joins facility-specific room after authentication.

**Payload**:
```javascript
{
  facilityId: "507f1f77bcf86cd799439011",
  facilityType: "clinic"
}
```

**Room name**: `{facilityId}_{facilityType}` (e.g., `"507f1f77bcf86cd799439011_clinic"`)

### Events Broadcast by Server

#### `queue_update`
Emitted after queue operation (add, next, completed).

**Payload for "add"**:
```javascript
{
  action: "add",
  facilityId: "...",
  facilityType: "clinic",
  patient: { ... }  // Added patient document
}
```

**Payload for "next"**:
```javascript
{
  action: "next",
  facilityId: "...",
  facilityType: "clinic",
  patient: { ... },  // Patient now in-progress
  stats: {
    avgConsultationTime: 12,      // Rolling average (minutes)
    currentRemaining: 5,          // Estimated remaining for current
    queue: [ ... ]                // All waiting with predictions
  }
}
```

**Payload for "completed"**:
```javascript
{
  action: "completed",
  facilityId: "...",
  facilityType: "clinic",
  patient: { ... },  // Completed patient
  stats: {
    newAvgConsultationTime: 12  // Updated rolling average
  }
}
```

## State Management Flow

### Patient Addition Flow
```
1. User submits AddPatientForm
2. addPatientApi(payload) → POST /api/queue/add
3. Server: Create Queue document, assign token
4. Server: Emit queue_update("add") via Socket
5. All clients in room receive update
6. Client updates Zustand queue state
7. UI re-renders with new patient
```

### Next Patient Flow
```
1. User clicks "Call Next" button
2. nextPatientApi() → POST /api/queue/next
3. Server: Find oldest waiting patient (by tokenNumber)
4. Server: Update status → "in-progress", set calledAt
5. Server: Calculate rolling average wait time
6. Server: Predict wait times for remaining queue
7. Server: Emit queue_update("next") with stats
8. All clients receive updated queue + predictions
9. UI shows patient as "In Chair"
```

### Complete Patient Flow
```
1. User clicks "Mark Complete"
2. markPatientCompletedApi(id) → PUT /api/queue/:id/complete
3. Server: Update status → "completed", set completedAt
4. Server: Calculate actualDuration
5. Server: Update Analytics collection
6. Server: Recalculate rolling average
7. Server: Emit queue_update("completed")
8. All clients remove patient from queue
```

## Facility Type Configurations

Each facility type has distinct configuration:

### Clinic
```javascript
{
  label: "Clinic",
  theme: { primary: "#2563EB", secondary: "#10B981" },
  customFields: [],
  statusFlow: ["waiting", "in-progress", "completed"],
  tokenPrefix: "TKN"
}
```

### Pathlab
```javascript
{
  label: "Pathlab",
  theme: { primary: "#7C3AED", secondary: "#F59E0B" },
  customFields: [
    { name: "sampleId", type: "string", required: true },
    { name: "testType", type: "select", options: ["Blood", "Urine", "X-Ray", "MRI"] }
  ],
  statusFlow: ["waiting", "processing", "ready"],
  tokenPrefix: "SAM"
}
```

### Dental
```javascript
{
  label: "Dental Clinic",
  theme: { primary: "#EC4899", secondary: "#F472B6" },
  customFields: [
    { name: "procedure", type: "string", required: true },
    { name: "toothNumber", type: "string" }
  ],
  statusFlow: ["waiting", "in-chair", "completed"],
  tokenPrefix: "DNT"
}
```

### Physiotherapy
```javascript
{
  label: "Physio",
  theme: { primary: "#10B981", secondary: "#059669" },
  customFields: [
    { name: "areaOfConcern", type: "select", options: ["Back", "Neck", "Knee", "Shoulder", "Other"] },
    { name: "sessionNumber", type: "string" }
  ],
  statusFlow: ["waiting", "session", "completed"],
  tokenPrefix: "PHY"
}
```

## Data Flow Explanation

### JWT Authentication Flow
```
User Login
  ↓
Server verifies credentials against DB
  ↓
Generates JWT with {id, facilityId, facilityType, role}
  ↓
Client stores token (Zustand + localStorage)
  ↓
Axios interceptor adds "Authorization: Bearer {token}"
  ↓
All API requests include token automatically
  ↓
auth.middleware verifies token, attaches req.user
  ↓
Controllers use req.user.facilityId for data isolation
```

### Data Isolation Pattern
Every database query filters by both `facilityId` AND `facilityType`:
```javascript
await Queue.find({
  facilityId: req.user.facilityId,
  facilityType: req.user.facilityType,
  status: "waiting"
})
```
This ensures users only see data for their facility and type.

### Real-time Update Flow
```
Client A: Clicks "Call Next"
  ↓
Server: Updates Queue DB (status → in-progress)
  ↓
Server: Emits "queue_update" to room
  ↓
All connected clients (A, B, C...) receive event
  ↓
Each client: Updates local Zustand store
  ↓
React: Components re-render with new state
```

## Build Configuration

### Frontend (Vite)
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})
```

**Environment Variables**:
- `VITE_SOCKET_URL`: Backend WebSocket URL (default: `http://localhost:5000`)

### Backend (Node.js)
```javascript
// package.json scripts
{
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

**Environment Variables** (`.env`):
```
MONGO_URI=mongodb://localhost:27017/queue-md
JWT_SECRET=your-secret-key
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## Known Issues and Technical Debt

### 1. Socket Reconnection Race Condition
**Issue**: When a client reconnects after disconnect, they might miss queue updates emitted during the downtime.
**Impact**: UI shows stale queue state briefly.
**Mitigation**: Client reloads queue on mount (`loadQueue()` in `useEffect`).

### 2. Token Number Gaps
**Issue**: If a patient is deleted, token numbers have gaps (e.g., 41, 42, 44).
**Impact**: Non-sequential tokens displayed to users.
**Decision**: Acceptable - tokens are not required to be sequential.

### 3. Wait Time Prediction Accuracy
**Issue**: `estimateCurrentRemaining()` uses simple heuristic (50% of avgTime) if no `calledAt` timestamp.
**Impact**: Predictions may be inaccurate during system restarts.
**Mitigation**: `calledAt` is set immediately on "next patient" operation.

### 4. No Pagination for Large Queues
**Issue**: `/api/queue` (live queue) has a `limit` parameter (default 50) but no pagination UI.
**Impact**: Large live queues (>50) would be truncated.
**Mitigation**: Default limit of 50 is reasonable for typical live facility size. **Note**: Analytics history *is* now paginated.

### 5. Missing Input Sanitization
**Issue**: User inputs (patient names, phone numbers) are not sanitized for XSS.
**Impact**: Potential XSS if malicious input is rendered.
**Mitigation**: React escapes content by default; phone numbers use text input type.

### 6. No Server-side Validation for Custom Fields
**Issue**: `customData` accepts any Map type without schema validation on backend.
**Impact**: Malformed data could be stored.
**Mitigation**: Frontend validates against `FACILITY_TYPES` configs; backend trusts authenticated users.

### 7. Analytics Rollup Performance
**Issue**: `calculateRollingAverage()` queries all completed records each time.
**Impact**: Slows down as database grows.
**Mitigation**: Uses `limit(10)` window; acceptable for small-medium datasets.

### 8. Missing Index on \`calledAt\`
**Issue**: Query for duration calculations doesn't use index on `calledAt`.
**Impact**: Full collection scan for historical analytics.
**Mitigation**: Index exists on `completedAt`; `actualDuration` is pre-calculated.

### 9. Hardcoded Facility Types in Multiple Places
**Issue**: Facility type enum repeated in models, configs, and frontend.
**Impact**: Single source of truth violation.
**Mitigation**: Centralized in `FACILITY_TYPES` objects; enums derived from keys.

### 10. No Rate Limiting on Public Endpoints
**Issue**: `/api/auth/login` and `/api/auth/register` have no rate limiting.
**Impact**: Vulnerable to brute force attacks.
**Mitigation**: Not implemented but could use `express-rate-limit`.

## Security Considerations

### Implemented
- ✅ JWT authentication with 7-day expiry
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Authorization header validation middleware
- ✅ Data isolation via `facilityId` filtering
- ✅ CORS restricted to configured origin
- ✅ HTTPS-ready (requires reverse proxy setup)
- ✅ No sensitive data in JWT (only IDs and roles)
- ✅ Password hidden by default in Mongoose (`select: false`)

### Recommended Enhancements
- 🔒 Add rate limiting (express-rate-limit)
- 🔒 Implement HTTPS with TLS certificates
- 🔒 Add CSRF protection for cookie-based auth
- 🔒 Implement refresh token rotation
- 🔒 Add input sanitization for custom fields
- 🔒 Audit log for sensitive operations
- 🔒 Encrypt PII fields at rest (patient phone/email)
- 🔒 Add MongoDB connection string encryption

## Phase 6: Intelligent Analytics & Security Hardening

The system was upgraded with advanced features focusing on scalability, data integrity, and deep insights.

### 📊 Intelligent Analytics
- **Paginated Consultation History**: New `/api/analytics/completed-today` endpoint fetches data directly from the Queue collection with 10 records per page.
- **Doctor Tracking**: Captured via a top-level `doctorName` field in the Queue schema, ensured via UI input during consultation completion.
- **Dynamic Stats**: Real-time aggregation of Efficiency (Completed/Total ratio), Average Wait Time (Wait - Entry), and Hourly traffic.
- **Latest-First Sorting**: Automated descending sort by `completedAt` (backend) and fallback to `updatedAt` (frontend) for robust history viewing.

### 🛡️ Security & Data Integrity
- **One-Token Rule**: Backend validation ensures a patient cannot hold multiple active tokens simultaneously, preventing queue bloat.

## Phase 7: Multi-Facility Analytics & Unified Data Flow

The latest updates focused on cross-department visibility and fixing long-standing data consistency issues regarding doctor attribution.

### 📈 Cross-Facility Dashboard
- **Unified Visibility**: Analytics now aggregates data across ALL facility types (Clinic, Pathlab, Dental, Physio) for the current facility ID, rather than filtering by the user's login type.
- **Dynamic Date Ranges**: Implemented a Date Range Selector supporting:
    - **Today**: Current day stats
    - **Yesterday**: Previous day comparison
    - **This Week**: Last 7 days rolling
    - **This Month**: Last 30 days rolling
    - **All Time**: Entire historical data (Start of Day filter removed)
- **Facility Badging**: Added clear visual indicators (badges) in the Analytics log to identify which facility type each consultation belongs to.

### 🩺 Enhanced Doctor Tracking
- **CRM Integration**: The `Patient` model now stores the primary doctor's name during registration.
- **Flexible Input**: Replaced static dropdowns with free-text inputs in the "Add Patient" modal for unlimited doctor entries.
- **Queue Propagation**: Fixed a critical bug where `doctorName` was lost during the "Waiting → Completed" transition. The system now preserves the name set at registration if no new name is provided during consultation.
- **Analytics Display**: Added a dedicated "Doctor" column to the Analytics table, replacing "N/A" with actual attribution data for all new records.

### 🛠 UI/UX Refinement
- **Consolidated Layout**: Wrapped Analytics in the global `Layout` component for consistent navigation and sidebar behavior.
- **Infinite Pagination**: Refined the 10-patient-per-page logic to work seamlessly across all date ranges and facility types.
- **Auto-Token Prefixing**: Standardized token prefixes across the system (TKN, SAM, DNT, PHY) for easier identification in logs.
- **Auto-CRM Sync**: Queue entry now triggers an automated update/creation of the Patient model, syncing Age, Gender, and Email demographics seamlessly.
- **Defensive UI Rendering**: Standardized use of optional chaining and default placeholders in `Analytics.jsx` to handle transient loading states.

### 🏗️ Architectural Improvements
- **Optimized Indexing**: New compound index on `{ facilityId, facilityType, status, completedAt }` specifically for the Analytics module.
- **Model Hardening**: Added `doctorName` and `completedAt` as first-class fields in the Queue schema.

## Phase 7: Algorithmic Wait Time Engine & Premium UI (Current Version)

The system has been significantly upgraded to support advanced predictive queuing and a premium "Glassmorphism" interface.

### 🧠 Algorithmic Wait Time Engine
- **Exponential Moving Average (EMA)**: Migrated from a volatile rolling average to an EMA (α=0.3) for wait time prediction.
- **Safety Clamping**: Predictions are clamped between 30% and 180% of the facility-specific base consultation time.
- **Resilient Calculation**: Handled edge cases like `NaN` calculations in legacy records using robust fallback timestamps (`Date.now()`).
- **On-Demand Non-Blocking Sync**: Predictions are calculated on-the-fly during `queue_update` broadcasts, eliminating heavy database writes for `estimatedWaitTime`.

### 🎨 Premium Frontend Overhaul
- **Custom Time Picker Popover**: Replaced the native `input[type="time"]` with a sleek, 3-column scrollable Glassmorphism popover for Hours, Minutes, and AM/PM.
- **Adaptive Layout Engine**: Redesigned modal structures using `flex-col max-h-[90vh]` to prevent overflow clipping when rendering dynamic fields.
- **Dynamic Facility Fields**: Real-time rendering of configuration-driven fields via `facilityTypeConfig.js` (e.g., Sample ID for Pathlab, Procedure for Dental).
- **Hybrid Input Forms**: Integrated dual-input fields featuring auto-masking (DD-MM-YYYY) and native picker fallbacks.

## Deployment Guide

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- npm or yarn

### Environment Setup
1. Clone repository
2. Create `.env` in `server/` directory:
```bash
MONGO_URI=mongodb://localhost:27017/queue-md
JWT_SECRET=generate-strong-random-string
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=production
```

3. Install dependencies:
```bash
# Backend
cd server && npm install

# Frontend  
cd client && npm install
```

### Development
```bash
# Terminal 1: Backend (with nodemon)
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

### Production Build
```bash
# Build frontend
cd client && npm run build

# Serve backend
cd server && npm start
```

### Production Deployment (Recommended)
1. Use PM2 or Docker for process management
2. Configure reverse proxy (Nginx) for:
   - SSL termination
   - Static file serving (frontend build)
   - Load balancing (if scaling)
3. Set `NODE_ENV=production`
4. Use MongoDB Atlas or managed database
5. Configure automated backups
6. Set up monitoring (Winston logs, error tracking)

## Testing Recommendations

### Unit Tests
- Auth controller (login/register validation)
- Queue controller (add/next/complete logic)
- Wait time calculator (rolling average, predictions)

### Integration Tests
- E2E flow: Login → Add Patient → Call Next → Complete
- Socket.io real-time updates
- JWT middleware protection

### Load Tests
- Concurrent socket connections (>100)
- Queue operations under load (>1000 patients)
- Analytics query performance

## Performance Metrics

### Benchmarks (Expected)
- API response time: <100ms (p95)
- Socket event latency: <50ms (local)
- Queue query (50 records): <50ms
- Auth token verification: <10ms

### Optimization Tips
1. Add compound indexes for common queries
2. Use Redis for session/cache (if scaling)
3. Implement pagination for large result sets
4. Use MongoDB projections to limit returned fields
5. Compress WebSocket messages with `perMessageDeflate`

## Maintenance Notes

### Backup Strategy
- MongoDB: Daily snapshots + oplog
- File uploads: Separate backup (if added)
- Logs: Rotate weekly

### Monitoring
- Track: Failed logins, queue length, avg wait time
- Alerts: High error rate, slow queries, socket disconnects
- Dashboard: Grafana/Prometheus for metrics

### Scaling Considerations
- Horizontal: Add Node.js instances behind load balancer
- Database: MongoDB sharding by `facilityId`
- Socket.io: Use Redis adapter for multi-instance setup

## License
MIT

## Support
For issues or questions, contact the development team.

---
*Documentation generated from source code analysis. Last updated: 2026-04-27 (Phase 7 Final)*
