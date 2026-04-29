import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi } from '../services/api';
import { FACILITY_TYPES } from '../utils/facilityTypeConfig';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    facilityName: '', facilityType: 'clinic', role: 'admin'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await registerApi(form);
      setMessage('✅ Account created successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden flex items-center justify-center p-6 py-12">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      
      <div className="w-full max-w-[540px] relative z-10">
        {/* Logo / Brand Section */}
        <div className="text-center mb-10 group cursor-default">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-bg-secondary/50 backdrop-blur-xl border border-white/10 rounded-[24px] shadow-2xl mb-6 group-hover:scale-105 transition-transform duration-500">
            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)]">
              <span className="material-symbols-outlined text-white text-[28px]">app_registration</span>
            </div>
          </div>
          <h1 className="text-[36px] font-black text-text-primary tracking-tighter leading-none mb-2">
            Join Queue<span className="text-teal-500">MD</span>
          </h1>
          <p className="text-[14px] text-text-secondary font-bold tracking-widest uppercase opacity-60">
            Enterprise Registration
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-bg-secondary/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <div className="mb-8">
            <h2 className="text-[24px] font-black text-text-primary tracking-tight">Create Your Facility</h2>
            <p className="text-[14px] text-text-secondary mt-1">Setup your professional healthcare environment</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-status-error/10 border border-status-error/20 rounded-2xl text-status-error text-[13px] font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-status-success/10 border border-status-success/20 rounded-2xl text-status-success text-[13px] font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Section Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-4 bg-teal-500 rounded-full"></span>
              <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">Account Admin</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-teal-500 transition-colors">person</span>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange} required
                    placeholder="Dr. Rahul Sharma"
                    className="w-full h-[54px] bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-[14px] text-text-primary placeholder-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-teal-500 transition-colors">alternate_email</span>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange} required
                    placeholder="admin@facility.com"
                    className="w-full h-[54px] bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-[14px] text-text-primary placeholder-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-teal-500 transition-colors">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" value={form.password} onChange={handleChange} required
                  placeholder="••••••••"
                  className="w-full h-[54px] bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-[14px] text-text-primary placeholder-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-inner"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Facility Section Header */}
            <div className="flex items-center gap-2 mb-2 pt-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
              <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">Facility Details</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Facility Name</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-purple-500 transition-colors">domain</span>
                <input
                  type="text" name="facilityName" value={form.facilityName} onChange={handleChange} required
                  placeholder="e.g. City Health Clinic"
                  className="w-full h-[54px] bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-[14px] text-text-primary placeholder-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Facility Type</label>
                <div className="relative">
                  <select
                    name="facilityType" value={form.facilityType} onChange={handleChange}
                    className="w-full h-[54px] bg-white/5 border border-white/10 rounded-2xl pl-4 pr-10 text-[14px] text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  >
                    {Object.entries(FACILITY_TYPES).map(([key, config]) => (
                      <option key={key} value={key} className="bg-bg-secondary">{config.label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[20px]">keyboard_arrow_down</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Your Role</label>
                <div className="relative">
                  <select
                    name="role" value={form.role} onChange={handleChange}
                    className="w-full h-[54px] bg-white/5 border border-white/10 rounded-2xl pl-4 pr-10 text-[14px] text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  >
                    {(FACILITY_TYPES[form.facilityType]?.roles || ['Receptionist']).map(role => (
                      <option key={role} value={role.toLowerCase().replace(' ', '_')} className="bg-bg-secondary">{role}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[20px]">keyboard_arrow_down</span>
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-[56px] bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-[15px] rounded-2xl transition-all duration-300 shadow-[0_8px_30px_rgba(20,184,166,0.4)] hover:shadow-[0_12px_40px_rgba(20,184,166,0.6)] active:scale-[0.98] mt-4 flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Creating Enterprise...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">rocket_launch</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-[14px] font-bold text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-500 hover:text-teal-400 transition-colors ml-1">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
