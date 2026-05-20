import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../services/socket';
import { Link, useLocation } from 'react-router-dom';
import { useFacilityStore } from '../store/facilityStore';
import { getFacilityConfig } from '../utils/facilityTypeConfig';
import { useToast } from '../utils/useToast';

const Layout = ({ children, scaled = true }) => {
  const { user, logout } = useAuthStore();
  const { facilityType } = useFacilityStore();
  const config = getFacilityConfig(facilityType);
  const location = useLocation();
  const { addToast, ToastContainer } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const handleToast = (e) => {
      addToast(e.detail.message, e.detail.type);
    };
    window.addEventListener("notification_toast", handleToast);
    return () => window.removeEventListener("notification_toast", handleToast);
  }, [addToast]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Patients', path: '/patients', icon: 'person' },
    { name: 'Appointments', path: '/appointments', icon: 'calendar_today' },
    { name: 'Lab Reports', path: '/lab-reports', icon: 'biotech' },
    { name: 'Billing', path: '/billing', icon: 'payments' },
    { name: 'Staff', path: '/staff', icon: 'groups' },
    { name: 'Analytics', path: '/analytics', icon: 'monitoring' },
    { name: 'Notifications', path: '/notifications', icon: 'notifications_active' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <div
      className="flex h-screen w-full bg-bg-primary text-text-primary overflow-hidden"
      style={{
        '--theme-primary': config.theme.primary,
        '--theme-primary-rgb': hexToRgb(config.theme.primary),
        '--theme-secondary': config.theme.secondary
      }}
    >
      {/* SideNavBar (Desktop Only) */}
      <aside className="w-60 flex-shrink-0 border-r border-border-muted bg-bg-primary hidden md:flex flex-col z-40 overflow-y-auto">
        <div className="px-6 py-6 mb-2">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">QueueMD</h2>
          <p className="text-text-secondary text-[12px]">Healthcare Management</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer transition-all duration-300 border-r-4 ${isActive
                    ? 'text-[var(--theme-primary)] bg-[rgba(var(--theme-primary-rgb),0.05)] border-[var(--theme-primary)]'
                    : 'text-text-secondary hover:bg-surface-variant/30 hover:text-text-primary hover:translate-x-1 border-transparent'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-500"
        style={scaled ? { zoom: 0.9 } : {}}
      >
        {/* TopNavBar */}
        <header className="h-16 flex-shrink-0 z-50 border-b border-border-muted bg-bg-primary/80 backdrop-blur-md flex items-center justify-between px-6">
          <div className="flex items-center md:hidden">
            <h1 className="text-xl font-black tracking-tighter text-primary-container">QueueMD</h1>
          </div>
          <div className="hidden md:flex items-center gap-4 flex-1">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">search</span>
              <input
                className="w-full bg-bg-secondary border border-border-muted rounded-full py-2 pl-10 pr-4 text-[14px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container"
                placeholder="Search..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/notifications" className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-variant/50 transition-all duration-200 rounded-full active:scale-95 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-variant/50 transition-all duration-200 rounded-full active:scale-95 flex items-center justify-center"
              title="Toggle Theme"
            >
              <span className="material-symbols-outlined text-[24px]">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-text-secondary hover:text-status-error hover:bg-status-error/10 transition-all duration-200 rounded-full active:scale-95 flex items-center justify-center"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </button>
            <Link
              to="/settings"
              className="ml-2 w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-border-muted flex items-center justify-center font-bold text-xs hover:border-primary-container transition-all active:scale-95 cursor-pointer"
              title="Profile Settings"
            >
              {user?.name?.charAt(0) || 'U'}
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative">
          <main className="p-6 pb-[100px] w-full max-w-7xl mx-auto">
            {children}
          </main>

          {/* Global Floating Help Center Button */}
          <div className="fixed bottom-8 right-8 z-[60] flex items-center gap-3 group">
            <div className="px-4 py-2 bg-bg-secondary/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none">
              <span className="text-[13px] font-bold text-text-primary whitespace-nowrap">Help Center</span>
            </div>
            <Link
              to="/help"
              className="w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/btn"
              style={{
                backgroundColor: 'var(--theme-primary)',
                boxShadow: `0 8px 30px rgba(var(--theme-primary-rgb), 0.4)`
              }}
              title="Help Center"
            >
              <span className="material-symbols-outlined text-[28px] group-hover/btn:rotate-12 transition-transform">help</span>
            </Link>
          </div>
        </div>
      </div>
      {/* 🔥 Global Premium Toast System */}
      <ToastContainer />
    </div>
  );
};

// Helper to convert hex to RGB string for use with opacity in tailwind/css
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

export default Layout;
