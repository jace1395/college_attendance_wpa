import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import apiClient from '../../services/apiClient';

const TeacherReports = ({ classes }) => {
  const [filter, setFilter] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'tilldate', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState(classes?.[0]?.class_id || '');
  const [rawHistory, setRawHistory] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [avgAttendance, setAvgAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fallback to dummy dates if backend doesn't provide them
  const semesterStartDate = '2026-07-01';
  const semesterEndDate = '2026-12-31';

  // Fetch report data from API
  useEffect(() => {
    if (!selectedClass) return;
    const fetchReportData = async () => {
      setLoading(true);
      try {
        // Always fetch the full available history for the class, then aggregate on the frontend
        const { data } = await apiClient.get('/api/reports/teacher/classes/', { params: { class_id: selectedClass } });
        setRawHistory(data.chart_data || []);
        setDefaulters(data.defaulters || []);
        setAvgAttendance(data.avg_attendance ?? null);
      } catch {
        setRawHistory([]);
        setDefaulters([]);
        setAvgAttendance(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [selectedClass]);

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

  const handleWeeklyClick = (data) => {
    if (data && data.originalRecords && data.originalRecords.length > 0) {
      const dates = data.originalRecords.map(r => new Date(r.rawDate).getTime());
      const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
      const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
      setStartDate(minDate);
      setEndDate(maxDate);
      setFilter('daily');
    }
  };

  // Process data for charts
  const chartData = useMemo(() => {
    if (!rawHistory || rawHistory.length === 0) return [];
    
    // Sort chronologically
    const sorted = [...rawHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Daily logic
    if (filter === 'daily') {
      let filtered = sorted;
      if (startDate) filtered = filtered.filter(r => r.date >= startDate);
      if (endDate) filtered = filtered.filter(r => r.date <= endDate);
      
      return filtered.map(record => ({
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: record.present,
        absent: record.absent,
        total: record.present + record.absent
      }));
    }

    // Weekly logic
    if (filter === 'weekly') {
      const weeks = [];
      let currentWeek = [];
      let weekStart = null;

      sorted.forEach((record) => {
        const d = new Date(record.date);
        if (currentWeek.length === 0) weekStart = d;
        
        const diffDays = Math.floor((d - weekStart) / (1000 * 60 * 60 * 24));
        if (diffDays >= 7) {
          weeks.push([...currentWeek]);
          currentWeek = [record];
          weekStart = d;
        } else {
          currentWeek.push(record);
        }
      });
      if (currentWeek.length > 0) weeks.push(currentWeek);

      return weeks.map(week => {
        const present = week.reduce((sum, r) => sum + r.present, 0);
        const absent = week.reduce((sum, r) => sum + r.absent, 0);
        const total = present + absent;
        const startStr = new Date(week[0].date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        const endStr = new Date(week[week.length-1].date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        
        return {
          range: `${startStr} - ${endStr}`,
          present,
          absent,
          total,
          percentage: total > 0 ? (present / total) * 100 : 0,
          originalRecords: week.map(r => ({ ...r, rawDate: r.date }))
        };
      });
    }

    // Monthly or Long Custom Range (Pie Chart)
    if (filter === 'monthly' || (filter === 'custom' && startDate && endDate && (new Date(endDate) - new Date(startDate)) > 30*24*60*60*1000)) {
       let filtered = sorted;
       if (filter === 'custom') {
         if (startDate) filtered = filtered.filter(r => r.date >= startDate);
         if (endDate) filtered = filtered.filter(r => r.date <= endDate);
       }
       
       const present = filtered.reduce((sum, r) => sum + r.present, 0);
       const absent = filtered.reduce((sum, r) => sum + r.absent, 0);
       const total = present + absent;
       const monthName = filtered.length > 0 ? new Date(filtered[0].date).toLocaleDateString('en-US', { month: 'long' }) : 'Month';
       
       return {
         type: 'pie',
         monthName: filter === 'custom' ? 'Custom Range' : monthName,
         total,
         present,
         percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
         data: [
           { name: 'Present', value: present, fill: '#22c55e' },
           { name: 'Absent', value: absent, fill: '#ef4444' }
         ]
       };
    }

    // Short Custom Range
    if (filter === 'custom') {
       let filtered = sorted;
       if (startDate) filtered = filtered.filter(r => r.date >= startDate);
       if (endDate) filtered = filtered.filter(r => r.date <= endDate);
       
       return filtered.map(record => ({
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: record.present,
        absent: record.absent,
        total: record.present + record.absent
      }));
    }

    return [];
  }, [rawHistory, filter, startDate, endDate]);

  return (
    <div className="animate-fade-in-up flex flex-col gap-8">
      {/* Filters */}
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 flex flex-col lg:flex-row gap-6 justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4 w-full lg:w-auto">
            <span className="text-white/70 font-medium">Class:</span>
            <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-800 text-white text-sm rounded-xl px-4 py-2 outline-none border border-white/20 focus:border-blue-500 cursor-pointer shadow-inner flex-1 [color-scheme:dark]"
            >
                {classes?.map(c => (
                    <option key={c.class_id} value={c.class_id}>{c.class_name} - {c.subject_name}</option>
                ))}
            </select>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <span className="text-sm font-medium text-white/70 uppercase tracking-wider">Time:</span>
            <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto w-full sm:w-auto">
            {['daily', 'weekly', 'monthly'].map(f => (
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
                min={semesterStartDate}
                max={semesterEndDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="bg-transparent text-sm text-white outline-none border-b border-white/20 focus:border-blue-400 px-1 [color-scheme:dark]"
                />
                <span className="text-white/40">to</span>
                <input 
                type="date" 
                value={endDate}
                min={semesterStartDate}
                max={semesterEndDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="bg-transparent text-sm text-white outline-none border-b border-white/20 focus:border-blue-400 px-1 [color-scheme:dark]"
                />
            </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col">
            <h3 className="text-lg font-semibold mb-6 flex justify-between items-center">
                Attendance Trends
                {avgAttendance !== null && (
                  <span className="text-xs font-normal text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">Avg: {avgAttendance}%</span>
                )}
            </h3>
            <div className="h-[300px] w-full flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : rawHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/30 text-sm">
                  No attendance data available for this class.
                </div>
              ) : (
                (() => {
                  // Pie Chart
                  if (chartData.type === 'pie') {
                    return (
                      <div className="flex flex-col items-center justify-center h-full">
                        <h4 className="text-xl font-bold mb-2">{chartData.monthName}</h4>
                        <p className="text-sm text-white/60 mb-4">{chartData.percentage}% Average Attendance</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={chartData.data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                              {chartData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  }


                  // Weekly Bar Chart
                  if (filter === 'weekly') {
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                          <XAxis dataKey="range" stroke="currentColor" className="text-slate-500 dark:text-white/50" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" tickLine={false} axisLine={false} dy={10} />
                          <YAxis stroke="currentColor" className="text-slate-500 dark:text-white/50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} formatter={(value, name, props) => [`${value.toFixed(1)}% (${props.payload.present}/${props.payload.total})`, 'Attendance']} />
                          <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} onClick={handleWeeklyClick} className="cursor-pointer hover:opacity-80 transition-opacity" />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  }

                  // Daily / Custom Bar Chart (Stacked Present/Absent)
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                        <XAxis dataKey="date" stroke="currentColor" className="text-slate-500 dark:text-white/50" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="currentColor" className="text-slate-500 dark:text-white/50" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} />
                        <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" isAnimationActive={false} />
                        <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()
              )}
            </div>
          </div>

          {/* Defaulters Table */}
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-6 shadow-2xl flex flex-col h-[400px] lg:h-auto">
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
