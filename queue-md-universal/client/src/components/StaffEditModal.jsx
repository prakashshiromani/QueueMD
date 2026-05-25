import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Calendar, Phone, Building2, Clock, User } from "lucide-react";
import { z } from "zod";
import toast from "react-hot-toast";
import ImageUploader from "./ui/ImageUploader";

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "doctor", "receptionist", "nurse", "lab_tech", "patient"]),
  isActive: z.boolean(),
  specialization: z.string().optional(),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits").optional().or(z.literal("")),
  shift: z.string().optional(),
  workingDays: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).min(1, "Select at least one day"),
  profileImage: z.string().url("Invalid URL format").optional().or(z.literal(""))
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFTS = [
  "09:00 AM - 05:00 PM",
  "10:00 AM - 06:00 PM",
  "08:00 AM - 04:00 PM",
  "12:00 PM - 08:00 PM",
  "Custom"
];

export default function StaffEditModal({ staff, isOpen, onClose, onSave, loading, isDark = true }) {
  const [form, setForm] = useState({
    name: "", email: "", role: "receptionist", isActive: true,
    specialization: "", phone: "", shift: "09:00 AM - 05:00 PM",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], profileImage: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (staff) {
      setForm({
        name: staff.name || "",
        email: staff.email || "",
        role: staff.role || "receptionist",
        isActive: staff.isActive ?? true,
        specialization: staff.specialization || "",
        phone: staff.phone || "",
        shift: staff.shift || "09:00 AM - 05:00 PM",
        workingDays: staff.workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri"],
        profileImage: staff.profileImage || ""
      });
      setErrors({});
    }
  }, [staff, isOpen]);

  const handleToggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = staffSchema.safeParse(form);
    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }
    onSave(staff._id, form);
  };

  const theme = {
    overlay: isDark ? "bg-black/60 backdrop-blur-sm" : "bg-gray-900/40 backdrop-blur-sm",
    modalBg: isDark ? "bg-slate-900/90 border-white/10" : "bg-white border-gray-200",
    text: isDark ? "text-white" : "text-slate-900",
    label: isDark ? "text-white/60" : "text-slate-600",
    inputBg: isDark ? "bg-black/30 border-white/10" : "bg-gray-50 border-gray-200",
    inputText: isDark ? "text-white" : "text-slate-900",
    optionBg: isDark ? "bg-slate-800" : "bg-white",
    toggleOn: "bg-green-500",
    toggleOff: isDark ? "bg-slate-600" : "bg-gray-300",
    toggleKnob: isDark ? "bg-white" : "bg-slate-900",
    buttonPrimary: "bg-blue-600 hover:bg-blue-500 text-white",
    closeBtn: isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-gray-100 text-slate-600",
    daySelected: "bg-blue-600 text-white shadow-lg shadow-blue-500/30",
    dayUnselected: isDark ? "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10" : "bg-gray-100 text-slate-700 hover:bg-gray-200 border border-gray-200"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${theme.overlay}`}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className={`${theme.modalBg} border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-xl m-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-inherit p-6 border-b border-white/10 flex justify-between items-center z-10">
              <h2 className={`text-xl font-semibold ${theme.text}`}>Edit Staff Profile</h2>
              <button onClick={onClose} className={`p-1 rounded-lg transition ${theme.closeBtn}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* 👤 Personal */}
              <div>
                <h3 className={`text-sm font-medium ${theme.label} mb-3 uppercase tracking-wider`}>Personal Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-1 ${theme.label}`}>Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                    />
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name[0]}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${theme.label}`}>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                    />
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email[0]}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${theme.label} flex items-center gap-2`}>
                      <Phone className="w-4 h-4" /> Phone (10 digits)
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setForm(p => ({ ...p, phone: val }));
                      }}
                      maxLength="10"
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                      placeholder="9876543210"
                    />
                    {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone[0]}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${theme.label}`}>Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:${theme.optionBg}`}
                    >
                      {["admin", "doctor", "receptionist", "nurse", "lab_tech", "patient"].map(r => (
                        <option key={r} value={r} className={theme.optionBg}>{r.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 🏥 Professional */}
              <div>
                <h3 className={`text-sm font-medium ${theme.label} mb-3 uppercase tracking-wider`}>Professional Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-1 ${theme.label} flex items-center gap-2`}>
                      <Building2 className="w-4 h-4" /> Specialization
                    </label>
                    <input
                      type="text"
                      value={form.specialization}
                      onChange={(e) => setForm(p => ({ ...p, specialization: e.target.value }))}
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                      placeholder="e.g., Cardiology"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${theme.label} flex items-center gap-2`}>
                      <Clock className="w-4 h-4" /> Shift Timing
                    </label>
                    <select
                      value={form.shift}
                      onChange={(e) => setForm(p => ({ ...p, shift: e.target.value }))}
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:${theme.optionBg}`}
                    >
                      {SHIFTS.map(shift => (
                        <option key={shift} value={shift} className={theme.optionBg}>{shift}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 📅 Working Days */}
              <div>
                <label className={`block text-sm mb-2 ${theme.label} flex items-center gap-2`}>
                  <Calendar className="w-4 h-4" /> Working Days *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => {
                    const isSelected = form.workingDays.includes(day);
                    return (
                      <motion.button
                        key={day}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleDay(day)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                          isSelected ? theme.daySelected : theme.dayUnselected
                        }`}
                      >
                        {day}
                      </motion.button>
                    );
                  })}
                </div>
                {errors.workingDays && <p className="text-xs text-red-400 mt-2">{errors.workingDays[0]}</p>}
              </div>

              {/* 🖼️ Profile Image */}
              <div>
                <label className={`block text-sm mb-2 ${theme.label}`}>Profile Picture</label>
                <ImageUploader 
                  onUploadSuccess={({ imageUrl }) => setForm(p => ({ ...p, profileImage: imageUrl }))}
                  currentImage={form.profileImage}
                  folderType="avatars"
                />
              </div>

              {/* 🔘 Status Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className={`text-sm ${theme.label}`}>Account Status</span>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`w-12 h-6 rounded-full transition relative ${form.isActive ? theme.toggleOn : theme.toggleOff}`}
                >
                  <div className={`w-4 h-4 ${theme.toggleKnob} rounded-full absolute top-1 transition ${form.isActive ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {/* 🎯 Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-5 py-2.5 rounded-xl border border-white/10 ${theme.label} hover:bg-white/5 transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonPrimary} rounded-xl font-medium transition active:scale-95 disabled:opacity-50`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
