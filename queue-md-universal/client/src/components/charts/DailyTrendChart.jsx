import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ChartSkeleton from './ChartSkeleton';

export default function DailyTrendChart({ data = [], loading }) {
  console.log('📊 DailyTrendChart received:', data);

  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
      date: item.date || item._id || 'Unknown',
      value: item.count !== undefined ? item.count : (item.value || 0)
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="bg-bg-secondary p-6 rounded-xl border border-border-muted/50" style={{ minHeight: '280px' }}>
        <div className="animate-pulse flex items-center justify-center h-[220px]">
          <div className="text-text-secondary text-[12px] font-bold">Loading Trends...</div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-bg-secondary p-6 rounded-xl border border-border-muted/50" style={{ minHeight: '280px' }}>
        <div className="flex flex-col items-center justify-center h-[220px] text-text-secondary">
          <span className="material-symbols-outlined text-[32px] opacity-50 mb-2">trending_flat</span>
          <p className="text-[12px] font-bold">No trends available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary p-6 rounded-xl border border-border-muted/50" style={{ minHeight: '280px' }}>
      <h3 className="text-[14px] font-black text-text-primary mb-4 tracking-tight">Patient Flow Trend</h3>
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="25%" stopColor="var(--primary-container)" stopOpacity={0.25}/>
                <stop offset="100%" stopColor="var(--primary-container)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-muted)" opacity={0.03} />
            <XAxis 
              dataKey="date" 
              stroke="var(--text-secondary)" 
              fontSize={10}
              tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 900 }}
              axisLine={false}
              tickLine={false}
              dy={10}
              tickFormatter={(date) => {
                try {
                  const d = new Date(date);
                  return isNaN(d.getTime()) ? date : `${d.getDate()}-${d.getMonth() + 1}`;
                } catch (e) {
                  return date;
                }
              }}
            />
            <YAxis 
              stroke="var(--text-secondary)" 
              fontSize={10}
              tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 900 }}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-muted)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-primary)'
              }}
              labelFormatter={(date) => {
                try {
                  const d = new Date(date);
                  return isNaN(d.getTime()) ? date : d.toLocaleDateString();
                } catch (e) {
                  return date;
                }
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="var(--primary-container)" 
              strokeWidth={3.5}
              fill="url(#dailyGradient)"
              activeDot={{ r: 6, strokeWidth: 0, className: 'animate-pulse' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
