export default function DailySchedule({ appointments, stats, onStatusChange, onEdit, onDelete, loading }) {
  const badge = (s) => ({
    scheduled: "bg-blue-500/10 text-blue-400 border-blue-400/20",
    confirmed: "bg-green-500/10 text-green-400 border-green-400/20",
    "checked-in": "bg-purple-500/10 text-purple-400 border-purple-400/20",
    completed: "bg-gray-500/10 text-gray-400 border-gray-400/20"
  }[s] || "bg-blue-500/10 text-blue-400 border-blue-400/20");

  if (loading) return <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 p-5 animate-pulse space-y-4"><div className="h-6 bg-surface-variant rounded w-3/4"></div>{[...Array(4)].map((_,i)=><div key={i} className="h-20 bg-surface-variant rounded"></div>)}</div>;

  return (
    <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 p-5 space-y-4">
      <div>
        <h2 className="text-[18px] font-black text-text-primary tracking-tight">Daily Schedule</h2>
        <p className="text-[12px] text-text-secondary mt-1">{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
      </div>
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-text-secondary"><span className="material-symbols-outlined text-[48px] opacity-30">event_busy</span><p className="text-[13px] mt-2">No appointments today</p></div>
        ) : appointments.map(a => (
          <div key={a._id} className="group bg-surface-variant/30 rounded-xl p-4 border border-border-muted/50 hover:border-blue-500/30 transition-all">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-[14px] font-bold text-text-primary">{a.patientName}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${badge(a.status)}`}>{a.status}</span>
              </div>
              <span className="text-[10px] font-black text-text-secondary uppercase">{a.appointmentType?.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-text-secondary mb-3">
              <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span>{a.startTime}</div>
              <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">confirmation_number</span>{a.tokenNumber}</div>
            </div>
            <div className="flex gap-2">
              {a.status==="scheduled" && <button onClick={()=>onStatusChange(a._id,"confirmed")} className="flex-1 px-3 py-1.5 rounded-lg bg-green-600/10 text-green-400 text-[11px] font-bold hover:bg-green-600/20 transition active:scale-[0.98]">Confirm</button>}
              {a.status==="confirmed" && <button onClick={()=>onStatusChange(a._id,"checked-in")} className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 text-[11px] font-bold hover:bg-blue-600/20 transition active:scale-[0.98]">Check-in</button>}
              <button onClick={()=>onEdit(a)} className="px-3 py-1.5 rounded-lg bg-bg-primary border border-border-muted/50 text-text-secondary text-[11px] font-bold hover:text-text-primary transition">Edit</button>
              <button onClick={()=>onDelete(a._id)} className="px-3 py-1.5 rounded-lg bg-red-600/10 text-red-400 text-[11px] font-bold hover:bg-red-600/20 transition"><span className="material-symbols-outlined text-[16px]">delete</span></button>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-muted/50">
        <div className="bg-surface-variant/50 rounded-xl p-3 text-center"><div className="text-[11px] text-text-secondary uppercase tracking-widest mb-1">Remaining</div><div className="text-[24px] font-black text-text-primary">{stats.remaining}</div></div>
        <div className="bg-surface-variant/50 rounded-xl p-3 text-center"><div className="text-[11px] text-text-secondary uppercase tracking-widest mb-1">Completed</div><div className="text-[24px] font-black text-green-400">{stats.completed}</div></div>
      </div>
    </div>
  );
}
