---
name: queuemd-universal-saas
description: >
  Full implementation guide for QueueMD — a Universal Healthcare Queue Management SaaS
  built with MERN stack. Latest: Version 3.4 (Intelligent Analytics, Unified CRM, & Premium Hybrid UI)
  featuring predictive wait times, unified patient records, and multi-tenant isolation.
---

# QueueMD — Universal Healthcare Queue SaaS

## 🎯 Core Philosophy
- **Version**: 3.4 (Intelligent Analytics, Unified CRM, & Premium Hybrid UI)
- **Tagline**: "Build Once, Scale Everywhere — Support Included, Global Ready"
- **Strategy**: Universal Codebase + Phased Feature Rollout + Onboarding Optimization
- **Architecture**: Config-driven, multi-tenant, facility-type isolated
- **Stack**: React + Vite + Tailwind + Zustand (FE) | Node + Express + MongoDB + Socket.io (BE)
- **MCA Timeline**: 6 weeks → Working demo + scalability proof

---

## 📦 Supported Facility Types
```
["clinic", "hospital", "pathlab", "dental", "physio", "other"]
```
Default: `"clinic"` — always the Phase 1 starting point.

---

## 🗂 Phase Overview

| Phase | Scope | Status |
|-------|-------|----------|
| 1A | Universal Foundation (Models + Config + Indexes) | ✅ Done |
| 1B | Clinic MVP (CRUD + Basic React UI) | ✅ Done |
| 2 | Real-Time + Auth (Socket.io + JWT + RBAC) | ✅ Done |
| 2.5 | **Premium UX & Global Support** (Help Center + Localization) | ✅ Done |
| 3 | Scalability Proof — Add Pathlab via config only | ✅ Done |
| 3.2 | **Intelligent Wait Time** (Rolling average analytics) | ✅ Done |
| 3.3 | **Unified Patient Directory** (CRM-style management) | ✅ Done |
| 3.4 | **UI Polish & Premium Interactions** (Glassmorphism + Polished Selects + Custom Popovers) | ✅ Done |
| 4 | Redis + BullMQ Notifications | ✅ Done |
| 5 | Razorpay Payment + Subscription | 🛠 In Progress |
| 6 | Deploy (Vercel + Render + Atlas) + MCA Defense | 🚀 Planned |

---

## 🗄 Database Models

### Facility.js
```javascript
const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  facilityType: {
    type: String,
    enum: ["clinic", "hospital", "pathlab", "dental", "physio", "other"],
    required: true, index: true, default: "clinic"
  },
  address: String,
  contact: String,
  customFields: { type: Map, of: Mixed },
  subscriptionPlan: { type: String, enum: ["free", "pro"], default: "free" },
  subscriptionStatus: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  subscriptionEnd: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

facilitySchema.index({ facilityType: 1, name: 1 });
facilitySchema.index({ facilityType: 1, subscriptionPlan: 1 });
```

### Queue.js (Universal + Clinic-First)
```javascript
const queueSchema = new mongoose.Schema({
  facilityId: { type: ObjectId, ref: "Facility", required: true, index: true },
  facilityType: { type: String, enum: [...], required: true, index: true },
  patientName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  tokenNumber: { type: Number, required: true, index: true },
  customData: { type: Map, of: Mixed }, // Dynamic per facility type
  status: {
    type: String,
    enum: ["waiting", "in-progress", "completed", "no-show", "cancelled"],
    default: "waiting", index: true
  }
}, { timestamps: true });

// 🔥 COMPOUND INDEXES — Critical for <200ms queries
queueSchema.index({ facilityId: 1, facilityType: 1, tokenNumber: 1 });
queueSchema.index({ facilityId: 1, facilityType: 1, status: 1 });
```

### User.js
```javascript
const userSchema = new mongoose.Schema({
  facilityId: { type: ObjectId, ref: "Facility", required: true, index: true },
  facilityType: { type: String, enum: [...], required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, select: false }, // Hidden by default
  role: {
    type: String,
    enum: ["admin", "receptionist", "doctor", "lab_tech", "patient"],
    default: "receptionist"
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.index({ facilityId: 1, facilityType: 1, role: 1 });
```

---

## ⚙️ facilityTypeConfig.js — The Secret Sauce

Central source of truth (sync between backend `utils/` and frontend `src/utils/`):

```javascript
export const FACILITY_TYPES = {
  clinic: {
    label: "Clinic", icon: "🏥",
    theme: { primary: "#2563EB", secondary: "#10B981" },
    customFields: [],
    notificationTemplate: "Token #{token} abhi call hoga",
    statusFlow: ["waiting", "in-progress", "completed"],
    roles: ["admin", "receptionist", "doctor", "patient"],
    tokenPrefix: "TKN"
  },
  pathlab: {
    label: "Pathlab", icon: "🔬",
    theme: { primary: "#7C3AED", secondary: "#F59E0B" },
    customFields: [
      { name: "sampleId", type: "string", required: true, label: "Sample ID" },
      { name: "testType", type: "select", options: ["Blood", "Urine", "X-Ray"], required: true, label: "Test Type" }
    ],
    notificationTemplate: "Sample #{sampleId} ready hai",
    statusFlow: ["waiting", "processing", "ready"],
    roles: ["admin", "lab_tech", "receptionist", "patient"],
    tokenPrefix: "SAM"
  },
  dental: {
    label: "Dental Clinic", icon: "🦷",
    theme: { primary: "#EC4899", secondary: "#F472B6" },
    customFields: [
      { name: "procedure", type: "string", required: true, label: "Procedure" },
      { name: "toothNumber", type: "string", label: "Tooth Number" }
    ],
    notificationTemplate: "Appointment #{token} start hone wala hai",
    statusFlow: ["waiting", "in-chair", "completed"],
    roles: ["admin", "receptionist", "dentist", "patient"],
    tokenPrefix: "DNT"
  },
  physio: {
    label: "Physio", icon: "🧘",
    theme: { primary: "#10B981", secondary: "#059669" },
    customFields: [
      { name: "areaOfConcern", type: "select", options: ["Back", "Neck", "Knee", "Shoulder", "Other"], label: "Area of Concern" },
      { name: "sessionNumber", type: "string", label: "Session Number" }
    ],
    notificationTemplate: "Aapki session #{token} shuru hone wali hai",
    statusFlow: ["waiting", "session", "completed"],
    roles: ["admin", "receptionist", "therapist", "patient"],
    tokenPrefix: "PHY"
  }
};

// Helper functions (Backend uses require, Frontend uses export)
export const getFacilityConfig = (facilityType) => FACILITY_TYPES[facilityType] || FACILITY_TYPES.clinic;
export const getNextTokenPrefix = (facilityType) => FACILITY_TYPES[facilityType]?.tokenPrefix || "TKN";

/**
 * Backend-only helper for dynamic Zod validation
 */
const getValidationSchema = (type) => {
  const baseSchema = {
    patientName: z.string().min(2),
    phone: z.string().optional()
  };
  if (type === "pathlab") {
    return z.object({ ...baseSchema, customData: z.object({ sampleId: z.string().min(1), testType: z.enum(["Blood", "Urine", "X-Ray"]) })});
  }
  if (type === "dental") {
    return z.object({ ...baseSchema, customData: z.object({ procedure: z.string().min(1), toothNumber: z.string().optional() })});
  }
  return z.object({ ...baseSchema, customData: z.unknown().optional() });
};
```

> **Adding a new facility type** = add one entry to `FACILITY_TYPES`. No controller, model, or route changes needed. This is the scalability proof for MCA defense.

---

## 🛠 Key Controllers

### addPatient (Queue Controller)
```javascript
exports.addPatient = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user;
    const { patientName, phone, customData } = req.body;

    const schema = getValidationSchema(facilityType);
    const validation = schema.safeParse({ patientName, phone, customData });
    if (!validation.success) return res.status(400).json({ success: false, errors: validation.error.format() });

    const lastToken = await Queue.findOne({ facilityId, facilityType }).sort({ tokenNumber: -1 });
    const nextToken = (lastToken?.tokenNumber || 0) + 1;

    const queueEntry = await Queue.create({ facilityId, facilityType, patientName, phone, customData: customData || {}, tokenNumber: nextToken, status: "waiting" });

    // Socket emit with try-catch safety
    try {
      emitQueueUpdate(facilityId, facilityType, { action: "add", patient: queueEntry });
    } catch (socketErr) {
      logger.error(`Socket emission failed: ${socketErr.message}`);
    }

    res.status(201).json({ success: true, data: queueEntry });
  } catch (err) { next(err); }
};
```

### nextPatient
```javascript
exports.nextPatient = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user;
    const current = await Queue.findOneAndUpdate(
      { facilityId, facilityType, status: "waiting" },
      { status: "in-progress" },
      { new: true, runValidators: true }
    ).sort({ tokenNumber: 1 });

    if (!current) return res.status(404).json({ success: false, message: "No waiting patients" });

    // Socket emit with try-catch safety
    try {
      emitQueueUpdate(facilityId, facilityType, { action: "next", patient: current });
    } catch (socketErr) {
      logger.error(`Socket emission failed: ${socketErr.message}`);
    }

    res.json({ success: true, data: current });
  } catch (err) { next(err); }
};
```

---

## 🔐 Auth & JWT

### Auth Controller (Flexible: Auto-create Facility OR use Existing)
```javascript
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, facilityName, facilityId, facilityType = "clinic", role = "admin" } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "User already exists" });

    let facility;
    if (facilityId) {
      facility = await Facility.findById(facilityId);
    } else if (facilityName) {
      facility = await Facility.findOne({ name: facilityName, facilityType }) || await Facility.create({ name: facilityName, facilityType });
    }
    
    if (!facility) return res.status(400).json({ success: false, message: "Facility info missing" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword, facilityId: facility._id, facilityType: facility.facilityType, role });

    const token = jwt.sign({ id: user._id, facilityId: facility._id, facilityType: facility.facilityType, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ success: true, token, data: user });
  } catch (err) { next(err); }
};
```

JWT payload must include `facilityType` for isolation:
```javascript
const token = jwt.sign(
  { id: user._id, facilityId: user.facilityId, facilityType: user.facilityType, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE || "7d" }
);
```

### RBAC Middleware
```javascript
exports.authorize = (...roles) => (req, res, next) => {
  const allowedFacilityTypes = roles[0]?.allowedFacilityTypes;
  if (allowedFacilityTypes && !allowedFacilityTypes.includes(req.user.facilityType)) {
    return res.status(403).json({ message: `Role not authorized for facility-type: ${req.user.facilityType}` });
  }
  const roleList = roles.map(r => r.role || r);
  if (!roleList.includes(req.user.role)) return res.status(403).json({ message: `Role ${req.user.role} not authorized` });
  next();
};

// Usage examples:
// router.post("/next", auth, authorize("admin"), nextPatient);
// router.get("/reports", auth, authorize({ role: "doctor", allowedFacilityTypes: ["clinic", "hospital"] }), getReports);
```

---

## 📡 Socket.io — Room Pattern

Room naming: **`${facilityId}_${facilityType}`** — ensures complete cross-type isolation.

```javascript
// Backend emit support flexible signature: (id, type, data, action)
// const { action, patient } = action || data;
const emitQueueUpdate = (facilityId, facilityType, data, action) => {
  const room = `${facilityId}_${facilityType}`;
  const finalAction = action || data.action;
  const finalPatient = data.patient || data;
  
  io.to(room).emit("queue_update", { 
    action: finalAction, 
    patient: finalPatient, 
    facilityType, 
    facilityId 
  });
};

// Frontend join
socket.emit("join_facility", { facilityId, facilityType });

// Frontend listener (with type guard)
socket.on("queue_update", (data) => {
  if (data.facilityType !== facilityType) return; // extra safety
  if (data.action === "add") setQueue(prev => [...prev, data.patient]);
  if (data.action === "next") setQueue(prev => prev.filter(p => p._id !== data.patient._id));
});
```

**Redis Adapter** (enable for production scaling via ENV flag):
```javascript
if (process.env.NODE_ENV === "production") {
  // Redis adapter code — already scaffolded in sockets/index.js
  // Enable with: REDIS_URL=redis://... in .env
}
```

---

## 🎨 Frontend Key Components

### Zustand Store (facilityStore.js)
```javascript
export const useFacilityStore = create(
  persist(
    (set) => ({
      facilityId: null,
      facilityType: "clinic",
      facilityName: null,
      setFacility: (id, name, type) => set({ facilityId: id, facilityName: name, facilityType: type }),
      clearFacility: () => set({ facilityId: null, facilityName: null, facilityType: "clinic" }),
      setFacilityType: (type) => set({ facilityType: type })
    }),
    { name: "facility-storage" }
  )
);
```

### Dynamic AddPatientForm (config-driven)
- Renders universal fields (patientName, phone) always
- Renders `config.customFields` dynamically based on `facilityType`
- Submit button label changes: `"Add Patient"` for clinic, `"Add Entry"` for others
- Button color = `config.theme.primary` from `facilityTypeConfig.js`

---

## 💎 Premium UX & Expanded Ecosystem (Version 3.2)

### 1. Advanced Auth UI (Overhaul)
- **Design**: Redesigned `Login.jsx` and `Register.jsx` with a "Senior Developer" aesthetic.
- **Features**: Animated background blobs, deep glassmorphism (v2), and tactile input icons.
- **Security**: Integrated password visibility toggles and "Remember Me" logic into the UI.

### 2. Expanded Facility Types (Physiotherapy)
- **Configuration**: Added `physiotherapy` to `FACILITY_TYPES`.
- **Domain Logic**: Specific `PHY` token prefix, session-based status flow, and custom fields for physical health tracking.

### 3. Professional Roles (Nurse Support)
- **Implementation**: Added `Nurse` role across all facility types (Clinic, Dental, Physio, Lab).
- **Presentation**: All role and facility labels now use proper capitalization in dropdowns.

### 4. UI Polish (Select Optimization)
- **Fix**: Resolved "double arrow" issue in custom selects using `keyboard_arrow_down` and global CSS resets.

---

## 📱 Phase 4 — Notifications (BullMQ + Redis)

```javascript
// After nextPatient call, queue notifications for next 2 waiting patients:
const config = FACILITY_TYPES[facilityType];
const upcoming = await Queue.find({ facilityId, facilityType, status: "waiting" }).sort({ tokenNumber: 1 }).limit(2);

for (let patient of upcoming) {
  await notificationQueue.add("notify", {
    phone: patient.phone,
    message: config.notificationTemplate
      .replace("#{token}", patient.tokenNumber)
      .replace("#{sampleId}", patient.customData?.sampleId || "")
  });
}
```

Worker runs concurrency: 5 — logs `[FACILITYTYPE] message | Phone: xxx`

---

## 💳 Phase 5 — Razorpay Subscription

Flow:
1. `POST /api/payment/create-order` → Razorpay order created, saved with `facilityId + facilityType`
2. Frontend Razorpay modal → payment
3. `POST /api/payment/verify` → `crypto.createHmac` signature check → `Facility.subscriptionPlan = "pro"`
4. Webhook: `/api/payment/webhook` → auto-renew (signature verified)

**Subscription gate middleware:**
```javascript
exports.requirePro = async (req, res, next) => {
  const facility = await Facility.findById(req.user.facilityId).select("subscriptionPlan");
  if (facility.subscriptionPlan !== "pro") {
    return res.status(403).json({ message: "Pro subscription required", upgradeUrl: "/upgrade" });
  }
  next();
};
```

---

## 🚀 Deployment Checklist

```bash
# Vercel (Frontend)
- Build command: npm run build
- Add all env vars in Vercel dashboard

# Render (Backend)
- render.yaml with build/start commands
- Health check: GET /api/health → { status: "ok" }

# MongoDB Atlas
- Free M0 tier (512MB — sufficient for demo)
- Indexes created on deploy
- Network: restrict IPs in production

# .env required keys:
PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRE, BCRYPT_SALT_ROUNDS,
REDIS_URL, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
RAZORPAY_WEBHOOK_SECRET, CLIENT_URL, NODE_ENV,
SUPPORTED_FACILITY_TYPES, DEFAULT_FACILITY_TYPE

# Running Locally:
CRITICAL: The project is wrapped inside a main folder. You must `cd` into the correct subfolder.
- Format: `cd queue-md-universal/server`
- Then run: `npm start` (or `node server.js`)
```

---

## 🔧 15 Production Fixes (Quick Reference)

| # | ❌ Wrong | ✅ Fixed |
|---|---------|---------|
| 1 | Global token counter | DB fetch last token per `facilityId+facilityType` |
| 2 | Random queue order | `.sort({tokenNumber:1})` in all queries |
| 3 | No indexes | Compound indexes `{facilityId,facilityType,tokenNumber}` |
| 4 | No error handling | Global error middleware + try-catch everywhere |
| 5 | No validation | Zod schemas, dynamic by `facilityType` |
| 6 | No RBAC | `authorize()` middleware + facilityType check |
| 7 | Hardcoded secrets | All from `process.env.*` |
| 8 | Socket not scalable | Redis adapter scaffolded, enable via ENV |
| 9 | Webhook unverified | `crypto.createHmac` signature check |
| 10 | `console.log` in prod | Winston logger + `facilityId` tagging |
| 11 | No deploy plan | Vercel + Render + Atlas + `render.yaml` |
| 12 | No rate limiting | `express-rate-limit` on auth + API routes |
| 13 | Weak facility isolation | `facilityId`/`facilityType` only from JWT |
| 14 | Token counter collision | Per `facilityId+facilityType` compound query |
| 15 | Config scattered | `facilityTypeConfig.js` = single source of truth |
| 16 | Generic Phone Formats | Indian Localization (+91) applied globally |
| 17 | Cluttered Dashboard | Analytics compaction for better data density |
| 18 | Support missing | Integrated Global Help Center FAB |

---

## 🧪 Testing Checklist (Phase-Wise)

**Phase 1B:**
- `POST /api/queue/add` → 201 + token generated ✅
- `GET /api/queue?status=waiting` → sorted, <200ms ✅
- Isolation: Clinic A ≠ Clinic B data ✅

**Phase 2:**
- 2 browsers, same clinic: "Next" in one → other updates instantly ✅
- Invalid JWT → 401; Expired → 401 ✅
- Receptionist → admin API → 403 ✅

**Phase 3:**
- Add pathlab to config → restart → pathlab option appears ✅
- Clinic queue ≠ Pathlab queue (same facilityId) ✅
- Clinic "Next" → Pathlab UI unchanged (room isolation) ✅

**Security Tests:**
- Lab Tech role accessing Dental API → 403 ✅
- `{customData: {maliciousField: "x"}}` for clinic → Zod rejects ✅
- 5 login attempts/min → 429 ✅
- Webhook fake signature → 400 ✅

---

## 🎤 MCA Defense Talking Points

```
💡 "Universal architecture isliye — real-world SaaS scalable hona chahiye.
    Clinic se start kiya kyunki 6-week MCA timeline hai."

💡 "facilityTypeConfig.js humara secret sauce hai — naya type = sirf
    config update, code rewrite nahi."

💡 "Compound indexes {facilityId, facilityType, tokenNumber} ki wajah se
    query <200ms — chahe 100 clinics ho ya 1000."

💡 "facilityId/facilityType JWT token se aata hai, user input se nahi —
    Facility A ka user Facility B ka data access nahi kar sakta."

💡 "Future scope: WhatsApp API, AI wait-time prediction, React Native app —
    sab config-driven architecture pe easily add ho sakte hain."
```

### 5-Minute Live Demo Script
1. **(0:00–1:00)** Login as Clinic Admin → Add "Rahul" → Token #1 → "Next" → real-time update
2. **(1:00–2:30)** Open `facilityTypeConfig.js` → show clinic + pathlab + dental → Postman: `facilityType:"dental"` → Works ✅
3. **(2:30–4:00)** Browser 1: Clinic "Rahul" T#1 | Browser 2: Pathlab "Priya" SAM001 T#1 → queues isolated → Clinic "Next" → Pathlab unchanged ✅
4. **(4:00–5:00)** Invalid JWT → 401 | Receptionist → admin route → 403 → "6 types ready, aaj Clinic+Pathlab, kal Dental+Physio bina code change ke!"

---

## 📁 Full Project Folder Structure

```
queue-md-universal/
├── client/src/
│   ├── components/      AddPatientForm.jsx, QueueList.jsx, FacilitySelector.jsx, PaymentModal.jsx, Layout.jsx
│   ├── pages/           Login.jsx, Dashboard.jsx, Analytics.jsx, HelpCenter.jsx, AddStaff.jsx, Billing.jsx
│   ├── store/           authStore.js, facilityStore.js (Zustand+Persist)
│   ├── services/        api.js, socket.js
│   └── utils/           facilityTypeConfig.js (synced with backend)
├── server/
│   ├── config/          db.js, redis.js
│   ├── models/          Facility.js, Queue.js, User.js, Payment.js
│   ├── controllers/     facility, queue, auth, payment
│   ├── routes/          facility, queue, auth, payment
│   ├── middleware/       auth, role (RBAC), error, rateLimiter
│   ├── utils/           facilityTypeConfig.js ⭐, logger.js, validation.js
│   ├── sockets/         index.js (Redis adapter ready), queue.socket.js
│   └── jobs/            notification.queue.js, notification.worker.js
├── tests/               isolation.test.js, security.test.js, performance.test.js
├── docs/                ARCHITECTURE.md, HOW-TO-EXTEND.md, MCA-REPORT.md
├── .env                 (NEVER commit — all secrets here)
├── vercel.json
└── render.yaml
```

---

### 5. Intelligent Wait Time Prediction
Algorithm: Rolling average of (`calledAt` - `createdAt`) for the last 10 completed patients.
- **Trigger**: Calculated on `nextPatient` call.
- **Persistence**: Saved in `Analytics` model or calculated on-the-fly via aggregation.
- **Frontend**: Displayed as a "Avg Wait Time" card with trend analysis.

### 6. Unified Patient Directory (CRM)
Distinction between **Queue** and **Directory**:
- **Queue**: Temporary entry for a specific visit (Tokenized).
- **Directory**: Permanent record (PID, History, Total Visits).
- **Automation**: Adding a patient to the Queue automatically upserts them in the Directory using `phone` as the unique key.

---

## 🛑 Troubleshooting & Environment Setup (Pro-Tips)

**1. Port 5000 Already in Use (EADDRINUSE)**
- **Cause**: Zombie process of a previous server run.
- **Fix (PowerShell)**: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force`

**2. Name Required Validation Error**
- **Symptom**: `Path name is required` even when name is provided.
- **Fix**: Use aliasing in controllers: `const finalName = name || patientName`. This ensures compatibility between different form versions.

**3. Premium UI Dropdown Fix**
- **Logic**: Use `appearance-none` on `<select>` and a `relative` wrapper with an absolute-positioned Material Symbol.
- **Why**: Native browser arrows look generic; custom icons ensure a "Premium SaaS" look.

**4. MongoDB DNS Parse Error**
- **Symptom:** `getaddrinfo ENOTFOUND ac-xxx.mongodb.net`
- **Fix:** Set your network adapter's DNS to Google DNS: `8.8.8.8` and `8.8.4.4`.

**4. MongoDB Atlas IP Whitelisting**
- **Fix:** Go to Atlas → Network Access → "Add IP Address" → "Allow Access From Anywhere" (0.0.0.0/0) for local development stability.

---

> **Pro Tip for MCA Student**: Phase 1–2 complete karo with local MongoDB first.
> Jab basic app kaam kare, tab Atlas + Razorpay integrate karo. Step-by-step chalo!
> Is SKILL.md ko apne project folder mein rakho — v3.2 logic ke saath ab tumhara project defense-ready hai! 💪
