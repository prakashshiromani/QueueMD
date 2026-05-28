import ChartSkeleton from './ChartSkeleton';

export default function TopDoctorsCard({ data = [], loading }) {


  if (loading) return <ChartSkeleton height={250} />;

  // ✅ Defensive check for empty or non-array data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[200px] flex flex-col items-center justify-center text-text-secondary">
        <span className="material-symbols-outlined text-3xl opacity-20 mb-2">medical_services</span>
        <p className="text-[12px] font-bold opacity-50">No doctor stats available</p>
      </div>
    );
  }

  // ✅ Safe max calculation
  const maxCount = Math.max(...data.map(d => d.value !== undefined ? d.value : (d.count || 0))) || 1;

  return (
    <div className="w-full space-y-3 overflow-y-auto max-h-[200px] custom-scrollbar">
      {data.map((doctor, index) => {
        if (!doctor) return null;
        const name = doctor.name || doctor.doctorName || doctor._id || 'Unknown Doctor';
        const count = doctor.value !== undefined ? doctor.value : (doctor.count || 0);
        const initial = name?.charAt(0)?.toUpperCase() || '?';
        const medals = ['🥇', '🥈', '🥉'];

        return (
          <div key={name + index} className="flex items-center gap-3 group">
            <div
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[12px] font-black border"
              style={{
                backgroundColor: 'rgba(var(--theme-primary-rgb),0.12)',
                color: 'var(--theme-primary)',
                borderColor: 'rgba(var(--theme-primary-rgb),0.2)'
              }}
            >
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[13px] font-bold text-text-primary truncate">{name}</span>
                <span className="text-[11px] font-black text-text-secondary shrink-0 ml-2">{count} pts</span>
              </div>
              <div className="h-1.5 w-full bg-surface-variant/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: 'var(--theme-primary)',
                    boxShadow: '0 0 6px rgba(var(--theme-primary-rgb),0.4)'
                  }}
                />
              </div>
            </div>

            <div className="shrink-0 w-6 flex justify-center text-[14px]">
              {index < 3 ? medals[index] : (
                <span className="text-[11px] font-black text-text-secondary">#{index + 1}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
