import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SubjectBarChart = ({ data = [], threshold = 75, onBarClick }) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'currentColor' }} interval={0} angle={-45} textAnchor="end" height={60} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} onClick={(data) => onBarClick && onBarClick(data.label)}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value >= threshold ? '#22c55e' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubjectBarChart;
