import { Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🔒 SECURITY: Enforce frontend role-based access controls (RBAC) (Item 5)
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-950/20 rounded-full blur-3xl" />

        <div className="w-full max-w-md p-8 rounded-2xl border border-white/5 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative z-10 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-slate-100 mb-2 font-display">Access Denied</h2>
          <p className="text-sm text-slate-400 mb-6">
            Your current role <span className="font-semibold text-slate-200 capitalize">({user?.role})</span> does not have the required permissions to view this section.
          </p>

          <Link
            to="/dashboard"
            className="inline-flex w-full items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
