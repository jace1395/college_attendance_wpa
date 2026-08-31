import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const TeacherReports = ({ classes }) => {
  const [filter, setFilter] = useState('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState(classes?.[0]?.class_id || '');

  // Mock data for the chart based on the selected class
  const chartData = [
    { date: 'Mon', present: 45, absent: 5 },
    { date: 'Tue', present: 42, absent: 8 },
    { date: 'Wed', present: 48, absent: 2 },
    { date: 'Thu', present: 40, absent: 10 },
    { date: 'Fri', present: 47, absent: 3 }
  ];

  // Mock Defaulters Data
  const defaulters = [
    { id: '2511001', name: 'Alice Smith', percentage: 65.0 },
    { id: '2511018', name: 'Bob Johnson', percentage: 58.5 },
    { id: '2511022', name: 'Charlie Davis', percentage: 71.0 }
  ];

  return (
    <div className="animate-fade-in-up flex flex-col gap-8">
      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col lg:flex-row gap-6 justify-between items-center shadow-xl">
        <div className="flex items-center gap-4 w-full lg:w-auto">
            <span className="text-white/70 font-medium">Class:</span>
            <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-800 text-white text-sm rounded-xl px-4 py-2 outline-none border border-white/20 focus:border-blue-500 cursor-pointer shadow-inner flex-1"
            >
                {classes?.map(c => (
                    <option key={c.class_id} value={c.class_id}>{c.class_name} - {c.subject_name}</option>
                ))}
            </select>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <span className="text-sm font-medium text-white/70 uppercase tracking-wider">Time:</span>
            <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto w-full sm:w-auto">
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
            <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 w-full sm:w-auto justify-center">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-6 flex justify-between items-center">
                Attendance Trends
                <span className="text-xs font-normal text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">Avg: 82.5%</span>
            </h3>
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
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Defaulters Table */}
          <div className="bg-red-900/10 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 className="text-lg font-semibold text-red-100">Defaulters List</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-3">
                    {defaulters.map(student => (
                        <div key={student.id} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-white/5 hover:border-red-500/30 transition-colors">
                            <div>
                                <p className="font-medium text-white/90">{student.name}</p>
                                <p className="text-xs text-white/50">{student.id}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-red-400">{student.percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                    ))}
                    {defaulters.length === 0 && (
                        <div className="text-center py-8 text-white/40">No defaulters found!</div>
                    )}
                </div>
            </div>
            
            <button className="w-full mt-4 py-3 border border-red-500/30 text-red-300 hover:bg-red-500/20 rounded-xl font-medium transition-colors">
                Export to CSV
            </button>
          </div>
      </div>
    </div>
  );
};

export default TeacherReports;
