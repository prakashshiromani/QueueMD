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

export default function App() {
  const { isAuthenticated, user, token } = useAuthStore();
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

    // 3. Font Size — default to medium, always persist so CSS spacing rules apply
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    if (!localStorage.getItem('fontSize')) {
      localStorage.setItem('fontSize', 'medium');
    }
    root.setAttribute('data-font-size', savedFontSize);

    // 4. Compact Mode
    const savedCompact = localStorage.getItem('compactMode') === 'true';
    root.setAttribute('data-compact', String(savedCompact));
  }, []);

  // 🔒 SECURITY: Pass JWT token so server can verify facility ownership (VULN-04)
  useEffect(() => {
    if (isAuthenticated && user?.facilityId && facilityId && facilityType && token) {
      connectSocket(facilityId, facilityType, token);
    }
  }, [isAuthenticated, user, facilityId, facilityType, token]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
            <ProtectedRoute allowedRoles={['admin']}>
              <Staff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/add"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AddStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin', 'doctor']}>
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
