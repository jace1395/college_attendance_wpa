import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import PrincipalNoticeBoard from '../principal/PrincipalNoticeBoard';
import MenteeReportView from './MenteeReportView';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const YEARS = ['FY', 'SY', 'TY'];

// ─── Mini Bar ───────────────────────────────────────────────────────────────
const MiniBar = ({ pct }) => {
  const good = pct >= 75;
  return (
    <div className="w-full bg-slate-800/60 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full ${
          good ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-orange-400'
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
          date: `${startStr} - ${endStr}`,
          present, absent, total,
          percentage: total > 0 ? (present / total) * 100 : 0
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

    // Default: daily
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
            <h2 className="text-xl font-bold text-white">HOD Panel</h2>
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
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white/80 hover:text-white rounded-xl text-sm font-medium shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Teacher Dashboard
          </button>
        )}
      </div>

      {/* ── Sub-Tab Navigation ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 shadow-sm">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'class',    label: 'Class View' },
          { key: 'notices',  label: 'Notices' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
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
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
             <div className="flex items-center gap-2 text-white/80 font-medium">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
               <span>Filter Range:</span>
             </div>
             <select 
               value={period} 
               onChange={(e) => setPeriod(e.target.value)}
               className="bg-slate-900 border border-white/20 text-white rounded-xl px-4 py-2 outline-none focus:border-purple-500"
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
                   className="bg-slate-900 border border-white/20 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500 [color-scheme:dark]"
                 />
                 <span className="text-white/50">to</span>
                 <input 
                   type="date" 
                   value={endDate}
                   onChange={e => setEndDate(e.target.value)}
                   className="bg-slate-900 border border-white/20 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500 [color-scheme:dark]"
                 />
               </div>
             )}
          </div>

          {loadingDepts || loadingOverview ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400"></div>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-14 text-white/30 bg-white/5 rounded-3xl border border-white/10">
              <p className="font-semibold text-lg mb-1">No departments assigned yet</p>
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Students', value: summary.total,   color: 'bg-blue-500/10 border-blue-500/30',   text: 'text-white' },
                    { label: 'Above 75%',      value: summary.present, color: 'bg-green-500/10 border-green-500/30', text: 'text-green-400' },
                    { label: 'Below 75%',      value: summary.absent,  color: 'bg-red-500/10 border-red-500/30',     text: 'text-red-400' },
                    { label: 'Avg Attendance', value: summary.pct + '%', color: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400' },
                  ].map(c => (
                    <div key={c.label} className={`rounded-2xl p-5 border ${c.color}`}>
                      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">{c.label}</p>
                      <p className={`text-3xl font-extrabold tracking-tight ${c.text}`}>{c.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Structured Side-by-Side Department View */}
              <div className={`grid grid-cols-1 md:grid-cols-${Math.min(departments.length, 3)} gap-6`}>
                {departments.map(dept => (
                  <div key={dept} className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2 px-2">
                       <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                       <h3 className="text-xl font-bold text-white tracking-wide">{dept} Department</h3>
                    </div>
                    {YEARS.map(yr => {
                      const cls = `${yr} ${dept}`;
                      const data = overviewData[cls];
                      const pct = data?.total ? ((data.present / data.total) * 100).toFixed(1) : null;
                      
                      return (
                        <button
                          key={cls}
                          onClick={() => { setSelectedClass(cls); setActiveTab('class'); }}
                          className="bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 text-left group shadow-lg hover:shadow-purple-500/10 transition-all duration-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                             <p className="font-extrabold text-lg text-white group-hover:text-purple-300 transition-colors">{cls}</p>
                             {data && <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ${pct >= 75 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{pct}%</span>}
                          </div>
                          
                          {data ? (
                            <>
                              <div className="flex justify-between text-xs text-white/50 mb-3">
                                <span>Total Students: {data.total}</span>
                                <span><span className="text-green-400 font-medium">Safe: {data.present}</span> | <span className="text-red-400 font-medium">Danger: {data.absent}</span></span>
                              </div>
                              <MiniBar pct={parseFloat(pct)} />
                            </>
                          ) : (
                            <p className="text-xs text-white/30 mt-1">No data for selected period</p>
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
          {selectedStudent ? (
             <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5">
                <MenteeReportView 
                   menteeId={selectedStudent} 
                   apiEndpoint={`/api/teacher/hod/student/${selectedStudent}/report/`}
                   onBack={() => setSelectedStudent(null)} 
                />
             </div>
          ) : (
            <>
          {classList.length > 0 && (
            <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10">
              {classList.map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    selectedClass === cls
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          )}

          {!selectedClass ? (
            <div className="text-center py-14 text-white/30 bg-white/5 rounded-3xl border border-white/10">
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
                  <h3 className="text-2xl font-extrabold text-white">{selectedClass}</h3>
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
                      <p className="text-xs text-white/40 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
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
                        <td colSpan="6" className="px-5 py-10 text-center text-white/30 text-sm">
                          No student data yet.
                        </td>
                      </tr>
                    ) : currentDetail.students.map(s => {
                      const pct = s.total ? ((s.attended / s.total) * 100).toFixed(1) : 0;
                      return (
                        <tr key={s.roll} onClick={() => setSelectedStudent(s.id)} className={`border-t border-white/5 hover:bg-white/10 cursor-pointer transition-colors ${pct < 75 ? 'bg-red-900/10' : ''}`}>
                          <td className="px-5 py-3 font-mono text-purple-300 text-xs">{s.roll}</td>
                          <td className="px-5 py-3 font-semibold text-white/90">{s.name}</td>
                          <td className="px-5 py-3 text-green-400 font-bold">{s.attended}</td>
                          <td className="px-5 py-3 text-white/60">{s.total}</td>
                          <td className="px-5 py-3">
                            <span className={`text-sm font-extrabold ${pct >= 75 ? 'text-green-400' : 'text-red-400'}`}>{pct}%</span>
                          </td>
                          <td className="px-5 py-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedStudent(s.id); }}
                              className="text-xs px-4 py-1.5 bg-white/5 hover:bg-white/20 border border-white/10 rounded-lg font-semibold transition-colors shadow-sm"
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
          </>
          )}
        </div>
      )}

      {/* ── NOTICES TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'notices' && <PrincipalNoticeBoard />}

    </div>
  );
};

export default HODDashboard;
