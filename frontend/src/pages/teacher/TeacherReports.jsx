import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import apiClient from '../../services/apiClient';

const TeacherReports = ({ classes }) => {
  const [filter, setFilter] = useState('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState(classes?.[0]?.class_id || '');
  const [chartData, setChartData] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [avgAttendance, setAvgAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch report data from API when class or filter changes
  useEffect(() => {
    if (!selectedClass) return;
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const params = { class_id: selectedClass, filter };
        if (filter === 'custom' && startDate) params.start_date = startDate;
        if (filter === 'custom' && endDate) params.end_date = endDate;
        
        const { data } = await apiClient.get('/api/reports/', { params });
        setChartData(data.chart_data || []);
        setDefaulters(data.defaulters || []);
        setAvgAttendance(data.avg_attendance ?? null);
      } catch {
        // API not available — show empty state
        setChartData([]);
        setDefaulters([]);
        setAvgAttendance(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [selectedClass, filter, startDate, endDate]);

  return (
    <div className="animate-fade-in-up flex flex-col gap-8">
      {/* Filters */}
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 flex flex-col lg:flex-row gap-6 justify-between items-center shadow-2xl">
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
          <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-6 flex justify-between items-center">
                Attendance Trends
                {avgAttendance !== null && (
                  <span className="text-xs font-normal text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">Avg: {avgAttendance}%</span>
                )}
            </h3>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/30 text-sm">
                  No attendance data available for this class.
                </div>
              ) : (
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
              )}
            </div>
          </div>

          {/* Defaulters Table */}
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 className="text-lg font-semibold text-red-100">Defaulters List</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-3">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-400"></div>
                      </div>
                    ) : defaulters.length === 0 ? (
                        <div className="text-center py-8 text-white/40">No defaulters found.</div>
                    ) : defaulters.map(student => (
                        <div key={student.id} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-white/5 hover:border-red-500/30 transition-colors">
                            <div>
                                <p className="font-medium text-white/90">{student.name}</p>
                                <p className="text-xs text-white/50">{student.id}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-red-400">{typeof student.percentage === 'number' ? student.percentage.toFixed(1) : student.percentage}%</span>
                            </div>
                        </div>
                    ))}
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
