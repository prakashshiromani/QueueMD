import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartSkeleton from './ChartSkeleton';

export default function HourlyBarChart({ data = [], loading }) {
  console.log('📊 HourlyBarChart received data:', data);
  console.log('📊 Data length:', data.length);
  console.log('📊 First item:', data[0]);
  console.log('📊 Has hour field?', data[0]?.hour !== undefined);
  console.log('📊 Has count field?', data[0]?.count !== undefined);
  
  if (loading) return <ChartSkeleton height={250} />;
  
  // ✅ Data validation - Check if data is an array and has at least one valid item
  if (!data || !Array.isArray(data)) {
    console.warn('⚠️ Data is not an array');
    return <ChartSkeleton height={250} />;
  }

  const hasValidData = data.length > 0 && data.some(item => item.hour !== undefined && item.value !== undefined);

  if (!hasValidData) {
    console.warn('⚠️ No valid hourly data (missing hour/value fields)');
    return (
      <div className="h-[250px] flex items-center justify-center text-text-secondary border border-border-muted/50 rounded-xl bg-bg-secondary">
        <p className="text-[12px] font-bold">No trends available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-secondary border border-border-muted/50 rounded-xl px-3 py-2 shadow-lg z-50 relative">
          <p className="text-[10px] text-text-secondary uppercase tracking-widest">{label}</p>
          <p className="text-[16px] font-black text-text-primary">{payload[0].value} Patients</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[250px] w-full bg-bg-secondary p-4 rounded-xl border border-border-muted/50">
      <h3 className="text-[14px] font-black text-text-primary mb-4 tracking-tight">Hourly Traffic</h3>
      <div className="w-full h-[calc(100%-30px)]">
        <ResponsiveContainer width="100%" height={210} minWidth={1} minHeight={1}>
          <BarChart data={data}>
            <XAxis 
              dataKey="hour" 
              tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 900 }} 
              axisLine={false} 
              tickLine={false} 
              dy={10} 
            />
            <Tooltip cursor={{ fill: 'var(--surface-variant)', opacity: 0.4 }} content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.value === maxValue && entry.value > 0 ? "var(--primary-container)" : "var(--primary-container)"} 
                  className={entry.value === maxValue && entry.value > 0 ? "drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "opacity-30"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
