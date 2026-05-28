import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ChartSkeleton from './ChartSkeleton';

export default function DailyTrendChart({ data = [], loading }) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => ({
      date: item.date || item._id || 'Unknown',
      value: item.count !== undefined ? item.count : (item.value || 0)
    }));
  }, [data]);

  if (loading) return <ChartSkeleton height={220} />;

  if (chartData.length === 0) {
    return (
      <div className="h-[220px] flex flex-col items-center justify-center text-text-secondary">
        <span className="material-symbols-outlined text-3xl opacity-20 mb-2">show_chart</span>
        <p className="text-[12px] font-bold opacity-50">No trend data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let formatted = label;
      try {
        const d = new Date(label);
        if (!isNaN(d.getTime())) formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      } catch {}

      return (
        <div
          className="px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md"
          style={{ background: 'rgba(15,23,42,0.92)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
        >
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{formatted}</p>
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
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="20%" stopColor="var(--primary-container)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary-container)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            stroke="transparent"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, opacity: 0.55 }}
            axisLine={false}
            tickLine={false}
            dy={10}
            tickFormatter={(date) => {
              try {
                const d = new Date(date);
                return isNaN(d.getTime()) ? date : `${d.getDate()}-${d.getMonth() + 1}`;
              } catch { return date; }
            }}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, opacity: 0.55 }}
            axisLine={false}
            tickLine={false}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--primary-container)"
            strokeWidth={2.5}
            fill="url(#dailyGradient)"
            animationDuration={1000}
            animationEasing="ease-in-out"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: 'var(--primary-container)', style: { filter: 'drop-shadow(0 0 6px var(--primary-container))' } }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
