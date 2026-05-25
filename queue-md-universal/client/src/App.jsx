import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Trigger reload
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import LabReports from './pages/LabReports';
import Billing from './pages/Billing';
import Staff from './pages/Staff';
import AddStaff from './pages/AddStaff';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import CreateInvoice from './pages/CreateInvoice';
import HelpCenter from './pages/HelpCenter';
import PublicTracking from './pages/PublicTracking';
import LobbyPortal from './pages/LobbyPortal';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useFacilityStore } from './store/facilityStore';
import { connectSocket } from './services/socket';
import { Toaster } from "react-hot-toast";

export default function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { facilityId, facilityType } = useFacilityStore();

  // ── Restore user preferences on mount ─────────────────────────
  useEffect(() => {
    const root = document.documentElement;

    // 1. Theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    root.classList.toggle('dark', savedTheme === 'dark');

    // 2. Accent Color
    const savedColor = localStorage.getItem('accentColor') || '#2563EB';
    root.style.setProperty('--primary-container', savedColor);

    // 3. Font Size
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    root.setAttribute('data-font-size', savedFontSize);

    // 4. Compact Mode
    const savedCompact = localStorage.getItem('compactMode') === 'true';
    root.setAttribute('data-compact', String(savedCompact));
  }, []);

  // ── Socket Connection ──────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user?.facilityId && facilityId && facilityType) {
      connectSocket(facilityId, facilityType);
    }
  }, [isAuthenticated, user, facilityId, facilityType]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            padding: "12px 16px"
          },
          success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } }
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <Patients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab-reports"
          element={
            <ProtectedRoute>
              <LabReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/create-invoice"
          element={
            <ProtectedRoute>
              <CreateInvoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <Staff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/add"
          element={
            <ProtectedRoute>
              <AddStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/track/:facilityId/:tokenNumber" element={<PublicTracking />} />
        <Route path="/lobby/:facilityId" element={<LobbyPortal />} />

        {/* Redirect root to dashboard (will go to login if not auth) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
