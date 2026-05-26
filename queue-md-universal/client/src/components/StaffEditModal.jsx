import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Calendar, Phone, Building2, Clock, User } from "lucide-react";
import { z } from "zod";
import toast from "react-hot-toast";
import ImageUploader from "./ui/ImageUploader";
import { useFacilityStore } from "../store/facilityStore";
import { getFacilityConfig } from "../utils/facilityTypeConfig";

// Helper to convert hex to RGB string
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
}

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
  const { facilityType } = useFacilityStore();
  const config = getFacilityConfig(facilityType);
  const primaryRgb = hexToRgb(config.theme.primary);

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
    overlay: "bg-black/60 backdrop-blur-md",
    modalBg: "bg-bg-secondary border border-border-muted/50 shadow-2xl",
    text: "text-text-primary",
    label: "text-text-secondary",
    inputBg: "bg-bg-primary border border-border-muted/50",
    inputText: "text-text-primary",
    optionBg: "bg-bg-secondary text-text-primary",
    toggleOn: "bg-emerald-500",
    toggleOff: "bg-surface-variant border border-border-muted/50",
    toggleKnob: "bg-bg-secondary shadow-md",
    closeBtn: "hover:bg-surface-variant text-text-secondary hover:text-text-primary",
    dayUnselected: "bg-bg-primary text-text-secondary hover:bg-surface-variant border border-border-muted/50"
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
            style={{
              '--theme-primary': config.theme.primary,
              '--theme-primary-rgb': primaryRgb,
              '--theme-secondary': config.theme.secondary
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-inherit p-6 border-b border-border-muted/50 flex justify-between items-center z-10">
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
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                    />
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name[0]}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${theme.label}`}>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
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
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                      placeholder="9876543210"
                    />
                    {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone[0]}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${theme.label}`}>Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all [&>option]:${theme.optionBg}`}
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
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
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
                      className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all [&>option]:${theme.optionBg}`}
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
                          isSelected ? "text-white shadow-lg" : theme.dayUnselected
                        }`}
                        style={isSelected ? {
                          backgroundColor: config.theme.primary,
                          boxShadow: `0 10px 15px -3px rgba(${primaryRgb}, 0.3), 0 4px 6px -4px rgba(${primaryRgb}, 0.3)`
                        } : {}}
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
                  className={`w-12 h-6 rounded-full transition relative flex items-center ${form.isActive ? theme.toggleOn : theme.toggleOff}`}
                >
                  <div className={`w-4 h-4 ${theme.toggleKnob} rounded-full absolute transition-all duration-200 ${form.isActive ? "left-[26px]" : "left-1"}`} />
                </button>
              </div>

              {/* 🎯 Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border-muted/50">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-5 py-2.5 rounded-xl border border-border-muted/50 ${theme.label} hover:bg-surface-variant transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-medium transition active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: config.theme.primary,
                    boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = config.theme.secondary || config.theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = config.theme.primary;
                  }}
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
