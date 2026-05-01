# 📄 PRD (Product Requirements Document) - UPDATED  
## 🏥 QueueMD - Universal Healthcare Queue Management SaaS  
**Version:** 3.6 | **Date:** May 2026 | **Prepared For:** MCA Final Year Project
**Branding:** QueueMD™ | **Tagline:** *"Predictive Analytics, Unified Healthcare"*

---

## 1️⃣ Project Overview (परिचय)

### 🎯 Vision  
**QueueMD** ek aisa universal SaaS platform hai jahan **hospitals, clinics, pathlabs, dental centers, physiotherapy clinics** aur anya healthcare facilities apne patient/appointment queue ko digitally manage kar sakein — real-time updates, multi-branch support, aur premium features ke saath.

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
✅ Intelligent Analytics → Rolling average prediction for patient wait times
✅ Unified Patient Records → CRM-style directory across all visits
✅ UI Polish → Glassmorphism, custom dropdowns, and premium interactions
✅ Premium Hybrid Inputs → Native picker fallback + adaptive flex layouts
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

## 4️⃣ Features Breakdown (Phase-wise) 🚀

- Phase 1: Universal Foundation ✅
- Phase 2: Real-Time Sync (Socket.io) ✅
- Phase 3: Multi-Facility Architecture ✅
- Phase 4: Auth & RBAC System ✅
- Phase 5: Redis + Notifications (BullMQ) ✅
- Phase 6: Intelligent Analytics & Unified CRM ✅
- Phase 7: Premium UX & Advanced Appointment Logic (v3.6) ✅
- Phase 8: Payment & Subscription (Razorpay) 🛠️ (In Progress)

---

## 5️⃣ Module Specific: Appointment Management (v3.6)

### 5.1 Direct Delete Functionality
- **Calendar Grid**: Hover over an appointment to reveal a 🗑️ (Trash) icon for instant deletion.
- **Edit Modal**: A dedicated red "Delete" button is available in the footer when editing existing appointments.
- **Backend Sync**: All deletions are synchronized via Socket.io to update all connected clients in real-time.

### 5.2 Intelligent Scheduling
- **Auto-End Time**: When a start time is selected, the system automatically suggests an end time (+30 minutes by default).
- **Time Validation**: Integrated logic ensures the end time is always after the start time, preventing scheduling errors.

### 5.3 Daily Schedule Sidebar
- **Latest 3 Highlight**: The top section of the sidebar automatically highlights the 3 most recently scheduled patients for the day.
- **Completed Today**: A dedicated section tracks all finished appointments, maintaining clear visibility of the day's progress.
- **Real-time Stats**: Live counters for "Remaining", "Completed", and "Total" appointments.

### 5.4 Premium Modal UI
- **Glassmorphism Design**: High-end aesthetic with `backdrop-blur` and `white/5` background.
- **Unified Inputs**: All input fields standardized to `50px` height with Material Icons for a consistent, premium feel.
- **Facility-Specific Fields**: Dynamic rendering of fields (e.g., Procedure for Dental, Test Type for Pathlab) based on the user's facility type.

---

## 6️⃣ Technical Requirements

### 🖥 Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS (Core Logic in standard CSS), Zustand.
- **Backend**: Node.js, Express, MongoDB (Compound Indexes), Socket.io, BullMQ, Redis.
- **Documentation**: `design.md`, `saas.md`, `SKILL.md` (Version 3.6 Synchronized).

### 🗄 Database Schema (Appointment Update)
- Added `calledAt`, `completedAt`, and `waitTime` for analytics.
- Enhanced `customData` map for facility-specific fields.
- Robust indexing on `facilityId`, `facilityType`, and `appointmentDate`.
