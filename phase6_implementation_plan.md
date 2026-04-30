# 📦 Phase 6: Intelligent Analytics & Multi-Branch — FINAL PLAN v3.0
> PRD + saas.md + design.md aligned | Coding: ❌ NOT STARTED

---

## ✅ Pre-Check (Codebase Audit Results)

| Item | Status |
|---|---|
| `doctorName` in Queue.js | ✅ Exists (line 47) |
| `facilityId+facilityType+status+completedAt` index | ✅ Exists |
| `branchId` in Queue.js | ❌ Missing — add |
| `branches` in Facility.js | ❌ Missing — add |
| Chart components folder | ❌ Missing — create |
| `recharts` npm package | ❌ Not installed |

---

## 🔴 All 5 Critical Fixes (From Review)

### Fix 1 — Migration Script (NEW FILE)
`server/scripts/migrate-branches.js` (one-time, run manually)
```javascript
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await Queue.updateMany(
    { branchId: { $exists: false } },
    { $set: { branchId: null } }
  );
  console.log(`✅ Migrated ${result.modifiedCount} queue records`);
  process.exit(0);
});
```

---

### Fix 2 — Date Range Validation Helper
Add to `analytics.controller.js` (reusable, all chart APIs use it):
```javascript
const parseDateRange = (range, startDate, endDate) => {
  const now = new Date();
  if (range === 'today') {
    const s = new Date(now); s.setHours(0,0,0,0);
    return { start: s, end: now };
  }
  if (range === '7d') {
    const s = new Date(now); s.setDate(s.getDate() - 7);
    return { start: s, end: now };
  }
  if (range === '30d') {
    const s = new Date(now); s.setDate(s.getDate() - 30);
    return { start: s, end: now };
  }
  if (range === 'custom' && startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    // Validate: no future end, no reversed range, max 90 days
    if (isNaN(s) || isNaN(e) || e > now || s > e) return null;
    if ((e - s) / (1000*60*60*24) > 90) return null;
    return { start: s, end: e };
  }
  // Default fallback = today
  const s = new Date(now); s.setHours(0,0,0,0);
  return { start: s, end: now };
};
```

---

### Fix 3 — design.md Colors in Charts
**From `design.md` Section 1.1 & 5:**

| Token | Value | Use in Charts |
|---|---|---|
| `--primary-container` | `#3B82F6` / `#2563eb` | Bar chart fill, line stroke |
| SVG gradient | `#3b82f6` → transparent | Area chart fill |
| Bar glow | `shadow-[0_0_15px_rgba(37,99,235,0.4)]` | Active bar highlight |
| Inactive bars | `bg-blue-500/10 border border-blue-500/20` | Non-peak bars |
| Chart axis | `text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40` | X/Y labels |
| Grid lines | `opacity-[0.03]` | Subtle dividers |
| Donut center | `text-[24px] font-black text-text-primary` | Total count label |

**Rules in JSX:**
```jsx
// HourlyBarChart — use Tailwind CSS vars, not hardcoded hex
<Bar dataKey="count" fill="var(--primary-container)" radius={[4,4,0,0]} />
// Peak bar different:  fill="#3b82f6"  + glow class

// FacilityDonutChart — pull from FACILITY_TYPES config:
import { FACILITY_TYPES } from '../../utils/facilityTypeConfig';
const colors = facilityStats.map(s => FACILITY_TYPES[s.type]?.theme.primary || '#3B82F6');

// Recharts CustomTooltip wrapper:
<div className="bg-bg-secondary border border-border-muted/50 rounded-xl px-3 py-2 text-[12px] font-bold text-text-primary">
```

---

### Fix 4 — Socket Room Isolation in Analytics
```javascript
// Analytics.jsx — inside useEffect socket listener:
socket.on('queue_update', (data) => {
  if (data.facilityId !== user.facilityId) return;   // ✅ Facility check
  if (data.facilityType !== user.facilityType) return; // ✅ Type check
  loadHourlyData();  // Only refresh charts, not full page reload
});
```

---

### Fix 5 — Branch Dropdown with "All Branches" null option
```jsx
// Analytics.jsx branch selector:
<select
  value={selectedBranch || ''}
  onChange={(e) => setSelectedBranch(e.target.value || null)}
  className="appearance-none bg-bg-secondary border border-border-muted/50 rounded-xl px-4 h-[44px] text-[14px] text-text-primary font-bold"
>
  <option value="">🌐 All Branches</option>
  {branches.map(b => (
    <option key={b._id} value={b._id} disabled={!b.isActive}>
      {b.name}{!b.isActive ? ' (Inactive)' : ''}
    </option>
  ))}
</select>
```

---

## 🟡 Nice-to-Have (All Included)

### Debounce on Date Picker
```javascript
// DailyTrendChart.jsx — prevent rapid API calls:
useEffect(() => {
  const timer = setTimeout(() => loadData(), 500); // 500ms debounce
  return () => clearTimeout(timer);
}, [customStart, customEnd, chartRange]);
```

### Shared Skeleton Component (NEW)
`client/src/components/charts/ChartSkeleton.jsx`
```jsx
// Reusable pulse skeleton for all 4 chart components
export default function ChartSkeleton({ height = 200 }) {
  return (
    <div className="animate-pulse bg-surface-variant rounded-xl" style={{ height }} />
  );
}
// Usage in every chart:
if (loading) return <ChartSkeleton height={220} />;
```

---

## 🗂️ Complete File List (14 Files + 1 Script)

### SERVER (6 files + 1 script)

| File | Action | Key Changes |
|---|---|---|
| `server/models/Queue.js` | MODIFY | Add `branchId` field + 2 new indexes |
| `server/models/Facility.js` | MODIFY | Add `branches` array |
| `server/controllers/analytics.controller.js` | MODIFY | Add `parseDateRange` helper + 4 chart API functions |
| `server/routes/analytics.routes.js` | MODIFY | 4 new routes |
| `server/controllers/facility.controller.js` | MODIFY | 3 branch CRUD functions |
| `server/routes/facility.routes.js` | MODIFY | 3 new branch routes |
| `server/scripts/migrate-branches.js` | **CREATE NEW** | One-time migration script |

### CLIENT (8 files)

| File | Action | Key Changes |
|---|---|---|
| `client/src/components/charts/ChartSkeleton.jsx` | **CREATE NEW** | Shared skeleton loader |
| `client/src/components/charts/HourlyBarChart.jsx` | **CREATE NEW** | Recharts BarChart, design.md colors |
| `client/src/components/charts/DailyTrendChart.jsx` | **CREATE NEW** | Recharts AreaChart, debounce, custom date picker |
| `client/src/components/charts/FacilityDonutChart.jsx` | **CREATE NEW** | Recharts PieChart, FACILITY_TYPES colors |
| `client/src/components/charts/TopDoctorsCard.jsx` | **CREATE NEW** | Pure React leaderboard |
| `client/src/pages/Analytics.jsx` | MODIFY | Add all charts + branch dropdown + socket fix |
| `client/src/pages/Settings.jsx` | MODIFY | Add Branches tab |
| `client/src/store/facilityStore.js` | MODIFY | Add `selectedBranch` state |

---

## 📊 New Analytics API Endpoints

| Function | Route | Chart | branchId Support | Date Range |
|---|---|---|---|---|
| `getHourlyTraffic` | `GET /analytics/hourly` | Bar Chart | ✅ Optional | today / custom |
| `getDailyTrend` | `GET /analytics/daily-trend` | Area Chart | ✅ Optional | 7d / 30d / custom |
| `getFacilityTypeStats` | `GET /analytics/facility-stats` | Donut Chart | ✅ Optional | any |
| `getTopDoctors` | `GET /analytics/top-doctors` | Leaderboard | ✅ Optional | any |

**All APIs:** `facilityId` from `req.user` only (never body) | auth middleware | Winston logger

---

## 📐 Layout Grid (design.md Section 8.2)

```
Row 1: [HourlyBarChart]          → grid-cols-1 (full width)
Row 2: [DailyTrendChart]  [FacilityDonutChart]
       → grid-cols-1 md:grid-cols-1 lg:grid-cols-12 (8+4 split)
Row 3: [TopDoctorsCard]   [Consultation Log Table]
       → grid-cols-1 md:grid-cols-1 lg:grid-cols-2
```

---

## 🔄 Implementation Order

```
STEP 1  → npm install recharts   (in client/ folder)
STEP 2  → server/models/Queue.js   (add branchId + 2 indexes)
STEP 3  → server/models/Facility.js  (add branches[])
STEP 4  → server/scripts/migrate-branches.js  (CREATE — run after step 2)
STEP 5  → server/controllers/analytics.controller.js  (parseDateRange + 4 APIs)
STEP 6  → server/routes/analytics.routes.js  (4 new routes)
STEP 7  → server/controllers/facility.controller.js  (branch CRUD)
STEP 8  → server/routes/facility.routes.js  (3 branch routes)
STEP 9  → client/src/components/charts/ChartSkeleton.jsx  (shared skeleton)
STEP 10 → client/src/components/charts/HourlyBarChart.jsx
STEP 11 → client/src/components/charts/DailyTrendChart.jsx
STEP 12 → client/src/components/charts/FacilityDonutChart.jsx
STEP 13 → client/src/components/charts/TopDoctorsCard.jsx
STEP 14 → client/src/pages/Analytics.jsx  (add charts + socket fix + branch dropdown)
STEP 15 → client/src/pages/Settings.jsx   (add Branches tab)
STEP 16 → client/src/store/facilityStore.js  (add selectedBranch)
```

---

## ⚠️ Rules (PRD-Enforced)
- ✅ `facilityId` ALWAYS from `req.user` — never from request body
- ✅ All routes protected with `auth` middleware  
- ✅ Winston logger — no `console.log` in production
- ✅ design.md CSS vars — no hardcoded hex in JSX (use `var(--primary-container)`)
- ✅ `FACILITY_TYPES` config colors for donut chart slices
- ✅ `branchId` filter always optional — null = all branches
- ✅ Socket listener checks both `facilityId` AND `facilityType`
- ✅ Migration script runs ONCE manually after `branchId` field added
- ✅ `ChartSkeleton` reused in all 4 chart components
