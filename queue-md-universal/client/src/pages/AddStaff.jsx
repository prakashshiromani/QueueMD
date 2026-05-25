import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2, UserPlus, Calendar, Phone, Building2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { staffApi } from "../services/staffApi";
import ImageUploader from "../components/ui/ImageUploader";

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // ✅ Password field added
    role: "receptionist",
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
      toast.error(error.response?.data?.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* 🎯 Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate("/staff")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Add New Staff</h1>
        </div>

        {/* 📝 Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 👤 Personal Details */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" /> Personal Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Dr. Rajesh Kumar"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="rajesh@queuemd.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Phone (10 digits)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 10) setFormData(p => ({ ...p, phone: val }));
                  }}
                  maxLength="10"
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="9876543210"
                />
              </div>
            </div>
          </div>

          {/* 🏥 Professional Details */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" /> Professional Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="receptionist" className="bg-slate-800">Receptionist</option>
                  <option value="doctor" className="bg-slate-800">Doctor</option>
                  <option value="nurse" className="bg-slate-800">Nurse</option>
                  <option value="lab_tech" className="bg-slate-800">Lab Technician</option>
                  <option value="admin" className="bg-slate-800">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData(p => ({ ...p, specialization: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g., Cardiology, Dental"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/60 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Shift Timing
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData(p => ({ ...p, shift: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {SHIFTS.map(shift => (
                    <option key={shift} value={shift} className="bg-slate-800">{shift}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 📅 Working Days */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
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
                      isSelected 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                        : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                    }`}
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
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
            <label className="block text-sm text-white/60 mb-2">Profile Picture</label>
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
              className="px-6 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.workingDays.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
