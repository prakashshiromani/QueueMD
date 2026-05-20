import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { connectSocket } from '../services/socket';
import { useFacilityStore } from '../store/facilityStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { setFacility } = useFacilityStore();

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      const res = await loginApi(data);
      const { token, user: userData } = res.data;

      login(userData, token);
      setFacility(userData.facilityId, userData.facilityName || '', userData.facilityType);

      connectSocket(userData.facilityId, userData.facilityType);

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden flex items-center justify-center p-6">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo / Brand Section */}
        <div className="text-center mb-10 group cursor-default">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-bg-secondary/50 backdrop-blur-xl border border-white/10 rounded-[24px] shadow-2xl mb-6 group-hover:scale-105 transition-transform duration-500">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <span className="material-symbols-outlined text-white text-[28px]">medical_services</span>
            </div>
          </div>
          <h1 className="text-[36px] font-black text-text-primary tracking-tighter leading-none mb-2">
            Queue<span className="text-blue-500">MD</span>
          </h1>
          <p className="text-[14px] text-text-secondary font-bold tracking-widest uppercase opacity-60">
            Professional Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-bg-secondary/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] relative overflow-hidden">
          {/* Subtle top light effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          <div className="mb-8">
            <h2 className="text-[24px] font-black text-text-primary tracking-tight">Welcome Back</h2>
            <p className="text-[14px] text-text-secondary mt-1">Sign in to manage your facility</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-status-error/10 border border-status-error/20 rounded-2xl text-status-error text-[13px] font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-blue-500 transition-colors">alternate_email</span>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@facility.com"
                  className={`w-full h-[54px] bg-white/5 border ${errors.email ? 'border-status-error' : 'border-white/10'} rounded-2xl pl-12 pr-4 text-[15px] text-text-primary placeholder-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner`}
                />
              </div>
              {errors.email && <p className="text-status-error text-[12px] font-bold mt-1 ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em]">Password</label>
                <button type="button" className="text-[11px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">Forgot?</button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-blue-500 transition-colors">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  placeholder="••••••••"
                  className={`w-full h-[54px] bg-white/5 border ${errors.password ? 'border-status-error' : 'border-white/10'} rounded-2xl pl-12 pr-12 text-[15px] text-text-primary placeholder-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && <p className="text-status-error text-[12px] font-bold mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-3 px-1">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/20" />
              <label htmlFor="remember" className="text-[13px] font-bold text-text-secondary cursor-pointer select-none">Remember this device</label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[56px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-blue-800 disabled:to-blue-900 disabled:cursor-not-allowed text-white font-black text-[15px] rounded-2xl transition-all duration-300 shadow-[0_8px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.6)] active:scale-[0.98] mt-2 flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Access Dashboard</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-[14px] font-bold text-text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-400 transition-colors ml-1">
                Create Facility
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-[12px] font-bold text-text-secondary/40 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            Enterprise Grade Security & Encryption
          </p>
        </div>
      </div>
    </div>
  );
}
