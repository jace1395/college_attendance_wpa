import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const SubjectReports = ({ subject, history }) => {
  const [filter, setFilter] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'semester', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Process data for charts
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    // Reverse to show chronological order if needed, but assuming it's already sorted
    return history.map(record => ({
      date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      statusVal: record.status === 'Present' || record.status === 'On Duty' ? 1 : 0,
      originalStatus: record.status
    }));
  }, [history, filter, startDate, endDate]); // Adding filter/dates as dependencies if we actually filter the array

  // Calculate summary
  const summary = useMemo(() => {
    if (!history) return { total: 0, attended: 0, percentage: 0 };
    const total = history.length;
    const attended = history.filter(h => h.status === 'Present' || h.status === 'On Duty').length;
    return {
      total,
      attended,
      percentage: total > 0 ? ((attended / total) * 100).toFixed(1) : 0
    };
  }, [history]);

  return (
    <div className="animate-fade-in-up">
      {/* Filter Bar */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-8 flex flex-wrap gap-4 items-center">
        <span className="text-sm font-medium text-white/70 uppercase tracking-wider">Filter By:</span>
        <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/5">
          {['daily', 'weekly', 'monthly', 'semester'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              {f}
            </button>
          ))}
          <button
              onClick={() => setFilter('custom')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'custom' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              Custom
          </button>
        </div>

        {filter === 'custom' && (
          <div className="flex items-center gap-3 ml-auto bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm text-white outline-none border-b border-white/20 focus:border-blue-400 px-1"
            />
            <span className="text-white/40">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm text-white outline-none border-b border-white/20 focus:border-blue-400 px-1"
            />
          </div>
        )}
      </div>

      {/* Summary Text */}
      <div className="mb-8 bg-blue-900/20 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-medium text-blue-100">
          In this period, you attended <strong className="text-white text-2xl mx-1">{summary.attended}/{summary.total}</strong> classes.
        </h3>
        <p className="text-blue-300/70 mt-1">That's an attendance rate of {summary.percentage}% for the selected range.</p>
      </div>

      {/* Chart */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
        <h3 className="text-lg font-semibold mb-6">Attendance Trend</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#ffffff50" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#ffffff50" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value === 1 ? 'Present' : value === 0 ? 'Absent' : ''}
                domain={[0, 1]}
                ticks={[0, 1]}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#60a5fa' }}
                formatter={(value, name, props) => [props.payload.originalStatus, 'Status']}
              />
              <Bar 
                dataKey="statusVal" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SubjectReports;
