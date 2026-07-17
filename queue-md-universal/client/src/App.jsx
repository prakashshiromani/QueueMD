import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Lazy loaded page components
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Notifications = lazy(() => import('./pages/notifications/Notifications'));
const Patients = lazy(() => import('./pages/patients/Patients'));
const Appointments = lazy(() => import('./pages/appointments/Appointments'));
const LabReports = lazy(() => import('./pages/lab/LabReports'));
const Billing = lazy(() => import('./pages/billing/Billing'));
const Staff = lazy(() => import('./pages/staff/Staff'));
const AddStaff = lazy(() => import('./pages/staff/AddStaff'));
const Analytics = lazy(() => import('./pages/analytics/Analytics'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const CreateInvoice = lazy(() => import('./pages/billing/CreateInvoice'));
const HelpCenter = lazy(() => import('./pages/help/HelpCenter'));
const PublicTracking = lazy(() => import('./pages/public/PublicTracking'));
const LobbyPortal = lazy(() => import('./pages/queue/LobbyPortal'));

import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useFacilityStore } from './store/facilityStore';
import { connectSocket } from './services/socket';
import ConnectionStatus from './components/ui/ConnectionStatus';

const PageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
  </div>
);

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
      <ConnectionStatus />
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
