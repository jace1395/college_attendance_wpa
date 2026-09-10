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
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const SubjectReports = ({ subject, history }) => {
  const [filter, setFilter] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'semester', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fallback to dummy dates if backend doesn't provide them
  const semesterStartDate = subject?.semesterStartDate || '2026-07-01';
  const semesterEndDate = subject?.semesterEndDate || '2026-12-31';

  const handleDateChange = (type, val) => {
    if (val && (val < semesterStartDate || val > semesterEndDate)) {
      alert(`Please select a date within the current semester (${semesterStartDate} to ${semesterEndDate}).`);
      if (type === 'start') setStartDate('');
      else setEndDate('');
      return;
    }
    if (type === 'start') setStartDate(val);
    else setEndDate(val);
  };

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
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <span className="text-sm font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Filter By:</span>
        <div className="flex overflow-x-auto whitespace-nowrap gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/5 w-full md:w-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center ml-0 md:ml-auto bg-slate-900/50 p-2 md:p-1.5 rounded-xl border border-white/5 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-white/40 text-xs md:hidden">From</span>
              <input 
                type="date" 
                value={startDate}
                min={semesterStartDate}
                max={semesterEndDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="bg-transparent text-sm text-white outline-none border-b border-white/20 focus:border-blue-400 px-1 w-full md:w-auto"
              />
            </div>
            <span className="text-white/40 hidden md:inline">to</span>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-white/40 text-xs md:hidden">To</span>
              <input 
                type="date" 
                value={endDate}
                min={semesterStartDate}
                max={semesterEndDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="bg-transparent text-sm text-white outline-none border-b border-white/20 focus:border-blue-400 px-1 w-full md:w-auto"
              />
            </div>
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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl">
        <h3 className="text-lg font-semibold mb-6">Attendance Trend</h3>
        <div className="h-[300px] w-full">
          {(() => {
            switch (filter) {
              case 'daily': {
                const presentCount = chartData.filter(d => d.statusVal === 1).length;
                const absentCount = chartData.filter(d => d.statusVal === 0).length;
                const pieData = [
                  { name: 'Present', value: presentCount },
                  { name: 'Absent', value: absentCount }
                ];
                const COLORS = ['#10b981', '#ef4444'];
                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={({name, percent}) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );
              }
              case 'monthly':
                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff50" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
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
                      <Line type="monotone" dataKey="statusVal" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                );
              case 'semester':
              case 'custom':
                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorStatus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff50" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#ffffff50" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value === 1 ? 'P' : value === 0 ? 'A' : ''}
                        domain={[0, 1]}
                        ticks={[0, 1]}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#60a5fa' }}
                        formatter={(value, name, props) => [props.payload.originalStatus, 'Status']}
                      />
                      <Area type="monotone" dataKey="statusVal" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStatus)" />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              case 'weekly':
              default:
                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff50" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
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
                );
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default SubjectReports;
