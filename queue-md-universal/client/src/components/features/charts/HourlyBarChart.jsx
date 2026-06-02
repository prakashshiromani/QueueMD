import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartSkeleton from './ChartSkeleton';

export default function HourlyBarChart({ data = [], loading }) {
  if (loading) return <ChartSkeleton height={220} />;

  if (!data || !Array.isArray(data)) return <ChartSkeleton height={220} />;

  const hasValidData = data.length > 0 && data.some(item => item.hour !== undefined && item.value !== undefined);

  if (!hasValidData) {
    return (
      <div className="h-[220px] flex flex-col items-center justify-center text-text-secondary">
        <span className="material-symbols-outlined text-3xl opacity-20 mb-2">bar_chart</span>
        <p className="text-[12px] font-bold opacity-50">No hourly data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md"
          style={{
            background: 'rgba(15,23,42,0.9)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
          }}
        >
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{label}</p>
          <p className="text-[18px] font-black text-white mt-0.5">
            {payload[0].value}
            <span className="text-[12px] font-bold text-slate-400 ml-1">patients</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis
            dataKey="hour"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, opacity: 0.6 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }}
            content={<CustomTooltip />}
          />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.value === maxValue && entry.value > 0
                    ? 'var(--primary-container)'
                    : 'rgba(var(--theme-primary-rgb, 37,99,235),0.25)'
                }
                style={entry.value === maxValue && entry.value > 0 ? {
                  filter: 'drop-shadow(0 0 8px rgba(var(--theme-primary-rgb, 37,99,235),0.5))'
                } : {}}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
