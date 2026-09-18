import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const StatusStackedBarChart = ({ data = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? 'none' : '1px solid #e2e8f0';
  const tooltipColor = isDark ? '#f1f5f9' : '#1e293b';
  const cursorFill = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="session"
            tick={{ fontSize: 12, fill: axisColor }}
            interval={0}
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
          <Bar dataKey="present" stackId="a" fill="#22c55e" name="Present" />
          <Bar dataKey="od" stackId="a" fill="#3b82f6" name="On Duty" />
          <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" />
          <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusStackedBarChart;
