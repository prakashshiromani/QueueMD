import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, Edit, Trash2, Loader2, UserX, Plus, Shield } from "lucide-react";
import { Link } from 'react-router-dom';
import toast from "react-hot-toast";
import Layout from '../components/Layout';
import { staffApi } from "../services/staffApi";
import StaffEditModal from "../components/StaffEditModal";
import StaffSkeleton from "../components/StaffSkeleton";
import StaffEmptyState from "../components/StaffEmptyState";
import { useAuthStore } from "../store/authStore";
import { useFacilityStore } from "../store/facilityStore";
import { getFacilityConfig } from "../utils/facilityTypeConfig";
import { socket } from "../services/socket";

// Helper to convert hex to RGB string
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
}

export default function StaffPage() {
  const { user } = useAuthStore();
  const { facilityType } = useFacilityStore();
  const config = getFacilityConfig(facilityType);
  const primaryRgb = hexToRgb(config.theme.primary);

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingStaff, setEditingStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await staffApi.getAll();
      setStaff(res.data || res.users || []);
    } catch (err) { 
      console.error(err);
      toast.error("Failed to load staff members"); 
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { 
    if (user?.facilityId) {
      fetchStaff(); 
    } else {
      setLoading(false);
    }
  }, [fetchStaff, user]);

  // 📡 Real-time Sync Listener
  useEffect(() => {
    const handleStaffUpdate = ({ action, userId, updatedData }) => {
      setStaff(prev => {
        if (action === "update") return prev.map(s => s._id === userId ? { ...s, ...updatedData } : s);
        if (action === "delete") return prev.filter(s => s._id !== userId);
        return prev;
      });
    };
    
    socket.on("staff_update", handleStaffUpdate);
    return () => socket.off("staff_update", handleStaffUpdate);
  }, []);

  // 🔍 Filtered
  const filteredStaff = staff.filter(s => {
    const matchSearch = (s.name?.toLowerCase().includes(search.toLowerCase())) || 
                        (s.email?.toLowerCase().includes(search.toLowerCase())) || 
                        (s._id?.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "All" || s.role === roleFilter;
    const matchStatus = statusFilter === "All" || (statusFilter === "Active" ? s.isActive : !s.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const handleSave = useCallback(async (id, data) => {
    setSaving(true);
    try {
      await staffApi.update(id, data);
      toast.success("Staff profile updated successfully");
      setEditingStaff(null);
      fetchStaff();
    } catch (err) { 
      console.error(err);
      toast.error("Update failed. Please try again."); 
    }
    finally { setSaving(false); }
  }, [fetchStaff]);

  const handleExport = () => {
    if (!filteredStaff.length) return toast.error("No data to export");
    setIsExporting(true);
    try {
      const csv = ["Name,Email,Role,Status,ID", ...filteredStaff.map(s => `"${s.name}","${s.email}","${s.role}",${s.isActive ? "Active" : "Inactive"},${s._id}`)].join("\n");
      const a = document.createElement("a");
      a.href = `data:text/csv;charset=utf-8,${encodeURI(csv)}`;
      a.download = `staff_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      toast.success("Exported successfully");
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await staffApi.delete(id);
      toast.success("Staff member removed");
      fetchStaff();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    try {
      await staffApi.toggleStatus(id, !currentStatus);
      toast.success("Status updated successfully");
      fetchStaff();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  }, [fetchStaff]);

  return (
    <Layout>
      <div className="w-full space-y-6 max-w-7xl mx-auto pb-32">
        {/* 🎯 Header + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center border"
              style={{ 
                backgroundColor: `rgba(${primaryRgb}, 0.1)`, 
                color: config.theme.primary, 
                borderColor: `rgba(${primaryRgb}, 0.25)` 
              }}
            >
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <h1 className="text-[28px] md:text-[32px] font-black text-text-primary tracking-tight leading-none">Staff Management</h1>
              <p className="text-[14px] text-text-secondary mt-2">Manage personnel roles, schedules, and permissions.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleExport} 
              disabled={isExporting} 
              className="px-5 h-[46px] rounded-xl bg-bg-secondary border border-border-muted/50 dark:border-white/5 text-text-secondary hover:text-text-primary font-bold text-[13px] hover:bg-surface-variant/30 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-[18px]">download</span>} 
              {isExporting ? "Exporting..." : "Export"}
            </button>
            <Link 
              to="/staff/add" 
              className="px-6 h-[46px] rounded-xl text-white font-bold text-[14px] active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg"
              style={{
                backgroundColor: config.theme.primary,
                boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
              }}
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Staff
            </Link>
          </div>
        </div>

        {/* 🔎 Filter Bar */}
        <div className="bg-bg-secondary p-4 rounded-2xl border border-border-muted/50 dark:border-white/5 shadow-sm grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
          <div className="relative lg:col-span-2 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name, ID or email..." 
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-[var(--theme-primary)] transition-all placeholder:text-text-secondary/50 shadow-inner"
              style={{ '--theme-primary': config.theme.primary }}
            />
          </div>
          
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">shield</span>
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)} 
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 pl-10 pr-8 text-sm text-text-primary focus:outline-none appearance-none cursor-pointer billing-select font-bold"
            >
              <option value="All">All Roles</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
              <option value="nurse">Nurse</option>
              <option value="lab_tech">Lab Tech</option>
            </select>
          </div>

          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">verified</span>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 pl-10 pr-8 text-sm text-text-primary focus:outline-none appearance-none cursor-pointer billing-select font-bold"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* 👥 Staff Grid */}
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <StaffSkeleton key={i} />)}
            </div>
          ) : filteredStaff.length === 0 ? (
            <StaffEmptyState />
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((s, i) => (
                <StaffCard 
                  key={s._id} 
                  staff={s} 
                  index={i} 
                  onEdit={() => setEditingStaff(s)} 
                  onDelete={() => handleDelete(s._id)}
                  onToggleStatus={() => handleToggleStatus(s._id, s.isActive)}
                  canDelete={user?.role === "admin"}
                  canToggle={user?.role === "admin" || user?.role === "receptionist"}
                  config={config}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <StaffEditModal 
        staff={editingStaff} 
        isOpen={!!editingStaff} 
        onClose={() => setEditingStaff(null)} 
        onSave={handleSave} 
        loading={saving} 
        isDark={document.documentElement.classList.contains('dark')}
      />
    </Layout>
  );
}

// 🃏 Staff Card Component
const StaffCard = ({ staff, index, onEdit, onDelete, onToggleStatus, canDelete, canToggle, config }) => {
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'from-amber-500 to-orange-600';
      case 'doctor': return 'from-blue-500 to-indigo-600';
      case 'receptionist': return 'from-teal-500 to-emerald-600';
      case 'nurse': return 'from-fuchsia-500 to-pink-600';
      case 'lab_tech': return 'from-purple-500 to-pink-600';
      default: return 'from-slate-500 to-slate-700';
    }
  };

  const primaryRgb = hexToRgb(config.theme.primary);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className="bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${config.theme.primary}40`;
        e.currentTarget.style.boxShadow = `0 8px 30px rgba(${primaryRgb}, 0.06)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div 
        className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${getRoleColor(staff.role)} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity duration-500`} 
      />
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getRoleColor(staff.role)} p-[1px]`}>
            <div className="w-full h-full rounded-2xl bg-bg-secondary flex items-center justify-center overflow-hidden border border-border-muted/20">
              {staff.profileImage ? (
                <img 
                  src={staff.profileImage} 
                  alt={staff.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={`text-xl font-black bg-gradient-to-br ${getRoleColor(staff.role)} bg-clip-text text-transparent`}>
                  {staff.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-[18px] font-black text-text-primary tracking-tight leading-tight capitalize">{staff.name}</h3>
            <p className="text-[11px] font-bold text-text-secondary/60 uppercase tracking-widest mt-1">ID: {staff._id?.slice(-6)}</p>
          </div>
        </div>
        
        <button 
          onClick={onToggleStatus}
          disabled={!canToggle}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border flex items-center gap-1.5 transition active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed ${
            staff.isActive 
              ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" 
              : "text-rose-500 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
          {staff.isActive ? "Active" : "Inactive"}
        </button>
      </div>
      
      <div className="space-y-3 mb-6 relative z-10">
        <div className="flex items-center gap-2.5 text-text-secondary font-medium">
          <span className="material-symbols-outlined text-[18px] opacity-70">shield</span>
          <span className="text-xs font-bold uppercase tracking-wider">{(staff.role || 'staff').replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-2.5 text-text-secondary font-medium">
          <span className="material-symbols-outlined text-[18px] opacity-70">mail</span>
          <span className="text-xs truncate font-mono">{staff.email}</span>
        </div>
      </div>
      
      <div className="flex gap-3 pt-4 border-t border-border-muted/30 dark:border-white/5 relative z-10">
        <button 
          onClick={onEdit} 
          className="flex-1 h-[42px] bg-bg-primary hover:bg-surface-variant text-text-primary font-bold rounded-xl text-[13px] border border-border-muted/50 dark:border-white/5 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span> Edit
        </button>
        {canDelete && (
          <button 
            onClick={onDelete} 
            className="flex-1 h-[42px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl text-[13px] border border-rose-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span> Remove
          </button>
        )}
      </div>
    </motion.div>
  );
};
