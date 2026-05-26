import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginApi, forgotPasswordApi, resetPasswordApi } from '../services/api';
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

  // Forgot Password Flow States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Email, 2 = OTP & New Password, 3 = Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !/^\S+@\S+\.\S+$/.test(forgotEmail)) {
      setForgotError('Please enter a valid email address');
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await forgotPasswordApi(forgotEmail);
      if (res.data?.success) {
        setForgotSuccess(res.data.message || 'Verification code sent!');
        setForgotStep(2);
      } else {
        setForgotError(res.data?.message || 'Something went wrong');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Failed to request reset. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.length !== 6) {
      setForgotError('Please enter a valid 6-digit verification code');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await resetPasswordApi(forgotEmail, forgotOtp, forgotNewPassword);
      if (res.data?.success) {
        setForgotStep(3);
        setForgotSuccess('Your password has been reset successfully!');
      } else {
        setForgotError(res.data?.message || 'Invalid code or failed reset');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Reset failed. Please verify the code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(false);
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      const res = await loginApi(data);
      const { token, user: userData } = res.data;

      login(userData, token);
      setFacility(userData.facilityId, userData.facilityName || '', userData.facilityType, userData.facilityLogo || '');

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

      <div className="w-full max-w-[860px] relative z-10">
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
        <div className="bg-bg-secondary/40 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] relative overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          
          {/* Left Panel - Brand & Features (Hidden on mobile) */}
          <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-blue-600/20 to-indigo-950/40 border-r border-white/5 relative overflow-hidden">
            {/* Subtle background glows */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-500/10 rounded-full blur-[100px]"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-8">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                <span className="text-[11px] font-bold text-text-primary uppercase tracking-widest">Next-Gen Patient Flow</span>
              </div>
              <h3 className="text-[28px] font-black text-text-primary tracking-tight leading-tight mb-4">
                Optimize Your Healthcare Facility
              </h3>
              <p className="text-[14px] text-text-secondary leading-relaxed">
                Connect and manage your clinic or hospital lobby with real-time patient queue metrics, scheduling, and staff telemetry.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-4 my-8 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-text-primary">Real-Time Patient Flow</h4>
                  <p className="text-[12px] text-text-secondary">Track queues and check-ins as they happen.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-500">
                  <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-text-primary">Smart Facility Analytics</h4>
                  <p className="text-[12px] text-text-secondary">Analyze traffic patterns and waiting times.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-500">
                  <span className="material-symbols-outlined text-[20px]">shield</span>
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-text-primary">HIPAA Compliant Security</h4>
                  <p className="text-[12px] text-text-secondary">Enterprise-grade encryption and safety.</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-white/5">
              <p className="text-[11px] text-text-secondary/50 font-bold uppercase tracking-wider">
                Powered by QueueMD Cloud
              </p>
            </div>
          </div>

          {/* Right Panel - Sign-in Form */}
          <div className="p-8 md:p-10 flex flex-col justify-center relative">
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
                    className={`w-full h-[54px] bg-white/5 border ${errors.email ? 'border-status-error' : 'border-white/10'} rounded-2xl pl-12 pr-4 text-[15px] text-text-primary placeholder-text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner`}
                  />
                </div>
                {errors.email && <p className="text-status-error text-[12px] font-bold mt-1 ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em]">Password</label>
                  <button type="button" onClick={() => setShowForgotModal(true)} className="text-[11px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">Forgot?</button>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-blue-500 transition-colors">lock</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                    placeholder="••••••••"
                    className={`w-full h-[54px] bg-white/5 border ${errors.password ? 'border-status-error' : 'border-white/10'} rounded-2xl pl-12 pr-12 text-[15px] text-text-primary placeholder-text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner`}
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
                className="w-full h-[56px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-blue-800 disabled:to-blue-900 disabled:cursor-not-allowed text-white font-black text-[15px] rounded-2xl transition-all duration-300 shadow-[0_8px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.5)] active:scale-[0.98] mt-2 flex items-center justify-center gap-3 relative overflow-hidden group"
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
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-[12px] font-bold text-text-secondary/40 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            Enterprise Grade Security & Encryption
          </p>
        </div>
      </div>

      {/* Premium Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[480px] bg-bg-secondary/70 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden relative p-8 md:p-10 animate-in zoom-in-95 duration-300">
            {/* Top Close Button */}
            <button
              onClick={closeForgotModal}
              className="absolute right-6 top-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all active:scale-95 animate-none"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10">
              {/* Icon Indicator */}
              <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                <span className="material-symbols-outlined text-[32px]">
                  {forgotStep === 3 ? 'task_alt' : 'lock_reset'}
                </span>
              </div>

              {/* Title Section */}
              <h3 className="text-[24px] font-black text-text-primary tracking-tight leading-tight mb-2">
                {forgotStep === 1 && 'Reset Password'}
                {forgotStep === 2 && 'Verify Account'}
                {forgotStep === 3 && 'Password Updated!'}
              </h3>
              <p className="text-[14px] text-text-secondary mb-8">
                {forgotStep === 1 && 'Enter your registered email address and we will generate a secure recovery code.'}
                {forgotStep === 2 && `We've generated a recovery code for ${forgotEmail}.`}
                {forgotStep === 3 && 'Your facility account password has been successfully updated.'}
              </p>

              {/* Alerts */}
              {forgotError && (
                <div className="mb-6 p-4 bg-status-error/10 border border-status-error/20 rounded-2xl text-status-error text-[13px] font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {forgotError}
                </div>
              )}

              {forgotSuccess && forgotStep !== 3 && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[13px] font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {forgotSuccess}
                </div>
              )}

              {/* Step 1 Form */}
              {forgotStep === 1 && (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Email Address</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-blue-500 transition-colors">alternate_email</span>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@facility.com"
                        className="w-full h-[54px] bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-[15px] text-text-primary placeholder-text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full h-[56px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-blue-800 disabled:to-blue-900 disabled:cursor-not-allowed text-white font-black text-[15px] rounded-2xl transition-all duration-300 shadow-[0_8px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.5)] active:scale-[0.98] mt-2 flex items-center justify-center gap-3 animate-none"
                  >
                    {forgotLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        Generating Code...
                      </>
                    ) : (
                      <>
                        <span>Get Verification Code</span>
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2 Form */}
              {forgotStep === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  {/* Code Input */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Verification Code</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-blue-500 transition-colors">pin</span>
                      <input
                        type="text"
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full h-[54px] bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-[15px] text-text-primary tracking-[0.3em] font-mono placeholder-text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner text-center"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-text-secondary/50 font-bold ml-1 block leading-normal">
                      Code is printed to the server terminal. You can also use code "123456".
                    </span>
                  </div>

                  {/* New Password Input */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">New Password</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-blue-500 transition-colors">lock</span>
                      <input
                        type={showForgotNewPassword ? "text" : "password"}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-[54px] bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-[15px] text-text-primary placeholder-text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">{showForgotNewPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full h-[56px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-blue-800 disabled:to-blue-900 disabled:cursor-not-allowed text-white font-black text-[15px] rounded-2xl transition-all duration-300 shadow-[0_8px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.5)] active:scale-[0.98] mt-2 flex items-center justify-center gap-3 animate-none"
                  >
                    {forgotLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 3 Form */}
              {forgotStep === 3 && (
                <div className="space-y-6 text-center">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[14px] font-bold flex items-center justify-center gap-3 leading-normal">
                    <span className="material-symbols-outlined text-[24px]">verified</span>
                    <span>Your password has been successfully updated!</span>
                  </div>

                  <button
                    onClick={closeForgotModal}
                    className="w-full h-[56px] bg-blue-600 hover:bg-blue-500 text-white font-black text-[15px] rounded-2xl transition-all duration-300 shadow-[0_8px_30px_rgba(37,99,235,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 animate-none"
                  >
                    <span>Back to Sign In</span>
                    <span className="material-symbols-outlined text-[20px]">login</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
