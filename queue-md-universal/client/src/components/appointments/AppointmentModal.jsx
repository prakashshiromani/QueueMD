import { useState, useEffect } from "react";
import { useFacilityStore } from "../../store/facilityStore";

export default function AppointmentModal({ isOpen, onClose, onSubmit, appointment, selectedDate }) {
  const { facilityType } = useFacilityStore();
  const [form, setForm] = useState({ patientName:"", phone:"", email:"", appointmentDate:"", startTime:"", endTime:"", appointmentType:"clinic", doctorName:"", notes:"" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (appointment) setForm({ patientName:appointment.patientName, phone:appointment.phone, email:appointment.email, appointmentDate:new Date(appointment.appointmentDate).toISOString().split("T")[0], startTime:appointment.startTime, endTime:appointment.endTime, appointmentType:appointment.appointmentType, doctorName:appointment.doctorName, notes:appointment.notes });
    else setForm(prev=>({...prev, appointmentDate:selectedDate?.toISOString().split("T")[0]||""}));
  }, [appointment, selectedDate]);

  const validate = () => {
    const e = {};
    if (!form.patientName.trim()) e.patientName="Required";
    if (!form.phone.trim()) e.phone="Required";
    if (!form.appointmentDate) e.appointmentDate="Required";
    if (!form.startTime) e.startTime="Required";
    if (!form.endTime) e.endTime="Required";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try { setLoading(true); await onSubmit({...form, facilityType}); onClose(); }
    catch(err) { setErrors({submit:err.response?.data?.message||"Failed"}); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;
  const inputCls = "w-full h-[46px] bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner";
  const labelCls = "block text-[11px] font-black text-text-secondary uppercase tracking-widest mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border-muted/50">
          <h2 className="text-[20px] font-black text-text-primary">{appointment?"Edit":"New"} Appointment</h2>
          <p className="text-[12px] text-text-secondary mt-1">{appointment?"Update details":"Schedule entry"}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-[13px] text-red-400">{errors.submit}</div>}
          
          <div className="space-y-3">
            <h3 className="text-[14px] font-black text-text-secondary uppercase tracking-widest">Patient Info</h3>
            <div><label className={labelCls}>Patient Name *</label><input value={form.patientName} onChange={e=>setForm({...form,patientName:e.target.value})} className={inputCls} placeholder="Name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Phone *</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className={inputCls} placeholder="+91" /></div>
              <div><label className={labelCls}>Email</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={inputCls} placeholder="mail@example.com" /></div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border-muted/30">
            <h3 className="text-[14px] font-black text-text-secondary uppercase tracking-widest">Schedule</h3>
            <div><label className={labelCls}>Date *</label><input type="date" value={form.appointmentDate} onChange={e=>setForm({...form,appointmentDate:e.target.value})} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Start *</label><input type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} className={inputCls} /></div>
              <div><label className={labelCls}>End *</label><input type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Type</label><select value={form.appointmentType} onChange={e=>setForm({...form,appointmentType:e.target.value})} className={inputCls}><option value="clinic">Clinic</option><option value="dental">Dental</option><option value="pathlab">Pathlab</option><option value="physio">Physio</option></select></div>
              <div><label className={labelCls}>Doctor</label><input value={form.doctorName} onChange={e=>setForm({...form,doctorName:e.target.value})} className={inputCls} placeholder="Dr. Name" /></div>
            </div>
            <div><label className={labelCls}>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none shadow-inner" /></div>
          </div>

          <div className="flex gap-3 pt-4 mt-6 border-t border-border-muted/30">
            <button type="button" onClick={onClose} className="flex-1 h-[46px] rounded-xl bg-bg-primary border border-border-muted/50 text-[14px] font-bold text-text-secondary hover:text-text-primary transition active:scale-[0.98]">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 h-[46px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50">{loading?"Saving...":appointment?"Update":"Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
