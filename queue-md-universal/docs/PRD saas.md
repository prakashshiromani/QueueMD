# 📄 PRD (Product Requirements Document) - UPDATED  
## 🏥 QueueMD - Universal Healthcare Queue Management SaaS  
**Version:** 3.5 | **Date:** May 2026 | **Prepared For:** MCA Final Year Project
**Branding:** QueueMD™ | **Tagline:** *"Predictive Analytics, Unified Healthcare"*

---

## 1️⃣ Project Overview (परिचय)

### 🎯 Vision  
**QueueMD** ek aisa universal SaaS platform hai jahan **hospitals, clinics, pathlabs, dental centers, physiotherapy clinics** aur anya healthcare facilities apne patient/appointment queue ko digitally manage kar sakein — real-time updates, multi-branch support, aur premium features ke saath.

### 📌 Problem Statement (Expanded)  
```
❌ Manual token system har healthcare setting mein slow aur error-prone hai  
❌ Patients ko wait time, token status, ya next number ka pata nahi chalta  
❌ Har facility type ke liye alag software = zyada cost + training overhead  
❌ Multi-branch hospitals ke liye centralised queue management missing hai  
❌ Pathlabs/Dental clinics ke liye custom workflow (sample collection, procedure slots) support nahi karta  
❌ Real-time sync ki kami se staff aur patients ke beech confusion hota hai  
```

### ✅ QueueMD Solution  
```
🌐 Cloud-based Multi-Tenant + Multi-Facility Queue Management System:

✅ Universal Token System → Auto-generate (facility-type + branch-wise)  
✅ Real-time Updates → Socket.io se live sync across all devices  
✅ Smart Notifications → SMS/WhatsApp via Redis + BullMQ  
✅ Role-Based Access → JWT + RBAC (Admin, Doctor, Receptionist, Lab Tech)  
✅ Facility-Type Customization → Clinic vs Hospital vs Pathlab workflows  
✅ Monetization → Razorpay Subscription (Free/Pro/Enterprise)
✅ Multi-Branch Support → Ek hospital ke multiple departments/branches manage karo
✅ **Intelligent Wait Time** → Rolling average prediction for patient wait times
✅ **Unified Patient Records** → CRM-style directory across all visits
✅ **UI Polish** → Glassmorphism, custom dropdowns, and premium interactions
✅ **Premium Hybrid Inputs** → Native picker fallback + adaptive flex layouts
```

---

## 2️⃣ Objectives & Goals (लक्ष्य)

| Type | Objective | Success Metric |  
|------|-----------|---------------|  
| 🎯 Functional | Universal queue management (Add/View/Next/Complete) | 95% API success rate across all facility types |  
| 🎯 Real-Time | Socket.io se live sync (<500ms) | All connected devices update instantly |  
| 🎯 Multi-Facility | Facility-type + branch-wise data isolation | Zero data leak between facilities/branches |  
| 🎯 Security | JWT + RBAC + Zod Validation | Zero auth bypass in penetration testing |  
| 🎯 Customization | Facility-type specific workflows | 4+ facility types supported with custom fields |  
| 🎯 Monetization | Razorpay subscription + Enterprise plans | Test payment + upgrade flow successful |  
| 🎯 Performance | Indexed queries + Redis caching | <200ms query response even with 10K+ records |

---

## 3️⃣ User Personas (यूजर प्रोफाइल) - EXPANDED

### 👨‍⚕️ Persona 1: Hospital Admin (Dr. Verma)  
```
- Role: Multi-Branch Hospital Owner  
- Goals: OPD queue, IPD admissions, lab reports, billing integrate karna  
- Pain Points: Department-wise coordination, staff access control, analytics  
- Facility Types: Hospital (OPD/IPD), Multi-specialty  
- Tech Comfort: Medium (Desktop + Mobile Dashboard)  
```

### 👩‍🔬 Persona 2: Pathlab Manager (Neha)  
```
- Role: Diagnostic Center Head  
- Goals: Sample collection queue, report status, home collection slots  
- Pain Points: Token mismanagement, report delivery tracking, patient follow-up  
- Facility Types: Pathlab, Diagnostic Center, Blood Bank  
- Tech Comfort: High (Daily digital user)  
- Custom Needs: Sample ID tracking, Report status (Pending/Ready/Delivered)  
```

### 🦷 Persona 3: Dental Clinic Owner (Dr. Patel)  
```
- Role: Single/Multi-Chair Dental Clinic  
- Goals: Procedure-wise slots (Cleaning, RCT, Extraction), chair allocation  
- Pain Points: Overbooking, procedure time estimation, patient reminders  
- Facility Types: Dental Clinic, Orthodontic Center  
- Tech Comfort: Medium (Tablet + Desktop)  
- Custom Needs: Chair-wise queue, procedure duration tracking  
```

### 🧘 Persona 4: Physiotherapy Center (Raj Sir)  
```
- Role: Therapy Center Owner  
- Goals: Session-wise appointments, therapist allocation, progress tracking  
- Pain Points: No-show management, session duration variance, package tracking  
- Facility Types: Physiotherapy, Rehabilitation Center, Yoga Clinic  
- Tech Comfort: Low-Medium (Mobile-first)  
- Custom Needs: Therapist-wise queue, session package management  
```

### 👩‍💼 Persona 5: Receptionist (Priya) - Universal  
```
- Role: Front Desk Staff (Any Facility)  
- Goals: Patient check-in, token generate, basic info update  
- Pain Points: Slow UI, confusing workflow, multiple system switching  
- Tech Comfort: High (Daily user)  
- QueueMD Benefit: Single interface for all facility types  
```

### 🧑‍🦱 Persona 6: Patient (Rahul) - End User  
```
- Role: Waiting Patient / Home Collection User  
- Goals: Apna token/status jaanna, wait time estimate, SMS alert  
- Pain Points: Lambi line, koi update nahi, baar-baar puchna padta hai  
- Tech Comfort: Low-Medium (WhatsApp/SMS preferred)  
- QueueMD Benefit: Unified patient experience across all healthcare types  
```

### 👨‍💻 Persona 7: QueueMD Super Admin (You) - SaaS Owner  
```
- Role: Platform Owner / MCA Student  
- Goals: Multiple facilities onboard, subscription manage, analytics provide  
- Pain Points: Scalability, security, facility-type customization, billing  
- Tech Comfort: High (Full-stack Developer)  
- QueueMD Benefit: Single codebase, multi-tenant architecture  
```

---

## 4️⃣ Features Breakdown (Phase-wise) 🚀 - UPDATED FOR QUEUEMD

### 📦 PHASE 1: Basic MVP (Week 1) - Universal Foundation  
```
✅ Core Features:  
- [ ] Patient/Add Appointment API → Token generate (facilityId + facilityType + auto-increment)  
- [ ] Get Queue API → Indexed query, sorted by tokenNumber, filtered by facilityType  
- [ ] Next/Complete API → Status update + proper ordering + facility-type specific actions  
- [ ] Basic React UI → Add form + Queue list + Next button + Facility Type Selector

✅ Technical:  
- [ ] MongoDB indexes: {facilityId:1, facilityType:1, tokenNumber:1}  
- [ ] Zod validation for all inputs + facility-type specific schemas  
- [ ] Global error middleware (try-catch wrapper)  
- [ ] .env for secrets (JWT_SECRET, etc.)

✅ Facility Type Support (Phase 1 Ready):  
- clinic | hospital | pathlab | dental | physio | other

❌ Out of Scope:  
- [ ] Socket.io (Phase 2)  
- [ ] Auth system (Phase 4)  
- [ ] Multi-facility UI (Phase 3)  
- [ ] Custom workflows per facility type (Phase 3+)  
```

### 📦 PHASE 2: Real-Time Sync (Week 2) - QueueMD Live  
```
✅ Core Features:  
- [ ] Socket.io integration with room-based joining (facilityId + facilityType)  
- [ ] Auto UI update on "Next/Complete" across all connected clients (same facility)  
- [ ] Reconnection handling + error fallback + offline queue sync indicator

✅ Technical:  
- [ ] Redis Adapter ready code (production scaling ke liye)  
- [ ] Socket events: "join_facility", "queue_update", "status_change"  
- [ ] Frontend: socket.io-client + useEffect listener + facility-type aware

✅ Testing:  
- [ ] 2 browsers me same facility kholo → Real-time sync verify karo  
- [ ] Different facility types me alag-alag queues → No cross-talk ✅  
```

### 📦 PHASE 3: Multi-Facility Architecture (Week 3) - QueueMD Scale  
```
✅ Core Features:  
- [ ] Facility Model + API (Create/List/Update) with facilityType field  
- [ ] Strict facilityId + facilityType filtering in ALL queue queries  
- [ ] Frontend: Facility Selector + Type-specific UI components + Zustand Persist  
- [ ] Facility-Type Custom Fields (Dynamic Schema):  
   • Pathlab: sampleId, testType, reportStatus  
   • Dental: chairNumber, procedureType, estimatedDuration  
   • Physio: therapistId, sessionType, packageRemaining  
   • Hospital: department, doctorId, priority (Emergency/Regular)

✅ Technical:  
- [ ] Compound indexes: {facilityId:1, facilityType:1, status:1}, {facilityId:1, tokenNumber:1}  
- [ ] Socket rooms isolated by facilityId + facilityType  
- [ ] Zustand store with localStorage persist + facility-type aware state

✅ Security:  
- [ ] Facility A ka user, Facility B ka data access nahi kar sakta  
- [ ] Facility-type based RBAC (Lab Tech can't access Dental chairs)  
```

### 📦 PHASE 4: Auth & RBAC System (Week 4) - QueueMD Secure  
```
✅ Core Features:  
- [ ] User Model: email, password(hashed), role, facilityId, facilityType  
- [ ] Register/Login API with Zod validation + bcrypt + facility-type aware  
- [ ] JWT generation (from ENV) + expiry + facility context  
- [ ] Auth Middleware + RBAC Middleware + Facility-Type Middleware

✅ Roles (Universal + Facility-Specific):  
- super_admin: QueueMD platform owner (you)  
- facility_admin: Clinic/Hospital/Pathlab owner  
- doctor: Medical practitioner (hospital/dental/physio)  
- receptionist: Front desk (all types)  
- lab_tech: Pathlab specific  
- therapist: Physio specific  
- patient: End user (read-only, SMS alerts)

✅ Frontend:  
- [ ] Login Page + Facility Type Selection + ProtectedRoute wrapper  
- [ ] Axios interceptor for auto token attach + facility context  
- [ ] Zustand auth store with persist + facility-type aware

✅ Security Fixes:  
- [ ] facilityId/facilityType ab req.user se aayega (not user input)  
- [ ] Rate limiting on /login + /register endpoints  
- [ ] Facility-type based API access control  
```

### 📦 PHASE 5: Redis + Notifications (Week 5) - QueueMD Notify  
```  
✅ Core Features:  
- [x] Queue Model: phone, email, notificationPreference fields  
- [x] BullMQ setup: notification queue + background worker + facility-type templates  
- [x] On "Next/Status Change" → Add job to queue → Worker processes → SMS/WhatsApp/Email

✅ Technical:  
- [x] Redis config with ENV (REDIS_URL) + facility-type queue separation  
- [x] Worker: retry logic (3 attempts), exponential backoff, facility-type specific templates  
- [x] Winston logger (no console.log in prod) + facilityId logging

✅ Facility-Type Notification Templates:  
- [ ] Clinic: "Dr. {doctor} ready hain"
- [ ] Pathlab: "Sample {sampleId} ready hai"
- [ ] Clinic: "Aapka token #{token} abhi call hoga"  
- [ ] Pathlab: "Aapka sample #{sampleId} ready hai, report collect karein"  
- [ ] Dental: "Chair #{chair} aapke liye ready hai, procedure: {procedureType}"  
- [ ] Physio: "Aapki session #{token} shuru hone wali hai, therapist: {therapistName}"

✅ Future Ready:  
- [ ] Worker me Twilio/MSG91/WhatsApp Cloud API integrate kar sakte ho  
- [ ] Multiple workers for horizontal scaling + facility-type based routing

✅ Testing:  
- [ ] 3 terminals: Redis + Server + Worker  
- [ ] Verify: API fast response, worker logs show facility-type specific notifications  
```

### 📦 PHASE 6: Intelligent Analytics & CRM (Week 6) - QueueMD Insight ✅
```
✅ Core Features:
- [x] Predictive Wait Time: Algorithmic EMA Engine (Backend + Frontend)
- [x] Patient Directory: CRM-style permanent record management
- [x] UI Polish: Premium Glassmorphism & Custom Time Picker Popovers
```

### 📦 PHASE 7: Payment & Monetization (Week 7) - QueueMD Pro  
```  
✅ Core Features:  
- [ ] Payment Model: orderId, paymentId, signature, status, plan, facilityType  
- [ ] Facility Model: subscriptionPlan, subscriptionEnd, facilityType, branchCount  
- [ ] Razorpay: Create Order + Verify Payment + Webhook + facility-type pricing

✅ Security (Critical):  
- [ ] Webhook signature verification (crypto.createHmac)  
- [ ] All Razorpay keys in .env (never in code)  
- [ ] Idempotency: orderId unique, duplicate payment prevent

✅ Frontend:  
- [ ] PaymentModal component with Universal Plans (Free/Pro/Enterprise)  
- [ ] Facility-type specific feature highlighting  
- [ ] Subscription badge in Dashboard + facility-type aware

✅ Plans (Universal + Facility-Type Pricing):  
🆓 Free: Basic queue, 100 appointments/month, 1 facility, all types  
⭐ Pro (₹299/mo/facility): Unlimited + SMS + Basic Analytics + 3 branches  
🏢 Enterprise (₹999/mo/facility): Multi-branch + Custom Workflows + API Access + Priority Support

✅ Facility-Type Add-ons:  
- Pathlab: Report delivery tracking (+₹99/mo)  
- Dental: Chair management + procedure templates (+₹149/mo)  
- Physio: Package management + progress tracking (+₹149/mo)  
- Hospital: Department-wise queue + doctor integration (+₹299/mo)  
```

---

## 5️⃣ Technical Requirements (तकनीकी जरूरतें) - QUEUEMD EDITION

### 🖥 Tech Stack (Unchanged - MERN Perfect)  
```  
Frontend:  
- React 18 + Vite  
- Tailwind CSS (styling) + Facility-type specific themes  
- Zustand (state management + persist) + facility-type aware  
- Axios + Socket.io-client  
- React Router v6 + facility-type based routing

Backend:  
- Node.js + Express  
- MongoDB + Mongoose (with compound indexes)  
- JWT + bcryptjs (auth) + facility context  
- Zod (validation) + facility-type specific schemas  
- Socket.io + Redis (real-time) + facility rooms  
- BullMQ + ioredis (queue) + facility-type routing  
- Razorpay (payments) + facility-type pricing  
- Winston (logging) + facilityId tagging

DevOps:  
- .env for secrets (NEVER commit)  
- Vercel (frontend deploy)  
- Render/Railway (backend deploy)  
- MongoDB Atlas (database) + facility-type collections  
- Upstash (Redis free tier) + facility-type queues  
```

### 🗄 Database Schema Summary - QUEUEMD UPDATED

#### Facility Collection (NEW - Replaces Clinic)  
```javascript  
{  
  _id: ObjectId,  
  name: String (indexed),  
  facilityType: {   
    type: String,   
    enum: ["clinic", "hospital", "pathlab", "dental", "physio", "other"],  
    required: true,  
    index: true   
  },  
  address: String,  
  contact: String,  
  branches: [{   
    name: String,   
    address: String,   
    isActive: Boolean   
  }], // Multi-branch support  
  customFields: {   
    // Facility-type specific configuration  
    pathlab: { samplePrefix: String, reportDelivery: Boolean },  
    dental: { chairCount: Number, procedures: [String] },  
    physio: { therapistCount: Number, sessionTypes: [String] },  
    hospital: { departments: [String], emergencySupport: Boolean }  
  },  
  subscriptionPlan: { type: String, enum:["free","pro","enterprise"], default:"free" },  
  subscriptionStatus: { type: String, enum:["active","expired","cancelled"], default:"active" },  
  subscriptionEnd: Date,  
  isActive: Boolean,  
  createdAt, updatedAt  
}  
```

#### User Collection (Updated)  
```javascript  
{  
  _id: ObjectId,  
  facilityId: ObjectId (ref: Facility, indexed),  
  facilityType: String (indexed), // Denormalized for fast filtering  
  name: String,  
  email: String (unique, indexed),  
  password: String (hashed, select: false),  
  role: {   
    type: String,   
    enum: ["super_admin", "facility_admin", "doctor", "receptionist", "lab_tech", "therapist", "patient"],  
    default: "receptionist"  
  },  
  permissions: [String], // Facility-type specific permissions  
  createdAt, updatedAt  
}  
```

#### Queue Collection (Updated - Universal)  
```javascript  
{  
  _id: ObjectId,  
  facilityId: ObjectId (ref: Facility, indexed),  
  facilityType: String (indexed),  
  patientId: ObjectId (ref: Patient, indexed), // Link to CRM
  patientName: String,  
  phone: String,  
  tokenNumber: Number (indexed),  
  status: {   
    type: String,   
    enum: ["waiting", "in-progress", "completed", "no-show", "cancelled"],   
    default: "waiting",  
    index: true   
  },  
  calledAt: Date, // Time when called for consultation
  completedAt: Date, // Time when consultation ended
  waitTime: Number, // (calledAt - createdAt) in minutes
  actualDuration: Number, // (completedAt - calledAt) in minutes
  doctorName: String,
  consultationNotes: String,
  prescription: Mixed,
  estimatedWaitTime: Number,
  customData: { type: Map, of: Mixed }  
}  
// Compound Indexes:  
// {facilityId:1, facilityType:1, tokenNumber:1} → Fast sorted queries  
// {facilityId:1, facilityType:1, status:1} → Fast filter queries  
// {facilityType:1, status:1} → Analytics queries  
\`\`\`

\#\#\#\# Payment Collection (Updated)  
\`\`\`javascript  
{  
  \_id: ObjectId,  
  facilityId: ObjectId (indexed),  
  facilityType: String (indexed),  
  userId: ObjectId,  
  orderId: String (unique),  
  paymentId: String,  
  signature: String,  
  amount: Number,  
  currency: "INR",  
  status: { type: String, enum:\["pending","paid","failed"\], default:"pending" },  
  plan: { type: String, enum:\["free","pro","enterprise"\], default:"free" },  
  facilityTypePricing: {   
    // Facility-type specific add-ons  
    pathlabAddons: \[String\],  
    dentalAddons: \[String\],  
    physioAddons: \[String\],  
    hospitalAddons: \[String\]  
  },  
  subscriptionStart, subscriptionEnd,  
  createdAt, updatedAt  
}  
\`\`\`

\---

\#\# 6️⃣ API Specifications (Endpoint List) \- QUEUEMD

\#\#\# 🔐 Auth Routes (\`/api/auth\`)  
| Method | Endpoint | Access | Description |  
|--------|----------|--------|-------------|  
| POST | \`/register\` | Public | New user register (facilityId \+ facilityType required) |  
| POST | \`/login\` | Public \+ Rate Limit | Login → JWT token \+ facility context return |  
| GET | \`/me\` | Auth | Get current user \+ facility permissions |

\#\#\# 🏥 Facility Routes (\`/api/facility\`) \- NEW UNIVERSAL  
| Method | Endpoint | Access | Description |  
|--------|----------|--------|-------------|  
| POST | \`/create\` | Public (Phase 3\) / Auth (Phase 4\) | New facility register (any type) |  
| GET | \`/list\` | Public | All active facilities list (filter by type) |  
| GET | \`/my-facilities\` | Auth | Logged-in user's facilities |  
| PUT | \`/:id\` | Auth \+ Facility Admin | Update facility details \+ custom fields |

\#\#\# 🎫 Queue Routes (\`/api/queue\`) ⚠ Protected \+ Facility-Type Aware  
| Method | Endpoint | Access | Description |  
|--------|----------|--------|-------------|  
| POST | \`/add\` | Auth | Add patient/appointment → generate token (facility-type aware) |  
| GET | \`/\` | Auth | Get waiting queue (sorted, indexed, facility-type filtered) |  
| POST | \`/next\` | Auth \+ RBAC | Mark current in-progress \+ return next |  
| POST | \`/complete\` | Auth \+ RBAC | Mark as completed \+ trigger notification |  
| PUT | \`/:id/status\` | Auth \+ RBAC | Update status (facility-type specific transitions) |  
| GET | \`/analytics\` | Auth \+ Facility Admin | Facility-type specific analytics |

\#\#\# 💳 Payment Routes (\`/api/payment\`) \- Universal Pricing  
| Method | Endpoint | Access | Description |  
|--------|----------|--------|-------------|  
| POST | \`/create-order\` | Auth | Razorpay order create (facility-type pricing) |  
| POST | \`/verify\` | Auth | Payment signature verify \+ activate plan |  
| POST | \`/webhook\` | Public (Razorpay only) | Auto payment update (signature verified) |  
| GET | \`/subscription\` | Auth | Get current plan \+ history \+ facility-type add-ons |

\#\#\# 🔧 Health & Utility  
| Method | Endpoint | Access | Description |  
|--------|----------|--------|-------------|  
| GET | \`/api/health\` | Public | Server status \+ DB connection \+ facility-type stats |  
| GET | \`/api/facility-types\` | Public | List supported facility types \+ custom fields schema |

\---

\#\# 7️⃣ Security Requirements (सुरक्षा) \- QUEUEMD ENHANCED

\#\#\# 🔐 Must-Have Security Fixes (All 12 \+ Facility-Type)  
\`\`\`  
1️⃣ ✅ No global token → DB se last token fetch \+ sort (facility-type aware)  
2️⃣ ✅ Proper queue order → .sort({tokenNumber: 1}) everywhere \+ facility filtering  
3️⃣ ✅ Indexing → Compound indexes for fast multi-facility \+ multi-type queries  
4️⃣ ✅ Error handling → Global middleware \+ try-catch \+ facility-type error logging  
5️⃣ ✅ Input validation → Zod schemas for ALL endpoints \+ facility-type specific validation  
6️⃣ ✅ RBAC → authorize("admin") \+ facility-type role middleware  
7️⃣ ✅ ENV secrets → JWT\_SECRET, Razorpay keys in .env only \+ facility-type config  
8️⃣ ✅ Socket scaling → Redis adapter code ready \+ facility-type room isolation  
9️⃣ ✅ Webhook verification → crypto.createHmac signature check \+ facility-type payload  
🔟 ✅ Winston logging → No console.log in prod \+ facilityId \+ facilityType tagging  
1️⃣1️⃣ ✅ Deployment ready → Vercel \+ Render \+ Atlas config \+ facility-type env separation  
1️⃣2️⃣ ✅ Rate limiting → express-rate-limit on auth \+ facility-type specific limits  
\`\`\`

\#\#\# 🛡 Additional Security Measures (QueueMD Specific)  
\`\`\`  
\- Facility-type based API access control (Lab Tech can't access Dental APIs)  
\- Custom field validation per facility type (Zod dynamic schemas)  
\- Multi-branch isolation within same facility (branchId in queries)  
\- Patient data encryption for sensitive fields (phone, email, medical notes)  
\- Audit logs for all queue actions (who did what, when, which facility)  
\- GDPR/Healthcare compliance ready (data export, deletion endpoints)  
\`\`\`

\---

\#\# 8️⃣ Deployment Strategy (डिप्लॉयमेंट) \- QUEUEMD READY

\#\#\# 📦 Environment Variables (.env) \- Enhanced  
\`\`\`env  
\# Server  
PORT=5000  
NODE\_ENV=production

\# Database  
MONGO\_URI=mongodb+srv://...

\# Auth  
JWT\_SECRET=queuemd\_super\_secret\_key\_2026\!  
JWT\_EXPIRE=7d  
BCRYPT\_SALT\_ROUNDS=10

\# Redis  
REDIS\_URL=redis://127.0.0.1:6379  
\# Production: REDIS\_URL=rediss://...upstash...

\# Razorpay  
RAZORPAY\_KEY\_ID=rzp\_test\_xxx  
RAZORPAY\_KEY\_SECRET=xxx  
RAZORPAY\_WEBHOOK\_SECRET=xxx

\# Facility-Type Config  
SUPPORTED\_FACILITY\_TYPES=clinic,hospital,pathlab,dental,physio,other  
DEFAULT\_FACILITY\_TYPE=clinic

\# Notification Templates (per facility type)  
PATHLAB\_SMS\_TEMPLATE=Your sample {sampleId} is ready. Collect report from {facilityName}.  
DENTAL\_SMS\_TEMPLATE=Chair {chairNumber} ready for {procedureType}. Token \#{token}.  
PHYSIO\_SMS\_TEMPLATE=Your session with {therapistName} starts soon. Token \#{token}.  
HOSPITAL\_SMS\_TEMPLATE=Dr. {doctorName} will see you now. Dept: {department}. Token \#{token}.

\# Frontend  
VITE\_API\_URL=https://your-render-app.onrender.com  
VITE\_DEFAULT\_FACILITY\_TYPE=clinic  
\`\`\`

\#\#\# 🚀 Deployment Checklist \- QueueMD Edition  
\`\`\`  
✅ Frontend (Vercel):  
   \- vercel.json with rewrites to backend \+ facility-type based routing  
   \- Environment variables in Vercel dashboard \+ facility-type configs  
   \- Build command: npm run build \+ facility-type specific optimizations

✅ Backend (Render/Railway):  
   \- render.yaml with build/start commands \+ facility-type env separation  
   \- All env vars set in dashboard \+ facility-type validation on startup  
   \- Health check: GET /api/health \+ facility-type stats endpoint

✅ Database (MongoDB Atlas):  
   \- Free tier: 512MB (upgrade later) \+ facility-type collection separation  
   \- Network: Allow your server IP only \+ facility-type access logs  
   \- Enable automated backups \+ facility-type specific restore testing

✅ Monitoring:  
   \- Winston logs → files \+ console (dev) \+ facilityId \+ facilityType tagging  
   \- Optional: Sentry for error tracking \+ facility-type error grouping

✅ Final Security Check:  
   \- All secrets in .env (gitignore me hai na?) \+ facility-type separation  
   \- Rate limiting enabled \+ facility-type specific thresholds  
   \- Input validation on ALL endpoints \+ facility-type dynamic schemas  
   \- RBAC on sensitive routes \+ facility-type role enforcement  
   \- Webhook signatures verified \+ facility-type payload validation  
   \- HTTPS enforced \+ facility-type subdomain support (future)  
\`\`\`

\---

\#\# 9️⃣ Testing Strategy (टेस्टिंग) \- QUEUEMD COMPREHENSIVE

\#\#\# 🧪 Manual Testing Flow (Postman) \- Universal  
\`\`\`  
1️⃣ Register Facility Admin (Any Type):  
   POST /api/auth/register  
   {name, email, password, facilityId, facilityType: "pathlab"}

2️⃣ Login → Get Token \+ Facility Context:  
   POST /api/auth/login  
   → Response: {token, user, facility: {id, type, permissions}}

3️⃣ Add Patient (Facility-Type Aware):  
   POST /api/queue/add  
   Header: Authorization: Bearer \<token\>  
   Body: {  
     patientName: "Rahul",  
     phone: "9876543210",  
     facilityType: "pathlab",  
     customData: { sampleId: "SAM001", testType: "Blood Test" }  
   }

4️⃣ Get Queue (Indexed \+ Facility-Type Filtered):  
   GET /api/queue?facilityType=pathlab  
   → Fast response due to compound indexes ✅

5️⃣ Next/Complete (RBAC \+ Socket \+ Facility-Type Workflow):  
   POST /api/queue/next  
   → Returns lowest tokenNumber waiting patient  
   → Socket emit to all connected clients (same facility \+ type) ✅  
   → Trigger facility-type specific notification (Pathlab: "Sample Ready")

6️⃣ Payment Flow (Facility-Type Pricing):  
   POST /api/payment/create-order → Razorpay modal (₹299 \+ Pathlab addon ₹99)  
   POST /api/payment/verify → Signature check \+ activate plan \+ addons  
   GET /api/payment/subscription → Check plan status \+ facility-type features  
\`\`\`

\#\#\# 🔄 Real-Time Sync Test \- Multi-Facility  
\`\`\`  
1\. Browser 1: Open QueueMD → Login as Pathlab Admin → Add Sample "Rahul"  
2\. Browser 2 (Incognito): Same Pathlab → See "Rahul" auto-appear ✅  
3\. Browser 2: Click "Sample Ready" → Browser 1: Status auto-update \+ SMS trigger ✅  
4\. Browser 3: Open as Dental Clinic → Should NOT see Pathlab data ✅ (Isolation Test)  
\`\`\`

\#\#\# 🔐 Security Test Cases \- QueueMD Enhanced  
\`\`\`  
\- \[ \] Invalid JWT → 401 response \+ facility-type aware error  
\- \[ \] Expired token → 401 \+ "Token expired" \+ relogin suggestion  
\- \[ \] Lab Tech trying Dental API → 403 "Role not authorized for facility-type"  
\- \[ \] Facility A user trying facilityId=B in body → Backend ignores, uses token's facility ✅  
\- \[ \] Webhook with fake signature → 400 "Invalid signature" \+ facility-type logging  
\- \[ \] Rate limit: 5 login attempts/min → 429 "Too many requests" \+ facility-type tracking  
\- \[ \] Facility-type field injection → Zod validation rejects unknown fields ✅  
\- \[ \] Multi-branch access control → Branch A user can't access Branch B data ✅  
\`\`\`

\---

\#\# 🔟 Timeline & Roadmap (समयरेखा) \- QUEUEMD ACCELERATED

\`\`\`  
📅 Week 1: Phase 1 (Universal MVP)  
   \- Setup \+ Folder structure \+ facility-type config  
   \- Queue CRUD APIs \+ Compound Indexes (facilityId \+ facilityType)  
   \- Basic React UI \+ Facility Type Selector  
   \- ✅ Deliverable: Working local demo (Clinic \+ Pathlab test)

📅 Week 2: Phase 2 (Real-Time Universal)  
   \- Socket.io integration \+ facility-type room isolation  
   \- Redis adapter ready code \+ facility-type queue separation  
   \- Frontend listener \+ reconnection \+ facility-type aware UI  
   \- ✅ Deliverable: Multi-tab \+ multi-facility-type sync demo

📅 Week 3: Phase 3 (Multi-Facility Architecture)  
   \- Facility Model \+ APIs \+ facilityType enum \+ customFields  
   \- Strict facilityId \+ facilityType filtering in ALL queries  
   \- Zustand persist \+ Facility Selector UI \+ type-specific components  
   \- ✅ Deliverable: 3 facility types isolation test (Clinic ≠ Pathlab ≠ Dental)

📅 Week 4: Phase 4 (Auth \+ RBAC Universal)  
   \- User Model \+ Auth APIs \+ facilityType \+ role combinations  
   \- JWT \+ bcrypt \+ Zod \+ facility-type specific validation schemas  
   \- Protected routes \+ Facility-Type Role middleware  
   \- ✅ Deliverable: Secure login \+ multi-role \+ multi-type access test

📅 Week 5: Phase 5 (Redis \+ Notifications Universal)  
   \- BullMQ queue \+ worker \+ facility-type template routing  
   \- Phone/email fields \+ notification trigger \+ type-specific messages  
   \- Winston logging \+ facilityId \+ facilityType tagging  
   \- ✅ Deliverable: Background job demo (Pathlab SMS vs Dental Alert)

📅 Week 6: Phase 6 (Payment \+ Deploy \+ QueueMD Launch)  
   \- Razorpay integration \+ facility-type pricing \+ webhook  
   \- Subscription logic \+ UI \+ facility-type feature highlighting  
   \- Final deploy config \+ checklist \+ facility-type env separation  
   \- ✅ Deliverable: Production-ready \+ Payment test \+ Multi-facility demo  
\`\`\`

\---

\#\# 1️⃣1️⃣ Success Metrics (सफलता मापदंड) \- QUEUEMD KPIs

\#\#\# 📊 Technical Metrics  
\`\`\`  
\- API Response Time: \<200ms (compound indexed queries)  
\- Real-Time Sync Latency: \<500ms (Socket.io \+ facility-type rooms)  
\- Uptime: 99.5% (Render \+ Atlas SLA \+ facility-type monitoring)  
\- Error Rate: \<1% (Winston \+ Sentry \+ facility-type error grouping)  
\- Security: Zero critical vulnerabilities (npm audit \+ facility-type penetration test)  
\- Scalability: Support 1000+ facilities across 6 types with same codebase  
\`\`\`

\#\#\# 🎯 Business Metrics  
\`\`\`  
\- Onboarding: New facility setup \<5 minutes (any type)  
\- User Satisfaction: Receptionist can add patient in \<3 clicks (universal UI)  
\- Monetization: Free → Pro conversion target: 15% (facility-type specific upsell)  
\- Facility-Type Adoption: Target 40% non-clinic facilities in first 100 signups  
\- Multi-Branch: 30% of hospital facilities use 2+ branches feature  
\`\`\`

\#\#\# 🎓 MCA Project Evaluation Points \- QUEUEMD EDGE  
\`\`\`  
✅ Innovation: Universal Healthcare SaaS \+ Real-time \+ Multi-tenant \+ Multi-type  
✅ Complexity: 6 phases, 12+ production fixes, 7 roles, 6 facility types  
✅ Documentation: This PRD \+ Code comments \+ README \+ Facility-Type Guides  
✅ Demo: Live sync \+ Payment webhook \+ Multi-facility isolation \+ Type-specific workflows  
✅ Code Quality: ESLint \+ Folder structure \+ Error handling \+ Facility-type dynamic schemas  
✅ Future Scope: Analytics, WhatsApp, Mobile App, AI Wait Prediction (type-specific)  
✅ Real-World Impact: Solves problems for 6 different healthcare facility types  
\`\`\`

\---

\#\# 1️⃣2️⃣ Risks & Mitigation (जोखिम और समाधान) \- QUEUEMD SMART

| Risk | Impact | Mitigation |  
|------|--------|------------|  
| 🔴 MongoDB free tier limit (512MB) | High | Use pagination \+ archive old tokens \+ facility-type data retention policies |  
| 🔴 Socket.io scaling with 6 facility types | Medium | Redis adapter code ready \+ facility-type room separation \+ enable in prod |  
| 🔴 Razorpay test vs prod keys \+ facility-type pricing | High | Strict .env separation \+ validation on startup \+ facility-type pricing config |  
| 🔴 Webhook replay attacks \+ facility-type payloads | High | Signature verify \+ timestamp check \+ idempotency \+ facility-type payload validation |  
| 🟡 Facility-type custom field conflicts | Medium | Zod dynamic schemas \+ facility-type field registry \+ validation middleware |  
| 🟡 Real-time sync conflicts across facility types | Low | Optimistic UI \+ server truth \+ rollback on error \+ facility-type event separation |  
| 🟡 User confusion with universal UI | Medium | Facility-type onboarding wizard \+ contextual help \+ type-specific UI themes |  
| 🟡 Compliance (Healthcare data) | High | Data encryption \+ audit logs \+ GDPR ready endpoints \+ facility-type compliance flags |

\---

\#\# 1️⃣3️⃣ Future Enhancements (भविष्य के फीचर्स) \- QUEUEMD ROADMAP

\`\`\`  
🔜 Phase 7: Analytics Dashboard (Facility-Type Specific)  
   \- Chart.js: Daily patients, avg wait time, peak hours (per facility type)  
   \- Export reports (CSV/PDF) \+ facility-type specific metrics  
   \- Comparative analytics: Clinic vs Hospital vs Pathlab performance

🔜 Phase 8: WhatsApp/SMS Integration (Universal \+ Type-Specific)  
   \- Twilio / MSG91 / WhatsApp Cloud API \+ facility-type template approval  
   \- Opt-in management \+ patient preferences \+ facility-type notification rules

🔜 Phase 9: Mobile App (QueueMD Patient \+ Staff)  
   \- React Native version for patients (universal) \+ staff (facility-type specific)  
   \- Push notifications for token alerts \+ facility-type specific actions  
   \- Offline mode for low-connectivity clinics

🔜 Phase 10: AI Features (Facility-Type Intelligent)  
   \- Wait time prediction (ML model) \+ facility-type training data  
   \- No-show prediction \+ auto-cancel \+ facility-type patterns  
   \- Smart scheduling: Dental procedure duration vs Physio session variance

🔜 Phase 11: Multi-Language \+ Regional (Universal Healthcare)  
   \- i18n support: Hindi, English, Regional languages  
   \- Dynamic content based on facility location \+ patient language preference  
   \- Facility-type specific terminology (Medical vs Lab vs Therapy terms)

🔜 Phase 12: Inter-Facility Referrals (Healthcare Ecosystem)  
   \- Clinic → Pathlab referral workflow  
   \- Hospital → Physiotherapy discharge planning  
   \- Unified patient journey across multiple QueueMD facilities  
\`\`\`

\---

\#\# 📎 Appendix: Quick Reference \- QUEUEMD EDITION

\#\#\# 🔧 Folder Structure (Final \- Universal)  
\`\`\`  
clinic-queue-saas/ → queuemd-platform/ (REBRAND)  
├── client/ (Vite \+ React \+ Universal UI)  
│   ├── src/  
│   │   ├── components/   
│   │   │   ├── universal/ (AddPatientForm, QueueList, PaymentModal)  
│   │   │   ├── facility-types/ (PathlabFields, DentalChairSelector, PhysioSessionForm)  
│   │   │   └── shared/ (ProtectedRoute, FacilitySelector)  
│   │   ├── pages/ (Login, Dashboard \- facility-type aware)  
│   │   ├── store/ (authStore, facilityStore \- Zustand \+ persist)  
│   │   ├── services/ (api.js, socket.js \+ facility-type helpers)  
│   │   ├── utils/ (facilityTypeConfig.js, notificationTemplates.js)  
│   │   └── App.jsx, main.jsx  
│   └── package.json, vite.config.js  
│  
├── server/ (Node \+ Express \+ Universal Backend)  
│   ├── config/ (db.js, redis.js, razorpay.js, facilityTypes.js)  
│   ├── controllers/ (auth, queue, facility, payment \+ facility-type aware)  
│   ├── models/ (User, Facility, Queue, Payment \+ facility-type schemas)  
│   ├── routes/ (auth.routes, queue.routes, facility.routes, payment.routes)  
│   ├── middleware/ (auth, role, facilityType, error, rateLimiter)  
│   ├── sockets/ (index.js, queue.socket.js \+ facility-type rooms)  
│   ├── jobs/ (notification.queue.js, worker.js \+ facility-type templates)  
│   ├── utils/ (logger.js, validation.js \+ facility-type Zod schemas)  
│   ├── app.js, server.js, .env  
│   └── package.json  
│  
├── docs/   
│   ├── PRD.md (this file)  
│   ├── facility-type-guides/ (Clinic.md, Pathlab.md, Dental.md, Physio.md, Hospital.md)  
│   └── api-reference.md  
│  
└── README.md (QueueMD Branding \+ Universal Setup Guide)  
\`\`\`

\#\#\# 🚀 Quick Start Commands \- QueueMD Universal  
\`\`\`bash  
\# 1\. Clone & Setup (REBRANDED)  
git clone your-repo queuemd-platform  
cd queuemd-platform

\# 2\. Backend (Universal)  
cd server  
npm install  
\# Create .env from template (includes facility-type configs)  
npm run dev  \# Starts with nodemon \+ Winston logging \+ facility-type validation

\# 3\. Frontend (Universal UI)  
cd ../client  
npm install  
npm run dev  \# Vite \+ React \+ Tailwind \+ facility-type dynamic components

\# 4\. Redis (for notifications \- universal)  
redis-server  \# Or use Upstash free tier \+ facility-type queue separation

\# 5\. Worker (separate terminal \- facility-type aware)  
cd server  
node jobs/notification.worker.js  \# Loads facility-type templates

\# 6\. Test (Universal Flow)  
Open: http://localhost:5173  
→ Select Facility Type: Pathlab  
→ Add Sample: "Rahul", Test: "Blood Test"  
→ See real-time sync \+ SMS trigger (template: pathlab)

Postman: Test APIs with Bearer token \+ facility-type headers  
\`\`\`

\#\#\# 🎨 QueueMD Branding Guidelines  
\`\`\`  
🎯 Logo: QueueMD™ (Modern \+ Healthcare \+ Tech)  
🎨 Colors:   
   \- Primary: \#2563EB (Trust Blue)  
   \- Secondary: \#10B981 (Health Green)   
   \- Accent: \#F59E0B (Alert Amber)  
🔤 Typography: Inter (Clean, Readable, Medical Professional)  
📱 UI Principles:   
   \- Universal core \+ facility-type specific enhancements  
   \- Mobile-first for receptionists, Desktop-optimized for admins  
   \- Accessibility: WCAG 2.1 AA compliant (healthcare essential)  
🔔 Notifications: Facility-type specific templates \+ patient language preference  
\`\`\`

\---

\> 🎯 \*\*MCA Project Defense Tips \- QueueMD Edition:\*\*  
\> 1\. \*\*Architecture Diagram\*\*: Client → API → DB \+ Socket → Worker (show facility-type flow)  
\> 2\. \*\*All 12+ Fixes\*\*: Explain security \+ scalability \+ facility-type customization  
\> 3\. \*\*Live Demo\*\*:   
\>    \- 2 browsers: Real-time sync (same facility)  
\>    \- 2 facility types: Clinic vs Pathlab (isolation test)  
\>    \- Payment webhook: Facility-type pricing \+ addon activation  
\> 4\. \*\*Multi-Facility Isolation\*\*: Demonstrate Clinic A ≠ Pathlab B ≠ Dental C  
\> 5\. \*\*Code Quality\*\*: Show folder structure, facility-type dynamic schemas, error handling  
\> 6\. \*\*Real-World Impact\*\*: "Sir, yeh sirf clinic nahi, poore healthcare ecosystem ke liye hai\!"  
\> 7\. \*\*Future Vision\*\*: AI wait prediction, inter-facility referrals, mobile app  
\>  
\> \*\*🔥 QueueMD: Ek Codebase, Six Healthcare Types, Infinite Possibilities\! 💪🏥\*\*

\---

\*Document Prepared By: Qwen3.6 Assistant\*    
\*For: MCA Student | MERN Stack Learner | Basic Python Knowledge\*    
\*Project: QueueMD \- Universal Healthcare Queue Management SaaS\*    
\*Branding: QueueMD™ | "Smart Queue, Smarter Healthcare"\*    
\*Last Updated: April 2026\*  

\> 🚀 \*\*Next Step\*\*: Is PRD ko follow karke Phase 1 start karo\! Pehle Facility Model banao, fir Queue APIs ko facility-type aware banayo. Main har step par help karunga\! 💻✨  
