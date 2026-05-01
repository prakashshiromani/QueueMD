# 🎨 QueueMD Design System & Architecture
**Version:** 3.7 | **Release:** May 2026

---

## 🏥 Module 10: Appointment Management (v3.6)

### 10.1 Appointment Modal (High Fidelity)
- **Inputs**: Unified `50px` height with `11px` left padding for Material Icons.
- **Logic**: Automated end-time suggestion (+30 mins) on start-time change.
- **Dynamic**: Facility-specific fields (e.g., Procedure for Dental) appear in a themed sub-section.
- **Actions**: "Delete" button added to the footer for existing entries.

### 10.2 Direct Deletion & Patient Cleanup
- **Calendar Grid**: Hover `🗑️` icon triggers a two-stage choice.
- **Choice A (OK)**: Deletes only the specific appointment (Patient remains in directory).
- **Choice B (Cancel)**: Triggers a secondary warning to delete the **Patient Entirely** (removes from directory, deletes all past appointments, and clears active queues).
- **Backend Sync**: Synchronized via `action: "patient_deleted"` socket events to maintain global state.

### 10.3 Daily Schedule Sidebar
- **Dual Sections**: 
    - **Active Appointments**: Highlights the **Latest 3** created entries with a blue border and "New" badge.
    - **Completed Today**: Displays finished tasks with reduced opacity and line-through text.
- **Real-time Stats**: Robust calculation of Remaining vs. Completed tasks.

### 11.1 Lab Reports Management (v3.7)
- **Theme**: Premium Slate Blue palette (`#1E293B`) with secondary glassmorphism layers.
- **Logic**: Sequential status progression (waiting → in-progress → completed → delivered).
- **Search**: 500ms debounced search on `patientName` and `sampleId`.
- **Order Modal**: Custom SAM-xxxx generator with Test Category dropdowns (Blood, Urine, etc.).
- **Real-time**: Socket-based `queue_update` listener for Pathlab specific actions.
