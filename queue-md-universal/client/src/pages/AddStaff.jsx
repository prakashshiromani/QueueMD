import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2, UserPlus, Calendar, Phone, Building2, Clock, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { staffApi } from "../services/staffApi";
import ImageUploader from "../components/ui/ImageUploader";
import { useFacilityStore } from "../store/facilityStore";
import { useAuthStore } from "../store/authStore";
import { getFacilityConfig, FACILITY_TYPES } from "../utils/facilityTypeConfig";

// Helper to convert hex to RGB string
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFTS = [
  "09:00 AM - 05:00 PM",
  "10:00 AM - 06:00 PM",
  "08:00 AM - 04:00 PM",
  "12:00 PM - 08:00 PM",
  "Custom"
];

export default function AddStaff() {
  const navigate = useNavigate();
  const { facilityType: uiFacilityType } = useFacilityStore();
  const { user } = useAuthStore();
  // Default to UI facility type, or fall back to user's account type
  const defaultDept = uiFacilityType || user?.facilityType || 'clinic';
  const config = getFacilityConfig(uiFacilityType);
  const primaryRgb = hexToRgb(config.theme.primary);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "receptionist",
    facilityType: defaultDept,  // ✅ Department the staff belongs to
    specialization: "",
    phone: "",
    shift: "09:00 AM - 05:00 PM",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    profileImage: ""
  });

  const handleToggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error("Name, Email & Password are required");
    }
    if (!formData.facilityType) {
      return toast.error("Please select a department");
    }
    if (formData.workingDays.length === 0) {
      return toast.error("Select at least one working day");
    }
    if (formData.phone && formData.phone.length !== 10) {
      return toast.error("Phone number must be exactly 10 digits");
    }

    setLoading(true);
    try {
      await staffApi.create(formData);
      toast.success("Staff member added successfully! 🎉");
      navigate("/staff");
    } catch (error) {
      const data = error.response?.data;
      // ⭐ Pro upgrade gate
      if (error.response?.status === 403 && data?.upgradeRequired) {
        toast.error(`⭐ ${data.message || 'Staff limit reached! Upgrade to Pro for unlimited staff.'}`);
        setTimeout(() => navigate("/settings?tab=subscription"), 1500);
      } else {
        toast.error(data?.message || "Failed to add staff");
      }
    } finally {
      setLoading(false);
    }
  };

  const isDark = document.documentElement.classList.contains("dark");
  
  const theme = {
    bg: isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-black" : "bg-gradient-to-br from-slate-100 via-slate-50 to-white",
    cardBg: isDark ? "bg-white/5 backdrop-blur-xl border border-white/10" : "bg-white border border-gray-200 shadow-sm",
    text: isDark ? "text-white" : "text-slate-900",
    label: isDark ? "text-white/60" : "text-slate-600",
    inputBg: isDark ? "bg-black/30 border-white/10" : "bg-gray-50 border-gray-200",
    inputText: isDark ? "text-white" : "text-slate-900",
    optionBg: isDark ? "bg-slate-800" : "bg-white",
    closeBtn: isDark ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-slate-800",
    dayUnselected: isDark ? "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10" : "bg-gray-100 text-slate-700 hover:bg-gray-200 border border-gray-200"
  };

  return (
    <div 
      className={`min-h-screen ${theme.bg} p-4 md:p-8 transition-colors duration-300`}
      style={{
        '--theme-primary': config.theme.primary,
        '--theme-primary-rgb': primaryRgb,
        '--theme-secondary': config.theme.secondary
      }}
    >
      <div className="max-w-3xl mx-auto">
        
        {/* 🎯 Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate("/staff")}
            className={`p-2 rounded-xl ${theme.closeBtn} border transition`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>Add New Staff</h1>
        </div>

        {/* 📝 Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 👤 Personal Details */}
          <div className={`${theme.cardBg} rounded-2xl p-6`}>
            <h2 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
              <UserPlus className="w-5 h-5 text-blue-400" /> Personal Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm ${theme.label} mb-1`}>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                  placeholder="Dr. Rajesh Kumar"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm ${theme.label} mb-1`}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                  placeholder="rajesh@queuemd.com"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm ${theme.label} mb-1`}>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm ${theme.label} mb-1`}>Phone (10 digits)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 10) setFormData(p => ({ ...p, phone: val }));
                  }}
                  maxLength="10"
                  className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                  placeholder="9876543210"
                />
              </div>
            </div>
          </div>

          {/* 🏥 Professional Details */}
          <div className={`${theme.cardBg} rounded-2xl p-6`}>
            <h2 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
              <Building2 className="w-5 h-5" style={{ color: config.theme.primary }} /> Professional Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">

              {/* 🏛️ Department — REQUIRED */}
              <div className="md:col-span-2">
                <label className={`block text-sm ${theme.label} mb-1 font-semibold`}>
                  Department <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.facilityType}
                  onChange={(e) => setFormData(p => ({ ...p, facilityType: e.target.value }))}
                  className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                  required
                >
                  <option value="" className={theme.optionBg}>⚠️ Select Department</option>
                  {Object.entries(FACILITY_TYPES).map(([key, cfg]) => (
                    <option key={key} value={key} className={theme.optionBg}>
                      {cfg.icon} {cfg.label}
                    </option>
                  ))}
                </select>
                <p className={`text-xs ${theme.label} mt-1 opacity-70`}>
                  This staff member will appear in the selected department's doctor list.
                </p>
              </div>

              <div>
                <label className={`block text-sm ${theme.label} mb-1`}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                  className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all [&>option]:${theme.optionBg}`}
                >
                  <option value="receptionist" className={theme.optionBg}>Receptionist</option>
                  <option value="doctor" className={theme.optionBg}>Doctor</option>
                  <option value="nurse" className={theme.optionBg}>Nurse</option>
                  <option value="lab_tech" className={theme.optionBg}>Lab Technician</option>
                  <option value="admin" className={theme.optionBg}>Admin</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm ${theme.label} mb-1`}>Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData(p => ({ ...p, specialization: e.target.value }))}
                  className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                  placeholder="e.g., Cardiology, Dental"
                />
              </div>
              <div className="md:col-span-2">
                <label className={`block text-sm ${theme.label} mb-1 flex items-center gap-2`}>
                  <Clock className="w-4 h-4" /> Shift Timing
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData(p => ({ ...p, shift: e.target.value }))}
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
          <div className={`${theme.cardBg} rounded-2xl p-6`}>
            <h2 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
              <Calendar className="w-5 h-5 text-green-400" /> Working Days
            </h2>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => {
                const isSelected = formData.workingDays.includes(day);
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
            {formData.workingDays.length === 0 && (
              <p className="text-sm text-red-400 mt-2">⚠️ Select at least one working day</p>
            )}
          </div>

          {/* 🖼️ Profile Image (Optional) */}
          <div className={`${theme.cardBg} rounded-2xl p-6`}>
            <label className={`block text-sm ${theme.label} mb-2`}>Profile Picture</label>
            <ImageUploader 
              onUploadSuccess={({ imageUrl }) => setFormData(p => ({ ...p, profileImage: imageUrl }))}
              currentImage={formData.profileImage}
              folderType="avatars"
            />
          </div>

          {/* 🎯 Submit */}
          <div className="flex justify-end gap-4 pt-4 pb-20">
            <button
              type="button"
              onClick={() => navigate("/staff")}
              className={`px-6 py-2.5 rounded-xl border border-white/10 ${theme.label} hover:bg-white/5 transition`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.workingDays.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-medium transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {loading ? "Creating..." : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
