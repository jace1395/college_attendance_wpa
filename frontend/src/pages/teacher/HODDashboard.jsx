import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import StudentAttendanceModal from '../../components/shared/StudentAttendanceModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const YEARS = ['FY', 'SY', 'TY'];

// ─── Mini Bar ───────────────────────────────────────────────────────────────
const MiniBar = ({ pct }) => {
  const good = pct >= 75;

  return (
    <div className="w-full bg-slate-800/60 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full ${
          good ? 'bg-linear-to-r from-green-500 to-emerald-400' : 'bg-linear-to-r from-red-500 to-orange-400'
        }`}
        style={{ width: Math.min(pct, 100) + '%' }}
      />
    </div>
  );
};

// ─── HOD Dashboard ───────────────────────────────────────────────────────────
const HODDashboard = ({ onBack }) => {
  const { user } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [chartFilter, setChartFilter] = useState('daily');
  
  // Overview Stats
  const [overviewData, setOverviewData] = useState({});
  const [loadingOverview, setLoadingOverview] = useState(false);
  
  // Class Details
  const [classDataDetails, setClassDataDetails] = useState({});
  const [loadingClass, setLoadingClass] = useState(false);

  // Time Filters
  const [period, setPeriod] = useState('overall'); // 'today', 'week', 'month', 'overall', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ── Fetch HOD's departments ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchDepts = async () => {
      setLoadingDepts(true);
      try {
        const { data } = await apiClient.get('/api/teacher/hod/info/');
        setDepartments(data.departments || []);
      } catch {
        setDepartments([]);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, [user]);

  const classList = useMemo(() =>
    departments.flatMap(dept => YEARS.map(yr => `${yr} ${dept}`)),
    [departments]
  );

  // ── Fetch Overview Stats ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingOverview(true);
      try {
        const params = { period };
        if (period === 'custom') {
          params.start_date = startDate;
          params.end_date = endDate;
        }
        const { data } = await apiClient.get('/api/teacher/hod/overview-stats/', { params });
        setOverviewData(data);
      } catch {
        setOverviewData({});
      } finally {
        setLoadingOverview(false);
      }
    };
    fetchOverview();
  }, [period, startDate, endDate]);

  // ── Fetch Detailed Class Stats ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedClass) return;
    const fetchClass = async () => {
      setLoadingClass(true);
      try {
        const [year, dept] = selectedClass.split(' ');
        const params = { year, dept, period };
        if (period === 'custom') {
          params.start_date = startDate;
          params.end_date = endDate;
        }
        const { data } = await apiClient.get('/api/teacher/hod/class-stats/', { params });
        setClassDataDetails(prev => ({ ...prev, [selectedClass]: data }));
      } catch {
        setClassDataDetails(prev => ({ ...prev, [selectedClass]: { total: 0, present: 0, absent: 0, students: [] } }));
      } finally {
        setLoadingClass(false);
      }
    };
    fetchClass();
  }, [selectedClass, period, startDate, endDate]);

  const currentDetail = selectedClass ? (classDataDetails[selectedClass] || null) : null;

  const chartData = useMemo(() => {
    if (!currentDetail || !currentDetail.daily_records || currentDetail.daily_records.length === 0) return [];
    const sorted = [...currentDetail.daily_records].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (chartFilter === 'weekly') {
      const weeksMap = {};
      sorted.forEach(record => {
        const d = new Date(record.date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0,0,0,0);
        const key = monday.toISOString().split('T')[0];
        
        if (!weeksMap[key]) {
           weeksMap[key] = { present: 0, absent: 0, startDate: monday };
        }
        weeksMap[key].present += record.present;
        weeksMap[key].absent += record.absent;
      });

      return Object.keys(weeksMap).sort().map(k => {
        const w = weeksMap[k];
        const total = w.present + w.absent;
        const endStr = new Date(w.startDate);
        endStr.setDate(endStr.getDate() + 6);
        
        const sStr = w.startDate.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        const eStr = endStr.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        return {
          date: `${sStr} - ${eStr}`,
          present: w.present,
          absent: w.absent,
          total,
          percentage: total > 0 ? (w.present / total) * 100 : 0
        };
      });
    }

    if (chartFilter === 'monthly') {
      const months = {};
      sorted.forEach((record) => {
        const d = new Date(record.date);
        const monthKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!months[monthKey]) months[monthKey] = { present: 0, absent: 0 };
        months[monthKey].present += record.present;
        months[monthKey].absent += record.absent;
      });
      return Object.keys(months).map(m => {
        const total = months[m].present + months[m].absent;
        return {
          date: m,
          present: months[m].present,
          absent: months[m].absent,
          total: total,
          percentage: total > 0 ? (months[m].present / total) * 100 : 0
        };
      });
    }

    // Default: daily or custom
    return sorted.map(record => {
      const total = record.present + record.absent;
      return {
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: record.present,
        absent: record.absent,
        total: total,
        percentage: total > 0 ? (record.present / total) * 100 : 0
      };
    });
  }, [currentDetail, chartFilter]);

  // ── Summary across all departments ───────────────────────────────────────
  const summary = useMemo(() => {
    const entries = Object.values(overviewData);
    if (!entries.length) return null;
    const total   = entries.reduce((s, c) => s + (c.total   || 0), 0);
    const present = entries.reduce((s, c) => s + (c.present || 0), 0);
    const absent  = entries.reduce((s, c) => s + (c.absent  || 0), 0);
    return { total, present, absent, pct: total ? ((present / total) * 100).toFixed(1) : '0' };
  }, [overviewData]);

  const getAttColor = (pct) => {
    if (pct >= 85) return 'text-emerald-400';
    if (pct >= 75) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getBarColor = (pct) => {
    if (pct >= 85) return 'from-emerald-500 to-green-400';
    if (pct >= 75) return 'from-amber-500 to-yellow-400';
    return 'from-rose-500 to-red-400';
  };

  if (selectedStudent) {
    return (
      <StudentAttendanceModal 
         studentId={selectedStudent} 
         apiEndpoint={`/api/teacher/hod/student/${selectedStudent}/report/`}
         onBack={() => setSelectedStudent(null)} 
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-purple-900/10 border border-purple-500/20 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">HOD Panel</h2>
            <p className="text-purple-300/70 text-sm">
              {departments.length > 0
                ? `Departments: ${departments.join(', ')} — Full oversight view`
                : 'Loading your department assignments...'}
            </p>
          </div>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-300/50 dark:bg-white/10 hover:bg-white/15 border border-slate-400/60 dark:border-white/20 text-slate-700 dark:text-white/80 hover:text-white rounded-xl text-sm font-medium shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Teacher Dashboard
          </button>
        )}
      </div>

      {/* ── Sub-Tab Navigation ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 bg-white/80 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-300/60 dark:border-white/10 shadow-sm">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'class',    label: 'Class View' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-600 dark:text-white/60 hover:text-white hover:bg-slate-200/50 dark:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          
          {/* Time Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-200/50 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 rounded-2xl">
             <div className="flex items-center gap-2 text-slate-700 dark:text-white/80 font-medium">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
               <span>Filter Range:</span>
             </div>
             <select 
               value={period} 
               onChange={(e) => setPeriod(e.target.value)}
               className="bg-white/90 dark:bg-slate-900 border border-slate-400/60 dark:border-white/20 text-slate-800 dark:text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
             >
               <option value="overall">All-Time Overall</option>
               <option value="today">Today</option>
               <option value="week">This Week</option>
               <option value="month">This Month</option>
               <option value="custom">Custom Range</option>
             </select>
             
             {period === 'custom' && (
               <div className="flex items-center gap-2">
                 <input 
                   type="date" 
                   value={startDate}
                   onChange={e => setStartDate(e.target.value)}
                   className="bg-white/90 dark:bg-slate-900 border border-slate-400/60 dark:border-white/20 text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent scheme-dark"
                 />
                 <span className="text-slate-500 dark:text-white/50">to</span>
                 <input 
                   type="date" 
                   value={endDate}
                   onChange={e => setEndDate(e.target.value)}
                   className="bg-white/90 dark:bg-slate-900 border border-slate-400/60 dark:border-white/20 text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent scheme-dark"
                 />
               </div>
             )}
          </div>

          {loadingDepts || loadingOverview ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400"></div>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-14 text-slate-400 dark:text-white/30 bg-slate-200/50 dark:bg-white/5 rounded-3xl border border-slate-300/60 dark:border-white/10">
              <p className="font-semibold text-lg mb-1">No departments assigned yet</p>
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Students', value: summary.total,   color: 'bg-blue-500/10 border-blue-500/30',   text: 'text-slate-900 dark:text-white' },
                    { label: 'Above 75%',      value: summary.present, color: 'bg-green-500/10 border-green-500/30', text: 'text-green-400' },
                    { label: 'Below 75%',      value: summary.absent,  color: 'bg-red-500/10 border-red-500/30',     text: 'text-red-400' },
                    { label: 'Avg Attendance', value: summary.pct + '%', color: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400' },
                  ].map(c => (
                    <div key={c.label} className={`rounded-2xl p-5 border ${c.color}`}>
                      <p className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-wider font-semibold mb-1">{c.label}</p>
                      <p className={`text-3xl font-extrabold tracking-tight ${c.text}`}>{c.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Structured Side-by-Side Department View */}
              <div className={`grid grid-cols-1 md:grid-cols-${Math.min(departments.length, 3)} gap-6`}>
                {departments.map(dept => (
                  <div key={dept} className="flex flex-col gap-4 bg-white/70 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-300/50 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-2 px-2">
                       <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                       <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">{dept} Department</h3>
                    </div>
                    {YEARS.map(yr => {
                      const cls = `${yr} ${dept}`;
                      const data = overviewData[cls];
                      const pct = data?.total ? ((data.present / data.total) * 100).toFixed(1) : null;
                      
                      return (
                        <button
                          key={cls}
                          onClick={() => { setSelectedClass(cls); setActiveTab('class'); }}
                          className="bg-slate-200/50 dark:bg-white/5 hover:bg-purple-500/10 border border-slate-300/60 dark:border-white/10 hover:border-purple-500/30 rounded-2xl p-5 text-left group shadow-lg hover:shadow-purple-500/10 transition-all duration-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                             <p className="font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">{cls}</p>
                             {data && <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ${pct >= 75 ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>{pct}%</span>}
                          </div>
                          
                          {data ? (
                            <>
                              <div className="flex justify-between text-xs text-slate-600 dark:text-white/50 mb-3">
                                <span>Total Students: {data.total}</span>
                                <span><span className="text-green-600 dark:text-green-400 font-medium">Safe: {data.present}</span> | <span className="text-red-600 dark:text-red-400 font-medium">Danger: {data.absent}</span></span>
                              </div>
                              <MiniBar pct={parseFloat(pct)} />
                            </>
                          ) : (
                            <p className="text-xs text-slate-400 dark:text-white/30 mt-1">No data for selected period</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CLASS VIEW TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'class' && (
        <div className="flex flex-col gap-6 animate-fade-in">

          {classList.length > 0 && (
            <div className="flex flex-wrap gap-2 bg-white/80 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-300/60 dark:border-white/10">
              {classList.map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    selectedClass === cls
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-slate-600 dark:text-white/60 hover:text-white hover:bg-slate-200/50 dark:bg-white/5'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          )}

          {!selectedClass ? (
            <div className="text-center py-14 text-slate-400 dark:text-white/30 bg-slate-200/50 dark:bg-white/5 rounded-3xl border border-slate-300/60 dark:border-white/10">
              Select a class above to view detailed attendance.
            </div>
          ) : loadingClass ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400"></div>
            </div>
          ) : currentDetail ? (
            <div className="flex flex-col gap-6">
              <div className="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{selectedClass}</h3>
                  <p className="text-purple-300/60 text-sm mt-0.5">{currentDetail.total} enrolled students</p>
                </div>
                <div className="flex gap-4">
                  {[
                    { label: 'Present', value: currentDetail.present, color: 'text-green-400' },
                    { label: 'Absent',  value: currentDetail.absent,  color: 'text-red-400' },
                    { label: 'Att %',   value: currentDetail.total ? ((currentDetail.present / currentDetail.total) * 100).toFixed(1) + '%' : '—', color: 'text-purple-300' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="bg-white/70 dark:bg-slate-900/40 border border-slate-300/50 dark:border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Attendance Trend</h4>
                    <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-300/60 dark:border-white/10">
                      {['daily', 'weekly', 'monthly', 'custom'].map(f => (
                        <button
                          key={f}
                          onClick={() => setChartFilter(f)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                            chartFilter === f ? 'bg-purple-600 text-white shadow' : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:text-white/80'
                          }`}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-75 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickFormatter={(val) => Math.round(val)} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
                        <Area type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorAbsent)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="bg-slate-200/50 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-white/40 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3">Roll No</th>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Attended</th>
                      <th className="px-5 py-3">Total</th>
                      <th className="px-5 py-3">Attendance</th>
                      <th className="px-5 py-3 w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentDetail.students || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-10 text-center text-slate-400 dark:text-white/30 text-sm">
                          No student data yet.
                        </td>
                      </tr>
                    ) : currentDetail.students.map(s => {
                      const pct = s.total ? ((s.attended / s.total) * 100).toFixed(1) : 0;
                      return (
                        <tr key={s.roll} onClick={() => setSelectedStudent(s.id)} className={`border-t border-slate-300/50 dark:border-white/5 hover:bg-slate-300/50 dark:bg-white/10 cursor-pointer transition-colors ${pct < 75 ? 'bg-red-900/10' : ''}`}>
                          <td className="px-5 py-3 font-mono text-purple-300 text-xs">{s.roll}</td>
                          <td className="px-5 py-3 font-semibold text-slate-800 dark:text-white/90">{s.name}</td>
                          <td className="px-5 py-3 text-green-400 font-bold">{s.attended}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-white/60">{s.total}</td>
                          <td className="px-5 py-3">
                            <span className={`text-sm font-extrabold ${getAttColor(pct)}`}>{pct}%</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedStudent(s.id); }}
                              className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 hover:text-white rounded-lg text-xs font-bold border border-emerald-500/20"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default HODDashboard;
