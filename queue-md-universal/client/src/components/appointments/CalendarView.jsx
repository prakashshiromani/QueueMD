import { useMemo } from "react";

export default function CalendarView({ view, currentDate, appointments, onDateClick, onAppointmentClick, onDelete, onViewChange, loading }) {
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Empty cells for alignment
    for (let i = 0; i < startingDay; i++) days.push(null);
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayAppointments = appointments.filter(apt => {
        const aptDate = apt.appointmentDate.split("T")[0];
        return aptDate === dateStr;
      });

      days.push({ date, day, appointments: dayAppointments });
    }
    return days;
  }, [currentDate, appointments]);

  const getAppointmentColor = (type) => ({
    clinic: "bg-blue-500", 
    dental: "bg-pink-500", 
    pathlab: "bg-purple-500", 
    physio: "bg-green-500",
    general: "bg-blue-500",
    pathology: "bg-purple-500"
  }[type?.toLowerCase()] || "bg-blue-500");

  if (loading) return (
    <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 p-8 animate-pulse">
      <div className="h-8 bg-surface-variant rounded mb-4"></div>
      <div className="grid grid-cols-7 gap-2">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="h-28 lg:h-32 bg-surface-variant rounded"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 overflow-hidden">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 border-b border-border-muted/50 bg-bg-secondary/50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="p-3 text-center text-[11px] font-black text-text-secondary uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - FIXED HEIGHT ROWS */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="h-28 lg:h-32 border-b border-r border-border-muted/30 bg-surface-variant/20"></div>;
          }

          const isToday = day.date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={idx}
              onClick={() => onDateClick(day.date)}
              className={`
                relative h-28 lg:h-32 border-b border-r border-border-muted/30 p-2 
                hover:bg-surface-variant/50 transition cursor-pointer flex flex-col
                ${isToday ? "bg-blue-600/5" : ""}
              `}
            >
              {/* Date Number */}
              <div className={`
                text-[12px] font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full
                ${isToday ? "bg-blue-600 text-white" : "text-text-primary"}
              `}>
                {day.day}
              </div>
              
              {/* Appointments Container */}
              <div className="flex flex-col gap-1 overflow-hidden mt-0.5">
                {/* Show max 3 items safely with fixed height */}
                {day.appointments.slice(0, 3).map(apt => (
                  <div
                    key={apt._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(apt);
                    }}
                    className={`
                      ${getAppointmentColor(apt.appointmentType)} 
                      text-white text-[10px] px-2 py-1 rounded-md 
                      truncate cursor-pointer hover:brightness-110 flex justify-between items-center group/item transition-all hover:scale-[1.02] shadow-sm
                    `}
                  >
                    <span className="truncate">{apt.startTime} - {apt.patientName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(apt);
                      }}
                      className="opacity-0 group-hover/item:opacity-100 hover:bg-white/20 rounded p-0.5 transition-all ml-1 flex items-center"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                ))}
                
                {/* "+ More" Button with View Switch */}
                {day.appointments.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick(day.date);
                      if (onViewChange) onViewChange("day");
                    }}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-500 text-left truncate flex items-center gap-1 mt-0.5"
                  >
                    <span className="material-symbols-outlined text-[12px]">add_circle</span>
                    {day.appointments.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border-muted/50 flex flex-wrap gap-4">
        {[
          { label: "General", color: "bg-blue-500" },
          { label: "Dental", color: "bg-pink-500" },
          { label: "Pathlab", color: "bg-purple-500" },
          { label: "Physio", color: "bg-green-500" }
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
            <span className="text-[11px] text-text-secondary">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
