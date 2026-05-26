import { useState, useEffect } from "react";
import { useFacilityStore } from "../../store/facilityStore";
import { FACILITY_TYPES } from "../../utils/facilityTypeConfig";
import { staffApi } from "../../services/staffApi";
import toast from "react-hot-toast";

// Helper to convert hex to RGB string
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '37, 99, 235';
}

export default function AppointmentModal({ isOpen, onClose, onSubmit, onDelete, appointment, selectedDate }) {
  const { facilityType: globalFacilityType } = useFacilityStore();
  
  const [form, setForm] = useState({ 
    patientName: "", 
    phone: "", 
    email: "", 
    appointmentDate: "", 
    startTime: "", 
    endTime: "", 
    appointmentType: "clinic", 
    doctorName: "", 
    notes: "",
    visitFees: "",
    customData: {}
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Get current facility config for theme/icons
  const config = FACILITY_TYPES[form.appointmentType] || FACILITY_TYPES.clinic;

  // Derived state: Filter doctors by selected facilityType
  const filteredDoctors = form.appointmentType
    ? doctors.filter(d => d.facilityType === form.appointmentType)
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

  useEffect(() => {
    if (appointment) {
      setForm({ 
        patientName: appointment.patientName, 
        phone: appointment.phone || appointment.patientPhone || "", 
        email: appointment.email || appointment.patientEmail || "", 
        appointmentDate: new Date(appointment.appointmentDate).toISOString().split("T")[0], 
        startTime: appointment.startTime, 
        endTime: appointment.endTime, 
        appointmentType: appointment.appointmentType || "clinic", 
        doctorName: appointment.doctorName || "", 
        notes: appointment.notes || appointment.specialNotes || "",
        visitFees: appointment.visitFees !== undefined && appointment.visitFees !== null ? appointment.visitFees.toString() : "",
        customData: appointment.customData || {}
      });
    } else {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      
      const startTime = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`;
      
      // Auto-suggest end time (+30 mins)
      const end = new Date(now.getTime() + 30 * 60000);
      const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

      setForm({
        patientName: "",
        phone: "",
        email: "",
        appointmentDate: selectedDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        startTime,
        endTime,
        appointmentType: "clinic",
        doctorName: "",
        notes: "",
        visitFees: "",
        customData: {}
      });
    }
  }, [appointment, selectedDate, isOpen]);

  // Escape key and scroll lock
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const calculateEndTime = (start, mins) => {
    if (!start) return "";
    const [h, m] = start.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m + mins);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleStartTimeChange = (val) => {
    const newEnd = calculateEndTime(val, 30);
    setForm(prev => ({ ...prev, startTime: val, endTime: newEnd }));
  };

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

  const validate = () => {
    const e = {};
    if (!form.patientName.trim()) e.patientName = "Patient name is required";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) {
      e.phone = "Valid 10-digit phone number is required";
    }
    if (!form.appointmentDate) e.appointmentDate = "Date is required";
    if (!form.startTime) e.startTime = "Start time is required";
    if (!form.endTime) e.endTime = "End time is required";
    
    // Time validation
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      e.endTime = "End time must be after start time";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    
    try { 
      setLoading(true); 
      const payload = { 
        ...form, 
        facilityType: globalFacilityType || "clinic",
        visitFees: form.visitFees ? parseFloat(form.visitFees) : null
      };
      await onSubmit(payload); 
      onClose(); 
    } catch(err) { 
      const message = err.response?.data?.message || "Failed to save appointment";
      toast.error(message);
      setErrors({ submit: message }); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full h-[50px] bg-bg-primary border border-border-muted/50 rounded-xl px-11 text-[14px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 focus:border-[var(--theme-primary)] transition-all shadow-sm";
  const labelCls = "text-[12px] font-black text-text-secondary uppercase tracking-widest mb-2 block pl-1";
  const iconCls = "material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] transition-colors group-focus-within:text-[var(--theme-primary)]";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-bg-secondary rounded-2xl border border-border-muted/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          '--theme-primary': config.theme.primary,
          '--theme-primary-rgb': hexToRgb(config.theme.primary),
          '--theme-secondary': config.theme.secondary
        }}
      >
        
        {/* Header */}
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
                {appointment ? "edit_calendar" : "calendar_add_on"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary">
                {appointment ? "Edit" : "New"} Appointment
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {appointment ? "Update existing schedule" : "Reserve a new time slot"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-variant text-text-secondary transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="appointment-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Patient Info Section Card */}
            <div className="bg-bg-primary/20 backdrop-blur-xl border border-border-muted/30 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[14px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <span className="w-6 h-[2px] rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
                Patient Details
              </h3>
              
              <div className="group relative">
                <label className={labelCls}>Full Name *</label>
                <div className="relative">
                  <span className={iconCls}>person</span>
                  <input 
                    value={form.patientName} 
                    onChange={e => setForm({ ...form, patientName: e.target.value })} 
                    className={`${inputCls} ${errors.patientName ? "border-red-500" : ""}`} 
                    placeholder="Patient Name" 
                  />
                </div>
                {errors.patientName && <p className="text-xs text-red-400 mt-1 pl-1">{errors.patientName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group relative">
                  <label className={labelCls}>Phone *</label>
                  <div className="relative">
                    <span className={iconCls}>call</span>
                    <input 
                      value={form.phone} 
                      onChange={e => setForm({ ...form, phone: formatPhone(e.target.value) })} 
                      className={`${inputCls} ${errors.phone ? "border-red-500" : ""}`} 
                      placeholder="+91 98765 43210" 
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-400 mt-1 pl-1">{errors.phone}</p>}
                </div>
                <div className="group relative">
                  <label className={labelCls}>Email Address</label>
                  <div className="relative">
                    <span className={iconCls}>mail</span>
                    <input 
                      value={form.email} 
                      onChange={e => setForm({ ...form, email: e.target.value })} 
                      className={inputCls} 
                      placeholder="mail@example.com" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Section Card */}
            <div className="bg-bg-primary/20 backdrop-blur-xl border border-border-muted/30 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[14px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <span className="w-6 h-[2px] rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
                Schedule Time
              </h3>

              <div className="group relative">
                <label className={labelCls}>Appointment Date *</label>
                <div className="relative">
                  <span className={iconCls}>calendar_today</span>
                  <input 
                    type="date" 
                    value={form.appointmentDate} 
                    onChange={e => setForm({ ...form, appointmentDate: e.target.value })} 
                    className={`${inputCls} ${errors.appointmentDate ? "border-red-500" : ""}`} 
                  />
                </div>
                {errors.appointmentDate && <p className="text-xs text-red-400 mt-1 pl-1">{errors.appointmentDate}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group relative">
                  <label className={labelCls}>Start Time *</label>
                  <div className="relative">
                    <span className={iconCls}>schedule</span>
                    <input 
                      type="time" 
                      value={form.startTime} 
                      onChange={e => handleStartTimeChange(e.target.value)} 
                      className={`${inputCls} ${errors.startTime ? "border-red-500" : ""}`} 
                    />
                  </div>
                </div>
                <div className="group relative">
                  <label className={labelCls}>End Time *</label>
                  <div className="relative">
                    <span className={iconCls}>timer</span>
                    <input 
                      type="time" 
                      value={form.endTime} 
                      onChange={e => setForm({ ...form, endTime: e.target.value })} 
                      className={`${inputCls} ${errors.endTime ? "border-red-500" : ""}`} 
                    />
                  </div>
                  {errors.endTime && <p className="text-xs text-red-400 mt-1 pl-1">{errors.endTime}</p>}
                </div>
              </div>
            </div>

            {/* Facility & Doctor Section Card */}
            <div className="bg-bg-primary/20 backdrop-blur-xl border border-border-muted/30 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[14px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <span className="w-6 h-[2px] rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
                Assigned Dept
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="group relative">
                  <label className={labelCls}>Appointment Type</label>
                  <div className="relative">
                    <span className={iconCls}>{config.icon.replace(/[^a-z0-9_]/gi, '') === '🏥' ? 'home_health' : config.icon === '🦷' ? 'dentistry' : config.icon === '🔬' ? 'science' : 'category'}</span>
                    <select 
                      value={form.appointmentType} 
                      onChange={e => setForm({ 
                        ...form, 
                        appointmentType: e.target.value,
                        customData: e.target.value === "pathlab" ? { sampleId: "SAM-" } : {}
                      })} 
                      className={`${inputCls} appearance-none cursor-pointer`}
                      style={{ borderColor: `${config.theme.primary}40` }}
                    >
                      {Object.entries(FACILITY_TYPES).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div className="group relative">
                  <label className={labelCls}>Assign Doctor</label>
                  <div className="relative">
                    <span className={iconCls}>medical_services</span>
                    <select 
                      value={form.doctorName} 
                      onChange={e => setForm({ ...form, doctorName: e.target.value })} 
                      className={`${inputCls} appearance-none cursor-pointer`}
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
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">expand_more</span>
                  </div>
                  {form.appointmentType && filteredDoctors.length === 0 && (
                    <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1 pl-1">
                      <span className="material-symbols-outlined text-[12px] leading-none">warning</span>
                      No doctors registered for this department
                    </p>
                  )}
                </div>
              </div>

              {/* Conditional Fields based on Appointment Type */}
              {(form.appointmentType === 'dental' || form.appointmentType === 'pathlab') && (
                <div className="p-4 bg-bg-primary border border-border-muted/30 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-[11px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    {config.label} Specific details
                  </p>
                  {form.appointmentType === 'dental' && (
                    <div className="group relative">
                      <input 
                        placeholder="Procedure (e.g. Root Canal)" 
                        className="w-full h-[44px] bg-bg-secondary border border-border-muted/50 rounded-lg px-4 text-[13px] text-text-primary focus:border-pink-500 transition-all outline-none" 
                        value={form.customData.procedure || ""}
                        onChange={e => setForm({ ...form, customData: { ...form.customData, procedure: e.target.value }})}
                      />
                    </div>
                  )}
                  {form.appointmentType === 'pathlab' && (
                    <div className="grid grid-cols-2 gap-3">
                       <input 
                        placeholder="Test Type (e.g. CBC, HbA1c, Urine)" 
                        className="w-full h-[44px] bg-bg-secondary border border-border-muted/50 rounded-lg px-4 text-[13px] text-text-primary focus:border-purple-500 transition-all outline-none" 
                        value={form.customData.testType || ""}
                        onChange={e => setForm({ ...form, customData: { ...form.customData, testType: e.target.value }})}
                      />
                      <input 
                        placeholder="Sample ID" 
                        className="w-full h-[44px] bg-bg-secondary border border-border-muted/50 rounded-lg px-4 text-[13px] text-text-primary focus:border-purple-500 transition-all outline-none" 
                        value={form.customData.sampleId || ""}
                        onChange={e => {
                          let val = e.target.value;
                          if (!val.startsWith("SAM-")) {
                            if ("SAM-".startsWith(val)) {
                              val = "SAM-";
                            } else {
                              val = "SAM-" + val.replace(/^SAM-?/i, "");
                            }
                          }
                          setForm({ ...form, customData: { ...form.customData, sampleId: val }});
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="group relative">
                <label className={labelCls}>Special Notes</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-4 text-text-secondary text-[20px]">sticky_note_2</span>
                  <textarea 
                    value={form.notes} 
                    onChange={e => setForm({ ...form, notes: e.target.value })} 
                    rows={3} 
                    className="w-full bg-bg-primary border border-border-muted/50 rounded-xl pl-11 pr-4 py-3 text-[14px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 focus:border-[var(--theme-primary)] transition-all resize-none shadow-sm" 
                    placeholder="Add any specific instructions or symptoms..."
                  />
                </div>
              </div>
            </div>

            {/* Billing Card (NEW SECTION) */}
            <div className="bg-bg-primary/20 backdrop-blur-xl border border-border-muted/30 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[14px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <span className="w-6 h-[2px] rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
                Billing
                <span className="ml-auto text-[11px] font-black tracking-widest uppercase border px-2 py-0.5 rounded-full" style={{ borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' }}>Optional</span>
              </h3>

              <div>
                <label className={labelCls}>Visit Fees (₹)</label>
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
                    value={form.visitFees}
                    onChange={(e) => setForm({ ...form, visitFees: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full h-[50px] bg-bg-primary border border-border-muted/50 rounded-xl pl-9 pr-4 text-[14px] text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 focus:border-[var(--theme-primary)] transition-all"
                  />
                </div>
                <p className="text-[11px] text-text-secondary/50 mt-1.5 pl-1">
                  If entered, an invoice will be auto-created in Billing for this patient.
                </p>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-5 border-t border-border-muted/50 bg-bg-secondary flex items-center gap-3">
          {/* DELETE BUTTON (Only in Edit mode) */}
          {appointment && (
            <button
              type="button"
              onClick={() => onDelete(appointment)}
              className="px-4 h-[50px] rounded-xl bg-red-600/10 border border-red-600/20 text-red-400 font-bold text-[14px] hover:bg-red-600/20 flex items-center gap-2 transition-all active:scale-[0.98] mr-auto"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </button>
          )}

          <button 
            type="button" 
            onClick={onClose} 
            className="w-[100px] h-[50px] rounded-xl bg-bg-primary border border-border-muted/50 text-[14px] font-bold text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="appointment-form"
            disabled={loading} 
            className="flex-1 h-[50px] rounded-xl text-white font-bold text-[14px] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: config.theme.primary,
              boxShadow: `0 4px 14px rgba(var(--theme-primary-rgb), 0.4)`
            }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  {appointment ? "save" : "add_task"}
                </span>
                {appointment ? "Update Appointment" : "Schedule Entry"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
