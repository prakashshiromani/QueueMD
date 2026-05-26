import { useState, useEffect } from "react";
import { FACILITY_TYPES } from "../utils/facilityTypeConfig";
import { useFacilityStore } from "../store/facilityStore";
import { staffApi } from "../services/staffApi";

// Helper to convert hex to RGB string
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '37, 99, 235';
}

export default function AddPatientModal({ isOpen, onClose, onSubmit, loading }) {
  const { facilityType: globalFacilityType } = useFacilityStore();
  
  const [formData, setFormData] = useState({
    patientName: "",
    phone: "",
    email: "",
    facilityType: "",  // Empty by default - user MUST select explicitly
    doctorName: "",
    visitDate: `${new Date().getDate().toString().padStart(2, '0')}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}`,
    visitTime: `${(new Date().getHours() % 12 || 12).toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
    visitTimePeriod: new Date().getHours() >= 12 ? "PM" : "AM",
    status: "active",
    visitFees: "",
    customData: {}
  });

  const [errors, setErrors] = useState({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Derived state: Filter doctors by selected facilityType
  const filteredDoctors = formData.facilityType
    ? doctors.filter(d => d.facilityType === formData.facilityType)
    : doctors;

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await staffApi.getAll();
        const staffList = res.data || res.users || [];
        const activeDoctors = staffList.filter(s => s.role === "doctor" && s.isActive);
        setDoctors(activeDoctors);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoadingDoctors(false);
      }
    };

    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  // Get facility config
  const activeFacilityType = formData.facilityType || globalFacilityType || 'clinic';
  const config = FACILITY_TYPES[activeFacilityType] || FACILITY_TYPES.clinic;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setFormData({
        patientName: "",
        phone: "+91 ",
        email: "",
        facilityType: "", // Always reset to empty - force explicit selection
        doctorName: "",
        visitDate: `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`,
        visitTime: `${(now.getHours() % 12 || 12).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        visitTimePeriod: now.getHours() >= 12 ? "PM" : "AM",
        status: "active",
        visitFees: "",
        customData: {}
      });
      setErrors({});
    }
  }, [isOpen]);

  // Validate form
  const validate = () => {
    const newErrors = {};
    if (!formData.patientName.trim()) newErrors.patientName = "Patient name is required";
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Valid phone number is required";
    }
    if (!formData.facilityType) newErrors.facilityType = "Please select a facility type";
    if (!formData.visitDate) newErrors.visitDate = "Visit date is required";
    if (!formData.visitTime) newErrors.visitTime = "Visit time is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Combine time and period before submitting
    const finalFormData = {
      ...formData,
      visitTime: `${formData.visitTime} ${formData.visitTimePeriod}`,
      visitFees: formData.visitFees ? parseFloat(formData.visitFees) : null,
    };
    
    await onSubmit(finalFormData);
  };

  // Trigger native picker
  const triggerPicker = (id) => {
    try {
      const input = document.getElementById(id);
      if (input && input.showPicker) {
        input.showPicker();
      } else if (input) {
        input.click();
      }
    } catch (err) {
      console.error("Picker error:", err);
    }
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value,
      // Clear customData & doctorName if facilityType changes
      ...(field === "facilityType" ? { customData: value === "pathlab" ? { sampleId: "SAM-" } : {}, doctorName: "" } : {})
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle Custom Field Change (e.g., Sample ID)
  const handleCustomChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      customData: { ...prev.customData, [name]: value }
    }));
  };

  // Format phone number (Indian format)
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.startsWith("91")) {
      const sliced = numbers.slice(2);
      return `+91 ${sliced.slice(0, 5)}${sliced.length > 5 ? ' ' + sliced.slice(5, 10) : sliced.slice(5)}`;
    }
    if (numbers.length > 0) {
      return `+91 ${numbers.slice(0, 5)}${numbers.length > 5 ? ' ' + numbers.slice(5, 10) : numbers.slice(5)}`;
    }
    return "+91 ";
  };

  // Format Date (DD-MM-YYYY)
  const formatDateInput = (value) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    if (numbers.length > 0) {
      formatted += numbers.slice(0, 2);
      if (numbers.length >= 2) {
        if (numbers.length > 2) formatted += "-";
        formatted += numbers.slice(2, 4);
        if (numbers.length >= 4) {
          if (numbers.length > 4) formatted += "-";
          formatted += numbers.slice(4, 8);
        }
      }
    }
    return formatted;
  };

  // Format Time (HH:MM) - 12 Hour Format
  const formatTimeInput = (value) => {
    const numbers = value.replace(/\D/g, "").slice(0, 4);
    let formatted = "";
    if (numbers.length > 0) {
      let h = numbers.slice(0, 2);
      if (h.length === 2) {
        if (parseInt(h) > 12) h = "12";
        if (parseInt(h) === 0) h = "12";
      }
      formatted += h;
      if (numbers.length > 2) {
        let m = numbers.slice(2, 4);
        if (m.length === 2 && parseInt(m) > 59) m = "59";
        formatted += ":" + m;
      }
    }
    return formatted;
  };

  // Sync native picker value to formatted text
  const syncPickerValue = (field, rawValue) => {
    if (!rawValue) return;
    if (field === "visitDate") {
      // YYYY-MM-DD -> DD-MM-YYYY
      const parts = rawValue.split("-");
      if (parts.length === 3) {
        const [y, m, d] = parts;
        handleChange("visitDate", `${d}-${m}-${y}`);
      }
    } else if (field === "visitTime") {
      // HH:MM (24h) -> HH:MM AM/PM
      const [h24, m] = rawValue.split(":");
      const hourNum = parseInt(h24, 10);
      const period = hourNum >= 12 ? "PM" : "AM";
      const h12 = (hourNum % 12 || 12).toString().padStart(2, '0');
      handleChange("visitTime", `${h12}:${m}`);
      handleChange("visitTimePeriod", period);
    } else {
      handleChange(field, rawValue);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* ✅ MODAL CONTAINER - Flex Layout Fix */}
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-bg-secondary rounded-2xl border border-border-muted/50 shadow-2xl overflow-hidden"
        style={{
          '--theme-primary': config.theme.primary,
          '--theme-primary-rgb': hexToRgb(config.theme.primary),
          '--theme-secondary': config.theme.secondary
        }}
      >
          
          {/* 1️⃣ FIXED HEADER (Scroll nahi hoga) */}
          <div className="shrink-0 bg-bg-secondary/95 backdrop-blur-md border-b border-border-muted/50 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `rgba(var(--theme-primary-rgb), 0.1)`,
                  color: 'var(--theme-primary)'
                }}
              >
                <span className="material-symbols-outlined text-2xl">
                  person_add
                </span>
              </div>
              <div>
                <h2 className="text-xl font-black text-text-primary">
                  New Patient Entry
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Add record to central directory
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-variant text-text-secondary hover:text-text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* 2️⃣ SCROLLABLE BODY (Yahan content cut nahi hoga) */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <form id="add-patient-form" onSubmit={handleSubmit} className="space-y-6">
            
              {/* 👤 Patient Personal Details Section */}
              <div className="bg-bg-primary/20 backdrop-blur-xl border border-border-muted/30 rounded-2xl p-5 md:p-6 shadow-sm">
                <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                  <span 
                    className="material-symbols-outlined text-xl"
                    style={{ color: 'var(--theme-primary)' }}
                  >
                    person
                  </span>
                  Personal Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary pl-1 mb-1.5 font-medium">
                      Patient Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.patientName}
                      onChange={(e) => handleChange("patientName", e.target.value)}
                      placeholder="Search or enter name"
                      className={`w-full h-[50px] bg-bg-primary border rounded-xl px-4 text-[14px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 transition-all ${
                        errors.patientName 
                          ? "border-red-500/50 focus:border-red-500" 
                          : "border-border-muted/50 focus:border-[var(--theme-primary)]/50"
                      }`}
                    />
                    {errors.patientName && (
                      <p className="text-xs text-red-400 mt-1">{errors.patientName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary pl-1 mb-1.5 font-medium">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", formatPhone(e.target.value))}
                      placeholder="+91 98765 43210"
                      className={`w-full h-[50px] bg-bg-primary border rounded-xl px-4 text-[14px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 transition-all ${
                        errors.phone 
                          ? "border-red-500/50 focus:border-red-500" 
                          : "border-border-muted/50 focus:border-[var(--theme-primary)]/50"
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-text-secondary pl-1 mb-1.5 font-medium">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="patient@email.com"
                      className="w-full h-[50px] bg-bg-primary border border-border-muted/50 rounded-xl px-4 text-[14px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 🏥 Visit & Assignment Details Section */}
              <div className="bg-bg-primary/20 backdrop-blur-xl border border-border-muted/30 rounded-2xl p-5 md:p-6 shadow-sm">
                <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                  <span 
                    className="material-symbols-outlined text-xl"
                    style={{ color: 'var(--theme-secondary)' }}
                  >
                    medical_services
                  </span>
                  Visit & Assignment Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-secondary pl-1 mb-1.5 font-medium">
                      Facility Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.facilityType}
                        onChange={(e) => handleChange("facilityType", e.target.value)}
                        className={`w-full h-[50px] bg-bg-primary border rounded-xl px-4 pr-10 text-[14px] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all cursor-pointer ${
                          !formData.facilityType
                            ? "border-red-500/50 text-text-secondary/60"
                            : errors.facilityType
                            ? "border-red-500/50 text-text-primary"
                            : "border-border-muted/50 text-text-primary"
                        }`}
                      >
                        <option value="" disabled>⚠️ Select Department / Facility Type</option>
                        {Object.entries(FACILITY_TYPES).map(([type, cfg]) => (
                          <option key={type} value={type}>
                            {cfg.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-xl pointer-events-none">
                        expand_more
                      </span>
                    </div>
                    {errors.facilityType && (
                      <p className="text-xs text-red-400 mt-1">{errors.facilityType}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-text-secondary pl-1 mb-1.5 font-medium">
                        Assign Doctor
                      </label>
                      <div className="relative">
                        <select
                          value={formData.doctorName}
                          onChange={(e) => handleChange("doctorName", e.target.value)}
                          disabled={!formData.facilityType}
                          className="w-full h-[50px] bg-bg-primary border border-border-muted/50 rounded-xl px-4 pr-10 text-[14px] text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Doctor (Optional)</option>
                          {loadingDoctors ? (
                            <option disabled>Loading doctors...</option>
                          ) : filteredDoctors.length === 0 ? (
                            <option disabled>No active doctors found for this department</option>
                          ) : (
                            filteredDoctors.map((doc) => (
                              <option key={doc._id} value={doc.name}>
                                {doc.name} {doc.specialization ? `(${doc.specialization})` : ""}
                              </option>
                            ))
                          )}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-xl pointer-events-none">
                          expand_more
                        </span>
                      </div>
                      {formData.facilityType && filteredDoctors.length === 0 && (
                        <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1 pl-1">
                          <span className="material-symbols-outlined text-[14px] leading-none">warning</span>
                          No doctors registered for this department
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-text-secondary pl-1 mb-1.5 font-medium">
                        Visit Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={formData.visitDate}
                          onChange={(e) => handleChange("visitDate", formatDateInput(e.target.value))}
                          placeholder="DD-MM-YYYY"
                          maxLength={10}
                          className={`w-full h-[50px] bg-bg-primary border rounded-xl px-4 pr-12 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 transition-all ${
                            errors.visitDate 
                              ? "border-red-500/50 focus:border-red-500" 
                              : "border-border-muted/50 focus:border-[var(--theme-primary)]/50"
                          }`}
                        />
                        {/* Hidden Native Picker */}
                        <input 
                          type="date"
                          id="native-date-picker"
                          className="absolute opacity-0 pointer-events-none"
                          onChange={(e) => syncPickerValue("visitDate", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => triggerPicker("native-date-picker")}
                          className="absolute right-0 top-0 h-full px-4 text-text-secondary hover:text-[var(--theme-primary)] transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">calendar_today</span>
                        </button>
                      </div>
                      {errors.visitDate && (
                        <p className="text-xs text-red-400 mt-1">{errors.visitDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-text-secondary pl-1 mb-1.5 font-medium">
                        Visit Time <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group flex items-center">
                        <input
                          type="text"
                          value={formData.visitTime}
                          onChange={(e) => handleChange("visitTime", formatTimeInput(e.target.value))}
                          placeholder="HH:MM"
                          maxLength={5}
                          className={`w-full h-[50px] bg-bg-primary border border-r-0 rounded-l-xl px-4 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 transition-all ${
                            errors.visitTime 
                              ? "border-red-500/50 focus:border-red-500 z-10" 
                              : "border-border-muted/50 focus:border-[var(--theme-primary)]/50 z-10"
                          }`}
                        />
                        <select
                          value={formData.visitTimePeriod}
                          onChange={(e) => handleChange("visitTimePeriod", e.target.value)}
                          className={`h-[50px] bg-bg-secondary border border-l-0 border-r-0 px-2 text-[13px] font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 transition-all appearance-none cursor-pointer hover:text-[var(--theme-primary)] ${
                            errors.visitTime ? "border-red-500/50" : "border-border-muted/50"
                          }`}
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                        <div className={`h-[50px] bg-bg-secondary border border-l-0 rounded-r-xl pr-2 flex items-center relative ${
                            errors.visitTime ? "border-red-500/50" : "border-border-muted/50"
                          }`}>
                          <button
                            type="button"
                            onClick={() => setShowTimePicker(!showTimePicker)}
                            className="h-full px-3 text-text-secondary hover:text-[var(--theme-primary)] transition-colors flex items-center relative z-20"
                          >
                            <span className="material-symbols-outlined text-xl">schedule</span>
                          </button>
                          
                          {/* 🔥 Premium Custom Time Picker Popover */}
                          {showTimePicker && (
                            <>
                              <div className="fixed inset-0 z-[160]" onClick={() => setShowTimePicker(false)} />
                              <div className="absolute top-[110%] right-0 z-[170] w-[260px] bg-bg-secondary border border-border-muted/50 rounded-2xl shadow-2xl p-3 flex gap-2 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                                 
                                 {/* Hours Column */}
                                 <div className="flex-1 h-[200px] overflow-y-auto custom-scrollbar bg-bg-primary/50 rounded-xl border border-border-muted/30">
                                   {Array.from({length: 12}).map((_, i) => {
                                     const hr = (i+1).toString().padStart(2, '0');
                                     const isSelected = formData.visitTime.split(':')[0] === hr;
                                     return (
                                       <div 
                                         key={hr} 
                                         onClick={() => handleChange("visitTime", `${hr}:${formData.visitTime.split(':')[1] || '00'}`)}
                                         className={`py-2.5 text-center text-[13px] font-black cursor-pointer transition-all select-none rounded-lg mx-1 my-1 ${isSelected ? 'text-white shadow-md' : 'hover:bg-surface-variant text-text-primary hover:rounded-lg'}`}
                                         style={isSelected ? { backgroundColor: 'var(--theme-primary)' } : {}}
                                       >
                                         {hr}
                                       </div>
                                     )
                                   })}
                                 </div>

                                 {/* Minutes Column (Step by 5) */}
                                 <div className="flex-1 h-[200px] overflow-y-auto custom-scrollbar bg-bg-primary/50 rounded-xl border border-border-muted/30">
                                   {Array.from({length: 12}).map((_, i) => {
                                     const min = (i*5).toString().padStart(2, '0');
                                     const isSelected = formData.visitTime.split(':')[1] === min;
                                     return (
                                       <div 
                                         key={min} 
                                         onClick={() => handleChange("visitTime", `${formData.visitTime.split(':')[0] || '12'}:${min}`)}
                                         className={`py-2.5 text-center text-[13px] font-black cursor-pointer transition-all select-none rounded-lg mx-1 my-1 ${isSelected ? 'text-white shadow-md' : 'hover:bg-surface-variant text-text-primary hover:rounded-lg'}`}
                                         style={isSelected ? { backgroundColor: 'var(--theme-primary)' } : {}}
                                       >
                                         {min}
                                       </div>
                                     )
                                   })}
                                 </div>

                                 {/* AM/PM Column */}
                                 <div className="flex-1 h-[200px] flex flex-col gap-2">
                                   {["AM", "PM"].map((period) => {
                                     const isSelected = formData.visitTimePeriod === period;
                                     return (
                                       <div 
                                         key={period} 
                                         onClick={() => {
                                           handleChange("visitTimePeriod", period);
                                           setShowTimePicker(false); // Close when period is selected
                                         }}
                                         className={`flex-1 flex items-center justify-center text-[14px] font-black cursor-pointer transition-all rounded-xl border select-none ${isSelected ? 'text-white border-[var(--theme-primary)] shadow-md' : 'bg-bg-primary/50 text-text-secondary border-border-muted/30 hover:bg-surface-variant hover:text-text-primary'}`}
                                         style={isSelected ? { backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}
                                       >
                                         {period}
                                       </div>
                                     )
                                   })}
                                 </div>

                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {errors.visitTime && (
                        <p className="text-xs text-red-400 mt-1">{errors.visitTime}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 🔥 DYNAMIC FACILITY-SPECIFIC FIELDS 🔥 */}
              {config.customFields && config.customFields.length > 0 && (
                <div className="bg-bg-primary/20 backdrop-blur-xl border border-border-muted/30 rounded-2xl p-5 md:p-6 shadow-sm">
                  <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span 
                      className="material-symbols-outlined text-xl"
                      style={{ color: 'var(--theme-primary)' }}
                    >
                      {formData.facilityType === 'pathlab' ? 'science' : formData.facilityType === 'dental' ? 'dentistry' : 'category'}
                    </span>
                    {config.label} Specific Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.customFields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm text-text-secondary pl-1 mb-1.5 font-medium">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        
                        {field.type === "select" ? (
                          <div className="relative">
                            <select
                              value={formData.customData[field.name] || ""}
                              onChange={(e) => handleCustomChange(field.name, e.target.value)}
                              className="w-full h-[50px] bg-bg-primary border border-border-muted/50 rounded-xl px-4 pr-10 text-[14px] text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all"
                            >
                              <option value="">Select {field.label}</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-xl pointer-events-none">expand_more</span>
                          </div>
                        ) : (
                          <input
                            type={field.type || "text"}
                            value={formData.customData[field.name] || ""}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (field.name === "sampleId") {
                                if (!val.startsWith("SAM-")) {
                                  if ("SAM-".startsWith(val)) {
                                    val = "SAM-";
                                  } else {
                                    val = "SAM-" + val.replace(/^SAM-?/i, "");
                                  }
                                }
                              }
                              handleCustomChange(field.name, val);
                            }}
                            placeholder={field.placeholder || `Enter ${field.label}`}
                            className="w-full h-[50px] bg-bg-primary border border-border-muted/50 rounded-xl px-4 text-[14px] text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 💳 Billing Section */}
              <div className="bg-bg-primary/20 backdrop-blur-xl border border-border-muted/30 rounded-2xl p-5 md:p-6 shadow-sm">
                <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: 'var(--theme-primary)' }}
                  >
                    receipt_long
                  </span>
                  Billing
                  <span className="ml-auto text-[11px] font-semibold text-text-secondary/60 normal-case tracking-normal">Optional</span>
                </h3>

                <div>
                  <label className="block text-sm text-text-secondary pl-1 mb-1.5 font-medium">
                    Visit Fees (₹)
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-black"
                      style={{ color: 'var(--theme-primary)' }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.visitFees}
                      onChange={(e) => handleChange("visitFees", e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full h-[50px] bg-bg-primary border border-border-muted/50 rounded-xl pl-9 pr-4 text-[14px] text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-text-secondary/50 mt-1.5 pl-1">
                    If entered, an invoice will be auto-created in Billing for this patient.
                  </p>
                </div>
              </div>

              {/* Status Badge (Auto-set to Active) */}
              <div className="mb-2 pl-1">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="font-bold">Patient Status:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase border text-green-400 bg-green-400/10 border-green-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                    Active (Auto)
                  </span>
                </div>
              </div>

            </form>
          </div>

          {/* 3️⃣ FIXED FOOTER (Scroll nahi hoga) */}
          <div className="shrink-0 px-6 py-5 border-t border-border-muted/50 flex items-center gap-3 bg-bg-secondary">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 h-[50px] rounded-xl bg-bg-primary border border-border-muted/50 text-text-secondary font-bold text-[14px] hover:text-text-primary hover:bg-surface-variant transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-patient-form"
                disabled={loading || !formData.facilityType}
                className="flex-[2] h-[50px] rounded-xl text-white font-bold text-[14px] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={formData.facilityType ? { 
                  backgroundColor: 'var(--theme-primary)',
                  boxShadow: `0 4px 14px rgba(var(--theme-primary-rgb), 0.4)`
                } : {
                  backgroundColor: "#475569"
                }}
                onMouseEnter={(e) => {
                  if (formData.facilityType) {
                    e.currentTarget.style.backgroundColor = config.theme.secondary || config.theme.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (formData.facilityType) {
                    e.currentTarget.style.backgroundColor = config.theme.primary;
                  }
                }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">
                      progress_activity
                    </span>
                    Registering...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">
                      person_add
                    </span>
                    {formData.facilityType ? `Register ${FACILITY_TYPES[formData.facilityType].label}` : "Select Facility Type"}
                  </>
                )}
              </button>
          </div>
        </div>
    </div>
  );
}
