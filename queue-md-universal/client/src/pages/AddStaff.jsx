import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const AddStaff = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'doctor',
    specialization: '',
    phone: '',
    shift: '09:00 AM - 05:00 PM',
    isActive: true,
    profileImage: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the dedicated create-staff endpoint for authenticated admins
      const response = await api.post('/user/create', formData);

      if (response.data.success) {
        navigate('/staff');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add staff member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'doctor', label: 'Doctor / Specialist', icon: 'medical_services' },
    { value: 'receptionist', label: 'Receptionist', icon: 'person' },
    { value: 'lab_tech', label: 'Lab Technician', icon: 'biotech' },
    { value: 'admin', label: 'Administrator', icon: 'admin_panel_settings' },
  ];

  return (
    <Layout>
      <div className="w-full space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/staff')}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-[32px] font-black text-text-primary tracking-tight">Add New Staff</h1>
              <p className="text-[14px] text-text-secondary mt-1 tracking-tight opacity-70">Register a new healthcare professional to the system.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {error && (
              <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] font-bold animate-in fade-in slide-in-from-top-2 mr-2">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/staff')}
              className="px-6 h-[48px] rounded-xl text-[14px] font-black text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-staff-form"
              disabled={loading}
              className={`px-8 h-[48px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[14px] shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center gap-3 ${loading ? 'opacity-50' : ''}`}
            >
              <span className="material-symbols-outlined text-[20px]">{loading ? 'sync' : 'verified'}</span>
              {loading ? 'Saving...' : 'Save Staff Member'}
            </button>
          </div>
        </div>

        <form id="add-staff-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Details */}
          <div className="relative group">
            <div className="absolute -top-[1px] left-4 right-4 h-[2px] bg-gradient-to-r from-blue-500 to-teal-500 rounded-full z-10"></div>
            <div className="bg-bg-secondary/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-blue-400 text-[22px]">person</span>
                <h2 className="text-[18px] font-black text-text-primary tracking-tight">Personal Details</h2>
              </div>

              <div className="flex flex-col lg:flex-row gap-10">
                {/* Photo Upload Area */}
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center relative group/photo overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto group-hover/photo:bg-blue-500/20 transition-all">
                          <span className="material-symbols-outlined text-white/30 group-hover/photo:text-blue-400">add_a_photo</span>
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-text-primary">Upload Photo</p>
                          <p className="text-[10px] text-text-secondary mt-1">JPG, PNG up to 2MB</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all">
                      <span className="text-[12px] font-bold text-white uppercase tracking-widest">Change</span>
                    </div>
                  </div>
                </div>

                {/* Personal Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Sarah Jenkins"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="sarah.j@queuemd.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 2: Professional Info */}
            <div className="relative group">
              <div className="absolute -top-[1px] left-4 right-4 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full z-10"></div>
              <div className="bg-bg-secondary/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl space-y-8 h-full">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-purple-400 text-[22px]">work</span>
                  <h2 className="text-[18px] font-black text-text-primary tracking-tight">Professional Info</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Staff ID (Auto-generated)</label>
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-[14px] text-text-primary/50 font-mono italic">
                      QMD-{Math.floor(1000 + Math.random() * 9000)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Select Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      {roles.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: role.value })}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${formData.role === role.value
                              ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
                              : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10 hover:text-text-primary'
                            }`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${formData.role === role.value ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'bg-white/10'}`}></div>
                          <span className="text-[13px] font-bold">{role.label.split(' / ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Department</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-[14px] text-text-primary appearance-none outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    >
                      <option value="" className="bg-bg-secondary">Select Department</option>
                      <option value="Cardiology" className="bg-bg-secondary">Cardiology</option>
                      <option value="Orthopedics" className="bg-bg-secondary">Orthopedics</option>
                      <option value="General Medicine" className="bg-bg-secondary">General Medicine</option>
                      <option value="Pediatrics" className="bg-bg-secondary">Pediatrics</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Work Schedule */}
            <div className="relative group">
              <div className="absolute -top-[1px] left-4 right-4 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full z-10"></div>
              <div className="bg-bg-secondary/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-8 h-full">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-400 text-[22px]">calendar_month</span>
                  <h2 className="text-[18px] font-black text-text-primary tracking-tight">Work Schedule</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Working Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <button
                          key={day}
                          type="button"
                          className={`w-[48px] h-[36px] rounded-full border text-[11px] font-black uppercase transition-all ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day)
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                              : 'bg-white/5 border-white/10 text-text-secondary hover:text-text-primary'
                            }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Shift Start</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="09:00 AM"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-emerald-500/50 outline-none"
                          value={formData.shift.split(' - ')[0]}
                          onChange={(e) => setFormData({ ...formData, shift: `${e.target.value} - ${formData.shift.split(' - ')[1]}` })}
                        />
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">schedule</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Shift End</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="05:00 PM"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-emerald-500/50 outline-none"
                          value={formData.shift.split(' - ')[1]}
                          onChange={(e) => setFormData({ ...formData, shift: `${formData.shift.split(' - ')[0]} - ${e.target.value}` })}
                        />
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">schedule</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-black text-text-primary">System Access</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">Activate profile immediately</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddStaff;
