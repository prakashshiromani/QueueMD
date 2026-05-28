import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ChartSkeleton from './ChartSkeleton';
import { FACILITY_TYPES } from '../../utils/facilityTypeConfig';

export default function FacilityDonutChart({ data = [], loading }) {
  if (loading) return <ChartSkeleton height={220} />;

  if (!data || !Array.isArray(data) || data.length === 0 || data.every(d => (d.value || d.total || 0) === 0)) {
    return (
      <div className="h-[220px] flex flex-col items-center justify-center text-text-secondary">
        <span className="material-symbols-outlined text-3xl opacity-20 mb-2">donut_large</span>
        <p className="text-[12px] font-bold opacity-50">No facility data available</p>
      </div>
    );
  }

  const chartData = data.map(d => {
    const rawKey = (d.name || d.type || d._id || 'Unknown').toLowerCase();
    const config = FACILITY_TYPES[rawKey];
    return {
      name: config?.label || rawKey,
      value: d.value !== undefined ? d.value : (d.total || d.count || 0),
      originalKey: rawKey
    };
  });

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          className="px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md"
          style={{ background: 'rgba(15,23,42,0.92)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
        >
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{item.name}</p>
          <p className="text-[16px] font-black text-white mt-0.5">
            {item.value}
            <span className="text-[11px] font-bold text-slate-400 ml-1">consultations</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full h-[150px]">
        {/* Center total label - perfectly aligned */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[26px] font-black text-text-primary leading-none">{total}</span>
          <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest mt-1">Total</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={64}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => {
                const color = FACILITY_TYPES[entry.originalKey]?.theme?.primary || 'var(--primary-container)';
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                    style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend rendered as React component to avoid shifting Recharts Pie center */}
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3 w-full px-2">
        {chartData.map((entry, index) => {
          const color = FACILITY_TYPES[entry.originalKey]?.theme?.primary || 'var(--primary-container)';
          return (
            <li key={`item-${index}`} className="flex items-center gap-1.5 text-[10px] font-black text-text-secondary uppercase tracking-widest">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
              {entry.name}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
