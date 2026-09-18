import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const StatusStackedBarChart = ({ data = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? 'none' : '1px solid #e2e8f0';
  const tooltipColor = isDark ? '#f1f5f9' : '#1e293b';
  const cursorFill = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const brushColor = isDark ? '#334155' : '#cbd5e1';

  const ChartContent = () => (
    <ResponsiveContainer width="100%" height={isFullscreen ? "90%" : 300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: isFullscreen ? 20 : 0 }}>
        <XAxis
          dataKey="session"
          tick={{ fontSize: 12, fill: axisColor }}
          minTickGap={15}
          angle={-45}
          textAnchor="end"
          height={60}
          stroke={axisColor}
        />
        <YAxis
          tick={{ fontSize: 12, fill: axisColor }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: cursorFill }}
          contentStyle={{
            backgroundColor: tooltipBg,
            border: tooltipBorder,
            borderRadius: '10px',
            color: tooltipColor,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
          labelStyle={{ color: axisColor, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: axisColor }} />
        <Bar dataKey="present" stackId="a" fill="#22c55e" name="Present" isAnimationActive={false} />
        <Bar dataKey="od" stackId="a" fill="#3b82f6" name="On Duty" isAnimationActive={false} />
        <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" isAnimationActive={false} />
        <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        
        <Brush 
          dataKey="session" 
          height={30} 
          stroke={brushColor} 
          fill={isDark ? '#1e293b' : '#f8fafc'}
          tickFormatter={() => ''}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm transition-opacity">
        <div className="w-full h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col relative animate-fade-in-up">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Attendance Trends</h2>
            <button 
              onClick={() => setIsFullscreen(false)}
              className="p-3 bg-gray-100 dark:bg-white/5 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 text-gray-600 dark:text-white/60 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ChartContent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative group">
      <button 
        onClick={() => setIsFullscreen(true)}
        className="absolute -top-12 right-0 z-10 p-2 bg-gray-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 text-gray-600 dark:text-white/60 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hidden md:flex items-center gap-2 text-sm font-medium cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
        Expand
      </button>
      <ChartContent />
    </div>
  );
};

export default StatusStackedBarChart;
