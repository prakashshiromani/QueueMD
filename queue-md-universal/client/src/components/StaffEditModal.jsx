import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2 } from "lucide-react";
import { z } from "zod";
import toast from "react-hot-toast";

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "doctor", "receptionist", "lab_tech", "patient"]),
  isActive: z.boolean()
});

export default function StaffEditModal({ staff, isOpen, onClose, onSave, loading }) {
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
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl backdrop-blur-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white tracking-tight">Edit Staff Profile</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition"><X className="w-5 h-5 text-white/70" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  className={`w-full bg-black/30 border ${errors.name ? "border-red-500" : "border-white/10"} text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wider">{errors.name[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  className={`w-full bg-black/30 border ${errors.email ? "border-red-500" : "border-white/10"} text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold`}
                  placeholder="admin@example.com"
                />
                {errors.email && <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wider">{errors.email[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Organization Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
                >
                  {["admin", "doctor", "receptionist", "lab_tech", "patient"].map(r => (
                    <option key={r} value={r} className="bg-slate-900 capitalize">{r.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between py-2 px-1">
                <span className="text-sm font-bold text-white/60">Account Access</span>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${form.isActive ? "bg-green-500" : "bg-slate-600"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${form.isActive ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-4 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-black text-[14px] uppercase tracking-widest transition active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-600/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {loading ? "Synchronizing..." : "Apply Changes"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
