import ChartSkeleton from './ChartSkeleton';

export default function TopDoctorsCard({ data = [], loading }) {
  console.log('📊 TopDoctorsCard received:', data);

  if (loading) return <ChartSkeleton height={250} />;

  // ✅ Defensive check for empty or non-array data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[250px] flex flex-col items-center justify-center text-text-secondary border border-border-muted/50 rounded-xl bg-bg-secondary">
        <span className="material-symbols-outlined text-[32px] opacity-50 mb-2">medical_services</span>
        <p className="text-[12px] font-bold">No doctor stats available</p>
      </div>
    );
  }

  // ✅ Safe max calculation
  const maxCount = Math.max(...data.map(d => d.value !== undefined ? d.value : (d.count || 0))) || 1;

  return (
    <div className="h-[250px] w-full bg-bg-secondary p-5 rounded-xl border border-border-muted/50 overflow-y-auto custom-scrollbar">
      <h3 className="text-[14px] font-black text-text-primary mb-4 tracking-tight flex items-center justify-between">
        Top Doctors
        <span className="material-symbols-outlined text-[16px] text-yellow-500">trophy</span>
      </h3>
      
      <div className="space-y-4">
        {data.map((doctor, index) => {
          if (!doctor) return null;

          // ✅ Backend sends name as '_id' or 'doctorName' or 'name'
          const name = doctor.name || doctor.doctorName || doctor._id || 'Unknown Doctor';
          const count = doctor.value !== undefined ? doctor.value : (doctor.count || 0);
          const initial = name?.charAt(0)?.toUpperCase() || '?';

          return (
            <div key={name + index} className="flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-surface-variant text-text-primary flex items-center justify-center text-[12px] font-black border border-border-muted/50">
                {initial}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[13px] font-bold text-text-primary truncate">{name}</span>
                  <span className="text-[11px] font-black text-text-secondary">{count} pts</span>
                </div>
                
                <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              
              {index === 0 && (
                <div className="shrink-0 w-6 flex justify-center">
                  <span className="text-[16px]">🥇</span>
                </div>
              )}
              {index === 1 && (
                <div className="shrink-0 w-6 flex justify-center">
                  <span className="text-[16px]">🥈</span>
                </div>
              )}
              {index === 2 && (
                <div className="shrink-0 w-6 flex justify-center">
                  <span className="text-[16px]">🥉</span>
                </div>
              )}
              {index > 2 && (
                <div className="shrink-0 w-6 flex justify-center text-[12px] font-black text-text-secondary">
                  #{index + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
