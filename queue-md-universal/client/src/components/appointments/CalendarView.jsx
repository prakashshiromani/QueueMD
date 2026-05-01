import { useMemo } from "react";

export default function CalendarView({ view, currentDate, appointments, onDateClick, onAppointmentClick, loading }) {
  const days = useMemo(() => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const arr = Array(first.getDay()).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(y, m, d);
      const ds = date.toISOString().split("T")[0];
      arr.push({ date, day: d, appts: appointments.filter(a => a.appointmentDate.split("T")[0] === ds) });
    }
    return arr;
  }, [currentDate, appointments]);

  const getColor = (type) => ({
    clinic: "bg-blue-500", dental: "bg-pink-500", pathlab: "bg-purple-500", physio: "bg-green-500"
  }[type?.toLowerCase()] || "bg-blue-500");

  if (loading) return <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 p-8 animate-pulse"><div className="h-8 bg-surface-variant rounded mb-4"></div><div className="grid grid-cols-7 gap-2">{[...Array(35)].map((_,i)=><div key={i} className="h-24 bg-surface-variant rounded"></div>)}</div></div>;

  return (
    <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border-muted/50">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} className="p-3 text-center text-[11px] font-black text-text-secondary uppercase tracking-widest">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((d, i) => {
          if (!d) return <div key={i} className="h-24 border-b border-r border-border-muted/30"></div>;
          const isToday = d.date.toDateString() === new Date().toDateString();
          return (
            <div key={i} onClick={() => onDateClick(d.date)} className={`h-24 border-b border-r border-border-muted/30 p-2 hover:bg-surface-variant/50 transition cursor-pointer ${isToday ? "bg-blue-600/5" : ""}`}>
              <div className={`text-[12px] font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white" : "text-text-primary"}`}>{d.day}</div>
              <div className="space-y-1 overflow-y-auto max-h-[60px] scrollbar-hide">
                {d.appts.slice(0,3).map(a=><div key={a._id} onClick={(e)=>{e.stopPropagation();onAppointmentClick(a)}} className={`${getColor(a.appointmentType)} text-white text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:brightness-110`}>{a.startTime} - {a.patientName}</div>)}
                {d.appts.length>3 && <div className="text-[9px] text-text-secondary pl-1">+{d.appts.length-3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-4 border-t border-border-muted/50 flex flex-wrap gap-4">
        {[{l:"Clinic",c:"bg-blue-500"},{l:"Dental",c:"bg-pink-500"},{l:"Pathlab",c:"bg-purple-500"},{l:"Physio",c:"bg-green-500"}].map(x=><div key={x.l} className="flex items-center gap-2"><div className={`w-3 h-3 rounded ${x.c}`}></div><span className="text-[11px] text-text-secondary">{x.l}</span></div>)}
      </div>
    </div>
  );
}
