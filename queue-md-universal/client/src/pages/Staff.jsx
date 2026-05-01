import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const Staff = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await api.get('/user/staff');
        setStaffMembers(response.data.data || []);
      } catch (err) {
        console.error('Fetch staff error:', err);
        setError('Failed to fetch staff members.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.facilityId) {
      fetchStaff();
    } else {
      // If no user/facilityId, we can't fetch. But don't stay in loading forever if not logged in
      setLoading(false);
    }
  }, [user]);

  // Helper for colors based on role
  const getRoleColors = (role) => {
    const r = role?.toLowerCase() || '';
    switch (r) {
      case 'doctor': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'receptionist': return 'text-teal-400 bg-teal-400/10 border-teal-400/20';
      case 'lab_tech': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'admin': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-text-primary tracking-tight leading-none">Staff Management</h1>
            <p className="text-[14px] text-text-secondary mt-2">Manage personnel roles, schedules, and permissions.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 h-[44px] rounded-xl bg-bg-secondary border border-border-muted/50 text-text-primary font-bold text-[14px] hover:bg-surface-variant transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export
            </button>
            <Link to="/staff/add" className="flex items-center gap-2 px-6 h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add New Staff
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-bg-secondary/80 p-4 rounded-xl border border-border-muted/50 flex flex-col lg:flex-row gap-4 items-center shadow-sm">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-[14px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-container shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-text-secondary font-bold text-[13px] hover:text-text-primary hover:bg-white/10 transition-all flex-1 lg:min-w-[140px] shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">badge</span>
                All Roles
              </div>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            <button className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-text-secondary font-bold text-[13px] hover:text-text-primary hover:bg-white/10 transition-all flex-1 lg:min-w-[140px] shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                All Status
              </div>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-text-secondary font-bold">Fetching personnel data...</p>
            </div>
          ) : staffMembers.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-bg-secondary/30 rounded-3xl border border-dashed border-white/10">
              <span className="material-symbols-outlined text-[48px] text-text-secondary/20">groups</span>
              <p className="text-text-secondary font-bold mt-4">No staff members found for this facility.</p>
              <Link to="/staff/add" className="text-blue-400 hover:underline mt-2 inline-block font-bold">Add your first member</Link>
            </div>
          ) : staffMembers.map((member) => (
            <div key={member._id} className={`bg-bg-secondary rounded-2xl border-l-[4px] border-y border-r border-border-muted/50 ${member.role === 'admin' ? 'border-amber-500' : 'border-blue-500'} overflow-hidden hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 group`}>
              <div className="p-6 space-y-5">
                {/* Card Header with Profile Image */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-variant border border-border-muted/30 overflow-hidden shadow-inner flex items-center justify-center">
                    {member.profileImage ? (
                      <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-black text-text-primary tracking-tight leading-tight group-hover:text-primary-container transition-colors capitalize">{member.name || 'Unknown Staff'}</h3>
                    <div className="text-[12px] font-bold text-text-secondary mt-0.5 tracking-wider uppercase opacity-60">ID: {member._id ? member._id.slice(-6) : 'N/A'}</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-lg text-[11px] font-black tracking-widest border uppercase ${getRoleColors(member.role)}`}>
                    {(member.role || 'staff').replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-[11px] font-black tracking-widest border uppercase ${member.isActive ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Info Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-text-secondary">
                    <span className="material-symbols-outlined text-[18px]">alternate_email</span>
                    <span className="text-[13px] truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span className="text-[13px]">{member.shift || 'Flexible Shift'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button className="px-4 py-2.5 rounded-xl bg-bg-primary border border-border-muted/50 text-[13px] font-bold text-text-primary hover:bg-surface-variant transition-all active:scale-[0.97]">
                    Edit Profile
                  </button>
                  <button className="px-4 py-2.5 rounded-xl bg-bg-primary border border-border-muted/50 text-[13px] font-bold text-text-primary hover:bg-surface-variant transition-all active:scale-[0.97]">
                    Permissions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Staff;
