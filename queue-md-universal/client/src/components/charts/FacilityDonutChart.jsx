import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartSkeleton from './ChartSkeleton';
import { FACILITY_TYPES } from '../../utils/facilityTypeConfig';

export default function FacilityDonutChart({ data = [], loading }) {
  console.log('📊 FacilityDonutChart received:', data);

  if (loading) {
    return (
      <div className="bg-bg-secondary p-6 rounded-xl border border-border-muted/50" style={{ minHeight: '280px' }}>
        <div className="animate-pulse flex flex-col items-center justify-center h-[220px]">
          <div className="text-text-secondary text-[12px] font-bold">Loading...</div>
        </div>
      </div>
    );
  }

  // ✅ Defensive check for empty or non-array data
  if (!data || !Array.isArray(data) || data.length === 0 || data.every(d => (d.value || d.total || 0) === 0)) {
    return (
      <div className="bg-bg-secondary p-6 rounded-xl border border-border-muted/50" style={{ minHeight: '280px' }}>
        <div className="flex flex-col items-center justify-center h-[220px] text-text-secondary">
          <span className="material-symbols-outlined text-[32px] opacity-50 mb-2">pie_chart</span>
          <p className="text-[12px] font-bold">No facility data available</p>
        </div>
      </div>
    );
  }

  // ✅ Normalize data for Recharts
  const chartData = data.map(d => {
    const rawKey = (d.name || d.type || d._id || 'Unknown').toLowerCase();
    const config = FACILITY_TYPES[rawKey];
    return {
      name: config?.label || rawKey,
      value: d.value !== undefined ? d.value : (d.total || d.count || 0),
      originalKey: rawKey
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-bg-secondary border border-border-muted/50 rounded-xl px-3 py-2 shadow-lg z-50 relative">
          <p className="text-[10px] text-text-secondary uppercase tracking-widest">{item.name}</p>
          <p className="text-[16px] font-black text-text-primary">{item.value} Consultations</p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-3 mt-2">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center gap-1.5 text-[11px] font-bold text-text-primary uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-bg-secondary p-6 rounded-xl border border-border-muted/50" style={{ minHeight: '280px' }}>
      <h3 className="text-[14px] font-black text-text-primary mb-4 tracking-tight">Facility Distribution</h3>
      
      <div className="w-full h-[220px] relative">
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
          <span className="text-[24px] font-black text-text-primary">
            {chartData.reduce((sum, d) => sum + d.value, 0)}
          </span>
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Total</span>
        </div>

        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {chartData.map((entry, index) => {
                const color = FACILITY_TYPES[entry.originalKey]?.theme?.primary || 
                             'var(--primary-container)';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} verticalAlign="bottom" height={20} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
