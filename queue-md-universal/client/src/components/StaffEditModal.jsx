import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, User, Mail, Shield } from "lucide-react";
import { z } from "zod";
import toast from "react-hot-toast";
import { useFacilityStore } from "../store/facilityStore";
import { getFacilityConfig } from "../utils/facilityTypeConfig";

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "doctor", "receptionist", "lab_tech", "patient"]),
  isActive: z.boolean()
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
}

export default function StaffEditModal({ staff, isOpen, onClose, onSave, loading }) {
  const { facilityType } = useFacilityStore();
  const config = getFacilityConfig(facilityType);
  const primaryRgb = hexToRgb(config.theme.primary);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "receptionist",
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (staff) {
      setForm({
        name: staff.name || "",
        email: staff.email || "",
        role: staff.role || "receptionist",
        isActive: staff.isActive ?? true
      });
      setErrors({});
    }
  }, [staff]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = staffSchema.safeParse(form);
    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }
    onSave(staff._id, form);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg-primary/95 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-bg-secondary border border-border-muted/50 rounded-3xl shadow-2xl overflow-hidden mx-4"
          >
            {loading && (
              <div className="loading-overlay rounded-3xl">
                <div 
                  className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" 
                  style={{ borderColor: `rgba(${primaryRgb}, 0.2)`, borderTopColor: config.theme.primary }}
                />
              </div>
            )}

            {/* Header */}
            <div className="p-8 border-b border-border-muted/30 flex justify-between items-center bg-bg-primary/30">
              <div>
                <h2 className="text-2xl font-black text-text-primary tracking-tight">Edit Staff Profile</h2>
                <p className="text-text-secondary text-xs mt-1">Modify access level and contact details</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-xl bg-bg-primary flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    className={`w-full bg-bg-primary border ${errors.name ? "border-red-500" : "border-border-muted/50"} rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-[var(--theme-primary)] transition-all shadow-inner placeholder:text-text-secondary/30`}
                    placeholder="John Doe"
                    style={{ '--theme-primary': config.theme.primary }}
                  />
                </div>
                {errors.name && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{errors.name[0]}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    className={`w-full bg-bg-primary border ${errors.email ? "border-red-500" : "border-border-muted/50"} rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-[var(--theme-primary)] transition-all shadow-inner placeholder:text-text-secondary/30`}
                    placeholder="admin@example.com"
                    style={{ '--theme-primary': config.theme.primary }}
                  />
                </div>
                {errors.email && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{errors.email[0]}</p>}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Organization Role</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                  <select
                    value={form.role}
                    onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full bg-bg-primary border border-border-muted/50 rounded-2xl py-4 pl-12 pr-8 text-sm text-text-primary focus:outline-none focus:border-[var(--theme-primary)] transition-all shadow-inner appearance-none cursor-pointer billing-select"
                    style={{ '--theme-primary': config.theme.primary }}
                  >
                    {["admin", "doctor", "receptionist", "lab_tech", "patient"].map(r => (
                      <option key={r} value={r} className="capitalize">{r.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Access */}
              <div className="flex items-center justify-between py-2 px-1">
                <span className="text-sm font-bold text-text-primary">Account Access</span>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${form.isActive ? "bg-green-500" : "bg-slate-400"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${form.isActive ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-[54px] border border-border-muted rounded-2xl text-text-primary hover:bg-surface-variant font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-[54px] rounded-2xl text-white font-black text-sm transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                  style={{
                    backgroundColor: config.theme.primary,
                    boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
                  }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {loading ? "SAVING..." : "APPLY CHANGES"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
