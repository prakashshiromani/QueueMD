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
import { socket } from "../services/socket";

export default function StaffPage() {
  const { user } = useAuthStore();
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
    socket.on("staff_update", ({ action, userId, updatedData }) => {
      setStaff(prev => {
        if (action === "update") return prev.map(s => s._id === userId ? { ...s, ...updatedData } : s);
        if (action === "delete") return prev.filter(s => s._id !== userId);
        return prev;
      });
    });
    return () => socket.off("staff_update");
  }, []);

  // 🔍 Filtered + Memoized (via state updates)
  const filteredStaff = staff.filter(s => {
    const matchSearch = (s.name?.toLowerCase().includes(search.toLowerCase())) || (s.email?.toLowerCase().includes(search.toLowerCase())) || (s._id?.toLowerCase().includes(search.toLowerCase()));
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
      // Local update will be handled by Socket or we can refresh
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

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* 🎯 Header + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-white tracking-tight leading-none">Staff Management</h1>
            <p className="text-[14px] text-white/50 mt-2">Manage personnel roles, schedules, and permissions.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={handleExport} disabled={isExporting} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 h-[44px] bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all font-bold text-[14px] active:scale-95 disabled:opacity-50">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {isExporting ? "Exporting..." : "Export"}
            </button>
            <Link to="/staff/add" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4" />
              Add Staff
            </Link>
          </div>
        </div>

        {/* 🔎 Filter Bar (Glassmorphism) */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID or email..." className="w-full bg-black/20 border border-white/10 text-white placeholder:text-white/40 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-black/20 border border-white/10 text-white rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer font-bold">
            <option value="All" className="bg-slate-900">All Roles</option>
            <option value="admin" className="bg-slate-900">Admin</option>
            <option value="doctor" className="bg-slate-900">Doctor</option>
            <option value="receptionist" className="bg-slate-900">Receptionist</option>
            <option value="lab_tech" className="bg-slate-900">Lab Tech</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-black/20 border border-white/10 text-white rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer font-bold">
            <option value="All" className="bg-slate-900">All Status</option>
            <option value="Active" className="bg-slate-900">Active</option>
            <option value="Inactive" className="bg-slate-900">Inactive</option>
          </select>
        </div>

        {/* 👥 Staff Grid */}
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <StaffSkeleton key={i} />)}</div>
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
                  canDelete={user?.role === "admin"}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <StaffEditModal staff={editingStaff} isOpen={!!editingStaff} onClose={() => setEditingStaff(null)} onSave={handleSave} loading={saving} />
    </Layout>
  );
}

// 🃏 Staff Card Component
const StaffCard = ({ staff, index, onEdit, onDelete, canDelete }) => {
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'from-amber-500 to-orange-600';
      case 'doctor': return 'from-blue-500 to-indigo-600';
      case 'receptionist': return 'from-teal-500 to-emerald-600';
      case 'lab_tech': return 'from-purple-500 to-pink-600';
      default: return 'from-slate-500 to-slate-700';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ y: -5 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group relative overflow-hidden"
    >
      <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${getRoleColor(staff.role)} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`} />
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getRoleColor(staff.role)} p-[1px]`}>
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden">
              <span className="text-xl font-black text-white">{staff.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <div>
            <h3 className="text-[18px] font-black text-white tracking-tight leading-tight capitalize">{staff.name}</h3>
            <p className="text-[12px] font-bold text-white/40 uppercase tracking-widest mt-1">ID: {staff._id?.slice(-6)}</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-lg border ${staff.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
          {staff.isActive ? "Active" : "Inactive"}
        </span>
      </div>
      
      <div className="space-y-3 mb-6 relative z-10">
        <div className="flex items-center gap-2 text-white/60">
          <Shield className="w-4 h-4 opacity-50" />
          <span className="text-xs font-bold uppercase tracking-wider">{(staff.role || 'staff').replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <Search className="w-4 h-4 opacity-50" />
          <span className="text-xs truncate">{staff.email}</span>
        </div>
      </div>
      
      <div className="flex gap-3 pt-4 border-t border-white/10 relative z-10">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-[13px] transition-all active:scale-[0.97] border border-white/5">
          <Edit className="w-4 h-4" /> Edit
        </button>
        {canDelete && (
          <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-[13px] transition-all active:scale-[0.97] border border-red-500/10">
            <Trash2 className="w-4 h-4" /> Remove
          </button>
        )}
      </div>
    </motion.div>
  );
};
