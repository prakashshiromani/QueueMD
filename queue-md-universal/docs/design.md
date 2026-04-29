# QueueMD Design System & UI Guidelines

This document is the **single source of truth** for all QueueMD frontend design decisions. It documents the color palette, typography, component patterns, page structures, and responsive rules used across every module — Dashboard, Patients, Appointments, Lab Reports, Billing, Staff, Analytics, Notifications, and Settings.

> **Last Updated:** April 2026

---

## 1. Theme Configuration (Light & Dark Mode)

QueueMD uses a CSS variable-based theming system defined in `client/src/index.css` and mapped via `tailwind.config.js`. The `dark` class on `<html>` toggles between modes.

### 1.1 CSS Variables

| Token                | Light Mode   | Dark Mode    | Tailwind Class              |
|----------------------|--------------|--------------|-----------------------------|
| `--bg-primary`       | `#F8FAFC`    | `#0F172A`    | `bg-bg-primary`             |
| `--bg-secondary`     | `#FFFFFF`    | `#1E293B`    | `bg-bg-secondary`           |
| `--text-primary`     | `#0F172A`    | `#F8FAFC`    | `text-text-primary`         |
| `--text-secondary`   | `#64748B`    | `#94A3B8`    | `text-text-secondary`       |
| `--border-muted`     | `#E2E8F0`    | `#334155`    | `border-border-muted`       |
| `--surface-variant`  | `#F1F5F9`    | `#32343d`    | `bg-surface-variant`        |
| --bg-primary-rgb  | `248, 250, 252`| `15, 23, 42`   | Used for glass effects      |
| --primary-container| `#3B82F6`    | `#2563eb`    | `bg-primary-container`      |

### 1.3 Glassmorphism Pattern
QueueMD utilizes a "Premium Glass" aesthetic for modals, forms, and floating elements:
- **Style:** `bg-white/5 backdrop-blur-md border border-white/10 shadow-inner`
- **Inner Shadow:** Subtle `shadow-inner` for a "pressed" or "carved" look on inputs.
- **Backdrop:** Always uses `backdrop-blur-md` (12px blur) to maintain legibility.

### 1.4 Custom Scrollbar (Unique Aesthetic)
The application features a "Truly Unique Creative Scrollbar":
- **Position:** Right-shifted using `border-left: 6px solid transparent` to create a floating effect.
- **Hover State:** Transitions to a linear gradient (`#00f2fe` to `#764ba2`) with a glow effect.
- **Glow:** `box-shadow: 0 0 15px rgba(0, 242, 254, 0.4)` on hover.

### 1.2 Status Colors (Consistent Across Modes)

| Status     | Hex       | Usage                              |
|------------|-----------|-------------------------------------|
| Info       | `#3B82F6` | Default/waiting, primary actions     |
| Warning    | `#F59E0B` | In-progress, pending states          |
| Success    | `#10B981` | Completed, paid, active              |
| Error      | `#EF4444` | Alerts, overdue, critical            |
| Purple     | `#8B5CF6` | Accent badges, chart segments        |
| Teal       | `#14B8A6` | Secondary accent, staff roles        |

### 1.3 Rules
- **Never** use hardcoded Tailwind grays (`slate-900`, `gray-800`). Always use CSS variable-based classes.
- For semi-transparent overlays on cards use `border-border-muted/50` (50% opacity).
- For inner stat blocks (e.g., inside Staff cards), use `bg-[#111418]` with `border-border-muted/20`.

---

## 2. Typography & Icons

### 2.1 Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### 2.2 Icons
- **Library:** Google Material Symbols Outlined
- **CDN:** Loaded via `<link>` in `index.html`
- **Default size in nav/buttons:** `text-[20px]`
- **Default size in stat cards:** `text-[20px]` to `text-[24px]`

### 2.3 Typography Scale

| Element                     | Classes                                                                 |
|-----------------------------|-------------------------------------------------------------------------|
| Page Title                  | `text-[28px] md:text-[32px] font-black text-text-primary tracking-tight leading-none` |
| Page Subtitle               | `text-[14px] text-text-secondary mt-2`                                   |
| Section / Card Header       | `text-[16px] font-black text-text-primary`                              |
| Card Name (e.g., Staff)     | `text-[18px] font-black text-text-primary tracking-tight leading-tight`  |
| Stat Value (Large)          | `text-[24px]` to `text-[28px] font-black text-text-primary`             |
| Uppercase Label             | `text-[11px]` to `text-[12px] font-black text-text-secondary uppercase tracking-widest` |
| Body / Table Cell           | `text-[14px] text-text-primary font-bold`                               |
| Table Header                | `text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]` |
| Badge Text                  | `text-[11px] font-black tracking-widest uppercase`                       |
| Chart Axis Labels           | `text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40` |

---

## 3. Layout Structure

All pages are wrapped in `<Layout>` which provides the sidebar, top nav, and main content area.

### 3.1 Layout Component (`components/Layout.jsx`)
```
┌─────────────────────────────────────────────────┐
│ Sidebar (w-60, hidden md:flex)                  │
│  ┌─────────────┐ ┌─────────────────────────────┐│
│  │ Brand Logo   │ │ Top Nav (h-16, sticky)      ││
│  │ Nav Items    │ │  Search | Notifications     ││
│  │ (9 items)    │ │  Theme Toggle | Logout      ││
│  │              │ ├─────────────────────────────┤│
│  │              │ │ <main> p-6 pb-[100px]       ││
│  │              │ │  max-w-7xl mx-auto          ││
│  │              │ │  {children}                 ││
│  └─────────────┘ └─────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### 3.2 Sidebar Navigation Items
| Name           | Path            | Icon                  |
|----------------|-----------------|------------------------|
| Dashboard      | `/dashboard`    | `dashboard`            |
| Patients       | `/patients`     | `person`               |
| Appointments   | `/appointments` | `calendar_today`       |
| Lab Reports    | `/lab-reports`  | `biotech`              |
| Billing        | `/billing`      | `payments`             |
| Staff          | `/staff`        | `groups`               |
| Analytics      | `/analytics`    | `monitoring`           |
| Notifications  | `/notifications`| `notifications_active` |
| Settings       | `/settings`     | `settings`             |
| Invoice Creator| `/billing/create-invoice` | `receipt_long` |

### 3.3 Standard Page Header
Every page starts with this consistent header pattern:
```jsx
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
  <div>
    <h1 className="text-[28px] md:text-[32px] font-black text-text-primary tracking-tight leading-none">
      Page Title
    </h1>
    <p className="text-[14px] text-text-secondary mt-2">Subtitle text.</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Action Buttons */}
  </div>
</div>
```

---

## 4. Component Patterns

### 4.1 Summary Stat Cards (Compact)
Used on: **Billing**, **Lab Reports**, **Analytics**

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="bg-bg-secondary p-4 rounded-xl border border-border-muted/50
                  flex items-center justify-between group cursor-pointer
                  hover:border-primary-container/30 transition-all">
    <div>
      <div className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">Label</div>
      <div className="text-[28px] font-black text-text-primary mt-0.5">Value</div>
      <div className="text-[11px] mt-1 font-medium text-text-secondary">Trend text</div>
    </div>
    <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
      <span className="material-symbols-outlined text-[20px] text-green-500">icon</span>
    </div>
  </div>
</div>
```

**Key sizing rules:**
- Padding: `p-4`
- Icon container: `w-9 h-9`
- Icon size: `text-[20px]`
- Value font: `text-[28px] font-black`
- Label font: `text-[12px] uppercase tracking-wider`
- Border radius: `rounded-xl`

### 4.2 Intelligent Wait Time Cards
Used on: **Dashboard** — displays predictive rolling average wait time.

```jsx
<div className="bg-bg-secondary p-5 rounded-2xl border border-border-muted/50
                flex items-center gap-4 hover:border-blue-500/30 transition-all">
  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
    <span className="material-symbols-outlined text-[24px] text-blue-500">avg_pace</span>
  </div>
  <div>
    <div className="text-[12px] font-black text-text-secondary uppercase tracking-widest">
      Avg Wait Time
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-[28px] font-black text-text-primary">24m</span>
      <span className="text-[11px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
        -12%
      </span>
    </div>
  </div>
</div>
```

### 4.3 Analytics Metric Cards
Used on: **Analytics** — compact cards with trend badges and left-accent borders.

```jsx
<div className="bg-bg-secondary p-4 rounded-xl border-l-[4px] border-l-orange-500
                border-y border-r border-border-muted/50">
  <div className="flex items-start justify-between">
    <div className="w-9 h-9 rounded-lg bg-orange-500/10 ...">Icon</div>
    <div className="text-[9px] font-black bg-orange-500/10 px-1.5 py-0.5 rounded uppercase">
      Peak: 11:00 AM
    </div>
  </div>
  <div className="mt-3">
    <div className="text-[11px] font-bold uppercase tracking-widest">Label</div>
    <div className="text-[24px] font-black tracking-tight">00:45:10</div>
  </div>
</div>
```

### 4.3 Staff / Entity Cards
Used on: **Staff** — card grid with left-accent colored borders and embedded stats.

```jsx
<div className="bg-bg-secondary rounded-2xl border-l-[4px] border-l-blue-500
                border-y border-r border-border-muted/50 overflow-hidden p-6 space-y-5">
  <!-- Avatar + Name -->
  <!-- Role/Status Badges -->
  <!-- Mini Stats Grid (bg-[#111418] p-3 rounded-xl) -->
  <!-- Action Buttons -->
</div>
```

### 4.4 Data Tables
Used on: **Billing**, **Lab Reports**, **Patients**

```jsx
<div className="bg-bg-secondary rounded-2xl border border-border-muted/50 overflow-hidden shadow-xl">
  <!-- Table Header Bar: p-5 border-b -->
  <table className="w-full text-left border-collapse">
    <thead>
      <tr className="border-b border-border-muted bg-[#1a1d21]/50">
        <th className="px-6 py-4 text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border-muted/30">
      <tr className="hover:bg-[#1a1d21]/30 transition-colors">
        <td className="px-6 py-5">Content</td>
      </tr>
    </tbody>
  </table>
  <!-- Pagination Footer -->
</div>

### 4.6 Patient Directory (CRM Table)
Used on: **Patients** — management of permanent patient records.

- **Avatar Logic**: `bg-surface-variant` with first letter of name.
- **Search Logic**: Real-time filtering across name, phone, and ID.
- **Action Menu**: Floating glassmorphism menu for "Add to Queue", "View History", "Edit".

```jsx
<tr className="group hover:bg-surface-variant/50 transition-all">
  <td className="px-6 py-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-black">
        R
      </div>
      <div>
        <div className="text-[14px] font-bold text-text-primary">Rahul Sharma</div>
        <div className="text-[11px] text-text-secondary">PID-9928</div>
      </div>
    </div>
  </td>
  {/* ... other cells ... */}
</tr>
```
```

### 4.5 Status Badges
```jsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                 text-[11px] font-black tracking-widest border
                 text-green-400 bg-green-400/10 border-green-400/20">
  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
  PAID
</span>
```

**Status badge color mapping:**
| Status    | Text Color       | Background          | Border              |
|-----------|------------------|---------------------|----------------------|
| Paid      | `text-green-400` | `bg-green-400/10`   | `border-green-400/20`|
| Pending   | `text-yellow-400`| `bg-yellow-400/10`  | `border-yellow-400/20`|
| Overdue   | `text-red-400`   | `bg-red-400/10`     | `border-red-400/20`  |
| Active    | `text-green-400` | `bg-green-400/10`   | `border-green-400/20`|
| On Leave  | `text-yellow-400`| `bg-yellow-400/10`  | `border-yellow-400/20`|

### 4.6 Action Buttons

| Type                  | Classes                                                                                     |
|-----------------------|---------------------------------------------------------------------------------------------|
| Primary (Blue CTA)    | `px-6 h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] shadow-lg shadow-blue-600/20 active:scale-[0.98]` |
| Secondary (Outlined)  | `px-5 h-[44px] rounded-xl bg-bg-secondary border border-border-muted/50 text-text-primary font-bold text-[14px] hover:bg-surface-variant active:scale-[0.98]` |
| Cancel / Ghost        | `px-6 h-[46px] rounded-xl text-[14px] font-bold text-text-secondary hover:text-text-primary` |
| Card Action (Small)   | `px-4 py-2.5 rounded-xl bg-bg-primary border border-border-muted/50 text-[13px] font-bold active:scale-[0.97]` |

**Button height standard:** `h-[44px]` for header actions, `h-[46px]` for form footers.

### 4.7 Form Inputs (Settings Page)
```jsx
<div className="space-y-2">
  <label className="text-[12px] font-black text-text-secondary uppercase tracking-widest pl-1">
    Label
  </label>
  <input
    className="w-full h-[50px] bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4
               text-[14px] text-text-primary focus:outline-none focus:ring-2
               focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
  />
</div>
```

### 4.9 Premium Selects & Dropdowns
To ensure a consistent look, all browser default arrows are suppressed:
- **Logic:** `appearance-none` on `<select>` with an absolute-positioned custom Material Symbol.
- **Fix:** Global CSS in `index.css` suppresses `::-ms-expand` and browser defaults.
- **Icon:** Single `expand_more` chevron positioned `right-4`.

### 4.10 Hybrid Input Fields & Custom Pickers
Used on: **AddPatientModal** and other date/time entry points.

- **Hybrid Input:** Native `<input type="date">` and `<input type="time">` hidden behind a custom formatted display (e.g. `DD-MM-YYYY` or `HH:MM AM/PM`).
- **Custom Time Picker Popover:** A 3-column scrollable Glassmorphism popover for Hours, Minutes, and AM/PM selection, avoiding native picker inconsistencies across browsers.
- **Auto-Masking:** Keyboard input automatically masks to the required format.

### 4.8 Filter / Search Bars
```jsx
<div className="bg-bg-secondary/80 p-4 rounded-xl border border-border-muted/50
                flex flex-col lg:flex-row gap-4 items-center">
  <div className="relative flex-1 w-full">
    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]">
      search
    </span>
    <input className="w-full bg-[#111418] border border-border-muted/50 rounded-lg
                      py-2.5 pl-10 pr-4 text-[14px]" />
  </div>
  <!-- Dropdown filters -->
</div>
```

---

## 5. Charts & Data Visualization (Analytics)

### 5.1 Hourly Traffic (Area Chart)
- **Grid lines:** `opacity-[0.03]` horizontal dividers for subtle reference
- **SVG gradient fill:** Linear gradient from `#3b82f6` at 25% opacity → 0%
- **Line stroke:** `#3b82f6`, strokeWidth `3.5`, with SVG `<filter>` glow effect
- **Data points:** `<circle>` elements with `animate-pulse` on the active point
- **Axis labels:** Placed outside the SVG with `mt-8` spacing to avoid overlap

### 5.2 Monthly Trends (Bar Chart)
- **Active bar:** `bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]`
- **Inactive bars:** `bg-blue-500/10 border border-blue-500/20`
- **Hover effect:** `hover:brightness-150`
- **Month labels:** `text-[9px]` below each bar

### 5.3 Service Performance (Donut Chart)
- **SVG donut:** Multiple `<circle>` elements with `strokeDasharray` offsets
- **Center label:** "Total" count displayed inside the ring
- **Legend items:** Color dot (`w-2.5 h-2.5 rounded-sm`) + label + percentage

### 5.4 Agent Performance (Progress Bars)
- **Bar track:** `h-1.5 bg-[#111418] rounded-full`
- **Fill bar:** Colored `rounded-full` with `transition-all duration-1000`

---

## 6. Notifications

- **Unread indicator:** `w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]` positioned on the left
- **Card structure:** `p-5 rounded-2xl border border-border-muted/50` with icon, title, message, timestamp
- **Hover action:** Delete button fades in via `opacity-0 group-hover:opacity-100`
- **New items:** `bg-bg-secondary border-blue-500/30`, read items: `bg-transparent`

---

## 7. Settings Page

- **Tab Navigation:** Vertical sidebar on desktop (`lg:w-64`), horizontal scrollable on mobile
- **Active tab:** `bg-blue-600 text-white shadow-lg shadow-blue-600/20`
- **Inactive tab:** `text-text-secondary hover:bg-bg-secondary`
- **Form layout:** `grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6`
- **Disabled fields:** `bg-bg-primary/50 border-border-muted/20 cursor-not-allowed italic`

---

## 8. Mobile Responsiveness

### 8.1 Core Rules
- Sidebar: `hidden md:flex` — completely hidden on mobile
- Page padding: `p-6 pb-[100px]` for scroll clearance
- Interactive elements: `active:scale-[0.98]` for tactile feedback

### 8.2 Grid Breakpoints
| Layout                  | Mobile          | Tablet          | Desktop            |
|-------------------------|-----------------|-----------------|---------------------|
| Stats Cards             | `grid-cols-1`   | `grid-cols-2`   | `grid-cols-3` or `grid-cols-4` |
| Staff/Entity Cards      | `grid-cols-1`   | `grid-cols-2`   | `grid-cols-3`       |
| Charts Row              | `grid-cols-1`   | `grid-cols-1`   | `grid-cols-12` (8+4)|
| Bottom Charts           | `grid-cols-1`   | `grid-cols-1`   | `grid-cols-2`       |
| Form Fields             | `grid-cols-1`   | `grid-cols-2`   | `grid-cols-2`       |

### 8.3 Scrollable Patterns
- Tables: `overflow-x-auto` wrapper for horizontal scroll on small screens
- Settings tabs: `overflow-x-auto scrollbar-hide` for horizontal tab scroll on mobile
- Filter bars: `flex-col lg:flex-row` to stack on mobile

---

## 9. Page Inventory

| Page           | Route             | File                  | Key Features                                           |
|----------------|-------------------|-----------------------|--------------------------------------------------------|
| Login          | `/login`          | `Login.jsx`           | Auth form, dark themed                                  |
| Register       | `/register`       | `Register.jsx`        | Registration flow                                       |
| Dashboard      | `/dashboard`      | `Dashboard.jsx`       | Queue management, real-time stats                       |
| Patients       | `/patients`       | `Patients.jsx`        | Patient list, search, CRUD                              |
| Appointments   | `/appointments`   | `Appointments.jsx`    | Calendar grid, upcoming list, gradient buttons          |
| Lab Reports    | `/lab-reports`    | `LabReports.jsx`      | Stats cards, status-coded table, category badges        |
| Billing        | `/billing`        | `Billing.jsx`         | Revenue stats, invoice table, patient avatars           |
| Staff          | `/staff`          | `Staff.jsx`           | Personnel cards, role badges, performance stats         |
| Analytics      | `/analytics`      | `Analytics.jsx`       | SVG charts (area, bar, donut), agent progress bars      |
| Notifications  | `/notifications`  | `Notifications.jsx`   | Activity feed, unread indicators, hover delete          |
| Settings       | `/settings`       | `Settings.jsx`        | Tabbed form, facility config, profile upload            |
| Create Invoice | `/billing/create-invoice` | `CreateInvoice.jsx` | Dynamic billing, auto-calc, premium glass style      |

---

## 10. Design Principles

1. **Midnight Navy Aesthetic:** The dark mode uses rich, deep blues (`#0F172A`, `#1E293B`) instead of flat black for a premium, modern feel.
2. **Glassmorphism Lite:** Cards use semi-transparent borders (`border-white/10`), `backdrop-blur-md`, and `shadow-xl` for a high-end SaaS aesthetic.
3. **Immersive Depth:** Animated backgrounds (blobs) and multi-layered shadows create a sense of software "life" and reactivity.
4. **Color-Coded Semantics:** Every status (Paid, Pending, Overdue, Active, On Leave) has a consistent color treatment across all modules.
5. **Micro-interactions:** Hover states (`hover:translate-x-1`), active presses (`active:scale-[0.98]`), and glowing scrollbars bring the UI to life.
6. **Consistent Data Entry:** All modals (Patient, Appointment, Lab) now include unified **Date, Time, and Status** fields using the premium input style.
