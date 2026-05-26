import { useMemo } from "react";
import { useFacilityStore } from "../../store/facilityStore";

export default function DayView({ date, appointments, onAppointmentClick, onAdd, loading }) {
  const { facilityType } = useFacilityStore();

  // Filter & Sort appointments for selected date
  const dayAppts = useMemo(() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const targetDate = `${y}-${m}-${d}`;
    return appointments
      .filter(a => a.appointmentDate.split("T")[0] === targetDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [date, appointments]);

  const getStatusBadge = (status) => {
    const map = {
      scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      confirmed: "bg-green-500/10 text-green-400 border-green-500/20",
      "checked-in": "bg-purple-500/10 text-purple-400 border-purple-500/20",
      completed: "bg-gray-500/10 text-gray-400 border-gray-400/20",
      cancelled: "bg-red-500/10 text-red-400 border-red-500/20"
    };
    return map[status] || map.scheduled;
  };

  const getTypeColor = (type) => ({
    clinic: "border-l-blue-500",
    dental: "border-l-pink-500",
    pathlab: "border-l-purple-500",
    physio: "border-l-green-500",
    pathology: "border-l-purple-500"
  }[type?.toLowerCase()] || "border-l-blue-500");

  if (loading) return <div className="p-12 text-center text-text-secondary animate-pulse">
    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
    <p className="mt-2 font-bold uppercase tracking-widest text-[11px]">Loading daily schedule...</p>
  </div>;

  return (
    <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border-muted/50 bg-bg-secondary/50 backdrop-blur-sm flex justify-between items-center">
        <div className="flex-1">
          <h3 className="text-[20px] font-black text-text-primary tracking-tight">
            {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <p className="text-[12px] text-text-secondary mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {dayAppts.length} appointments scheduled
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onAdd}
            className="px-5 h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[13px] shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Patient
          </button>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center cursor-pointer hover:bg-blue-500/20 transition-all" title="Refresh Schedule">
            <span className="material-symbols-outlined text-blue-500 text-[24px]">event_repeat</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border-muted/30 max-h-[600px] overflow-y-auto custom-scrollbar">
        {dayAppts.length === 0 ? (
          <div className="p-16 text-center text-text-secondary">
            <div className="w-20 h-20 rounded-full bg-surface-variant/50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[40px] opacity-20">event_available</span>
            </div>
            <p className="font-bold text-[15px] text-text-primary">No appointments for this day</p>
            <p className="text-[12px] mt-1">Enjoy your free time or schedule a new one!</p>
          </div>
        ) : (
          dayAppts.map((apt) => (
            <div
              key={apt._id}
              onClick={() => onAppointmentClick(apt)}
              className={`group p-5 hover:bg-surface-variant/30 cursor-pointer transition-all border-l-[4px] ${getTypeColor(apt.appointmentType)} active:scale-[0.99]`}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-bg-primary rounded-lg border border-border-muted/50 shadow-sm">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">schedule</span>
                      <span className="text-[13px] font-black text-text-primary tracking-wide">
                        {apt.startTime} - {apt.endTime}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(apt.status)} shadow-sm`}>
                      {apt.status}
                    </span>
                  </div>
                  <h4 className="text-[17px] font-black text-text-primary tracking-tight mb-1">{apt.patientName}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                      Token: <span className="font-bold text-text-primary">{apt.tokenNumber}</span>
                    </span>
                    <span className="flex items-center gap-1.5 uppercase font-bold tracking-tighter">
                      <span className="material-symbols-outlined text-[16px]">category</span>
                      {apt.appointmentType}
                    </span>
                    {apt.doctorName && (
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">medical_services</span>
                        Dr. {apt.doctorName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-bg-primary border border-border-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-[20px] text-blue-500">edit</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
