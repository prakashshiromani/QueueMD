# QueueMD Client Documentation

This document provides a technical deep-dive into the frontend architecture of the QueueMD Universal SaaS platform.

## 🛠 Tech Stack
- **Core**: React 18+ (Vite)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (+ Persist middleware for auth & facility context)
- **Icons**: Lucide React
- **Real-time**: Socket.io-client
- **HTTP Client**: Axios

---

## 🏛 Store Architecture

### Facility Store (`store/facilityStore.js`)
Manages the active facility context. This is the heart of the "Universal" logic.
- **`facilityType`**: Determines which theme, icons, and custom fields to render.
- **`facilityId`**: Used for API queries and socket room joining.
- **Persistence**: Saved in `localStorage` so the user stays in their designated facility mode on refresh.

### Auth Store (`store/authStore.js`)
Handles JWT storage, user profile, and session management.

---

## 🧩 Key Components

### 1. Facility Selector (`components/FacilitySelector.jsx`)
A horizontal, scrollable button group that allows instant switching between facility modes.
- **Dynamic Styling**: Active buttons glow with the facility's specific theme color defined in the config.
- **Scalability**: Designed to handle 10+ facility types without breaking the layout.

### 2. Add Patient Form (`components/AddPatientForm.jsx`)
A fully config-driven form that redraws itself based on the current `facilityType`.
- **Universal Fields**: Always renders `patientName` and `phone`.
- **Custom Fields**: Maps through `config.customFields` to render specialized inputs (e.g., `sampleId` for Pathlabs).
- **Indian Localization**: Defaults to `+91` prefix and placeholders for phone numbers.
- **Themed Actions**: The "Add" button's label and background color update dynamically.

### 3. Dashboard (`pages/Dashboard.jsx`)
The main workspace orchestrating real-time updates and data fetching.
- **Effect Syncing**: Re-fetches the queue and re-joins socket rooms whenever `facilityType` or `facilityId` changes.
- **Real-time Isolation**: Uses a "Type Guard" in the socket listener to ensure only relevant updates trigger state changes.
- **Compacted View**: Version 3.1 introduces optimized spacing and chart scaling for higher information density.

### 4. Auth Flow (`pages/Login.jsx`, `pages/Register.jsx`)
Completely redesigned in Version 3.2 for a premium "Senior Developer" look.
- **Immersive UI**: Features animated background blobs and high-blur glassmorphism.
- **Enhanced Forms**: Inputs include contextual Material Symbols and tactile focus states.
- **Registration**: Organized into "Account Admin" and "Facility Details" sections for better UX.

### 5. Help Center (`pages/HelpCenter.jsx`)
A comprehensive support hub integrated into the application.
- **Knowledge Base**: Organized by categories (Getting Started, Billing, Support).
- **Global Access**: Accessible via a floating "FAB" button in the Layout, ensuring support is reachable from any page.

### 6. Global Layout (`components/Layout.jsx`)
The wrapper for all authenticated pages.
- **Navigation**: SideBar for desktop, TopBar for all.
- **Global FAB**: Houses the Help Center button at `fixed bottom-8 right-8`, using glassmorphism and shadow-glow effects.

---

## 📡 Real-time Strategy (Socket.io)
The client maintains a singleton socket instance in `services/socket.js`.
- **Room Join**: Emits `join_facility` with `{ facilityId, facilityType }`.
- **Data Flow**: Listens for `queue_update`.
- **Isolation Protection**: Even though physical room isolation exists on the server, the client verifies `data.facilityId === currentFacilityId` for extra safety.

---

## ⚙️ Configuration Sync
All UI logic is derived from `utils/facilityTypeConfig.js`. 
> **Gold Rule**: To add a new domain (e.g., Physio), only one entry needs to be added to this config file. No component logic needs to be touched. 
> **Version 3.2 Update**: Expanded support for Physio and professional roles like 'Nurse'.
