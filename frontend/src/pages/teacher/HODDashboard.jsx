import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import PrincipalViewTab from '../principal/PrincipalViewTab';
import PrincipalNoticeBoard from '../principal/PrincipalNoticeBoard';

const YEARS = ['FY', 'SY', 'TY'];

// ─── Mini Bar ───────────────────────────────────────────────────────────────
const MiniBar = ({ pct }) => {
  const good = pct >= 75;
  return (
    <div className="w-full bg-slate-800/60 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          good ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-orange-400'
        }`}
        style={{ width: Math.min(pct, 100) + '%' }}
      />
    </div>
  );
};

// ─── HOD Dashboard ───────────────────────────────────────────────────────────
// Renders as an EMBEDDED TAB inside TeacherDashboard.
// Shows only the HOD's assigned department classes — no programme selector.
const HODDashboard = ({ onBack }) => {
  const { user } = useAuth();

  // HOD's assigned departments come from the API.
  // e.g. ['BCA', 'BVoc']
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClass, setSelectedClass] = useState(null); // e.g. 'FY BCA'
  const [classData, setClassData] = useState({});           // map: 'FY BCA' → { total, present, absent, students:[] }
  const [loadingClass, setLoadingClass] = useState(false);

  // ── Fetch HOD's departments ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchDepts = async () => {
      setLoadingDepts(true);
      try {
        const res = await fetch(`/api/teacher/hod/info/?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDepartments(data.departments || []);
      } catch {
        // Fallback: empty — no departments until API is connected
        setDepartments([]);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, [user]);

  // ── Build class list from departments ────────────────────────────────────
  // e.g. ['BCA', 'BVoc'] → ['FY BCA', 'SY BCA', 'TY BCA', 'FY BVoc', 'SY BVoc', 'TY BVoc']
  const classList = useMemo(() =>
    departments.flatMap(dept => YEARS.map(yr => `${yr} ${dept}`)),
    [departments]
  );

  // ── Fetch class-level stats when a class is selected ────────────────────
  useEffect(() => {
    if (!selectedClass) return;
    if (classData[selectedClass]) return; // already fetched
    const fetchClass = async () => {
      setLoadingClass(true);
      try {
        const [year, dept] = selectedClass.split(' ');
        const res = await fetch(`/api/teacher/hod/class-stats/?email=${encodeURIComponent(user.email)}&year=${year}&dept=${dept}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setClassData(prev => ({ ...prev, [selectedClass]: data }));
      } catch {
        setClassData(prev => ({ ...prev, [selectedClass]: { total: 0, present: 0, absent: 0, students: [] } }));
      } finally {
        setLoadingClass(false);
      }
    };
    fetchClass();
  }, [selectedClass, user]);

  const current = selectedClass ? (classData[selectedClass] || null) : null;

  // ── Summary across all fetched classes ──────────────────────────────────
  const summary = useMemo(() => {
    const entries = Object.values(classData);
    if (!entries.length) return null;
    const total   = entries.reduce((s, c) => s + (c.total   || 0), 0);
    const present = entries.reduce((s, c) => s + (c.present || 0), 0);
    const absent  = entries.reduce((s, c) => s + (c.absent  || 0), 0);
    return { total, present, absent, pct: total ? ((present / total) * 100).toFixed(1) : '0' };
  }, [classData]);

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">

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
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white/80 hover:text-white rounded-xl transition-all text-sm font-medium shrink-0"
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
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
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
        <div className="flex flex-col gap-6 animate-fade-in-up">

          {loadingDepts ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400"></div>
            </div>
          ) : classList.length === 0 ? (
            <div className="text-center py-14 text-white/30 bg-white/5 rounded-3xl border border-white/10">
              <svg className="w-14 h-14 mx-auto mb-4 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
              <p className="font-semibold text-lg mb-1">No departments assigned yet</p>
              <p className="text-sm">Your department assignments will appear after API integration.</p>
            </div>
          ) : (
            <>
              {/* Summary cards (shown once we have fetched data) */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Students', value: summary.total,   color: 'bg-blue-500/10 border-blue-500/30',   text: 'text-white' },
                    { label: 'Present',         value: summary.present, color: 'bg-green-500/10 border-green-500/30', text: 'text-green-400' },
                    { label: 'Absent',          value: summary.absent,  color: 'bg-red-500/10 border-red-500/30',     text: 'text-red-400' },
                    { label: 'Avg Attendance',  value: summary.pct + '%', color: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400' },
                  ].map(c => (
                    <div key={c.label} className={`rounded-2xl p-5 border ${c.color}`}>
                      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">{c.label}</p>
                      <p className={`text-3xl font-extrabold tracking-tight ${c.text}`}>{c.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Class Cards Grid — FY BCA, SY BCA, TY BCA, FY BVoc ... */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {classList.map(cls => {
                  const data = classData[cls];
                  const pct  = data?.total ? ((data.present / data.total) * 100).toFixed(1) : null;
                  return (
                    <button
                      key={cls}
                      onClick={() => { setSelectedClass(cls); setActiveTab('class'); }}
                      className="bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 text-left transition-all group shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5"
                    >
                      <p className="font-extrabold text-lg text-white mb-2 group-hover:text-purple-300 transition-colors">{cls}</p>
                      {data ? (
                        <>
                          <div className="flex justify-between text-xs text-white/50 mb-2">
                            <span>{data.total} students</span>
                            <span className={pct >= 75 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{pct}%</span>
                          </div>
                          <MiniBar pct={parseFloat(pct)} />
                        </>
                      ) : (
                        <p className="text-xs text-white/30 mt-1">Click to load stats</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CLASS VIEW TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'class' && (
        <div className="flex flex-col gap-6 animate-fade-in-up">

          {/* Class Selector Tabs — ONLY the HOD's classes */}
          {classList.length > 0 && (
            <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10">
              {classList.map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
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
          ) : current ? (
            <div className="flex flex-col gap-5">
              {/* Class Header */}
              <div className="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-white">{selectedClass}</h3>
                  <p className="text-purple-300/60 text-sm mt-0.5">{current.total} enrolled students</p>
                </div>
                <div className="flex gap-4">
                  {[
                    { label: 'Present', value: current.present, color: 'text-green-400' },
                    { label: 'Absent',  value: current.absent,  color: 'text-red-400' },
                    { label: 'Att %',   value: current.total ? ((current.present / current.total) * 100).toFixed(1) + '%' : '—', color: 'text-purple-300' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-white/40 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student List */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3">Roll No</th>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Attended</th>
                      <th className="px-5 py-3">Total</th>
                      <th className="px-5 py-3">Attendance</th>
                      <th className="px-5 py-3 w-40">Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(current.students || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-10 text-center text-white/30 text-sm">
                          No student data yet. Will populate from API.
                        </td>
                      </tr>
                    ) : current.students.map(s => {
                      const pct = s.total ? ((s.attended / s.total) * 100).toFixed(1) : 0;
                      return (
                        <tr key={s.roll} className={`border-t border-white/5 hover:bg-white/5 transition-colors ${pct < 75 ? 'bg-red-900/10' : ''}`}>
                          <td className="px-5 py-3 font-mono text-purple-300 text-xs">{s.roll}</td>
                          <td className="px-5 py-3 font-semibold text-white/90">{s.name}</td>
                          <td className="px-5 py-3 text-green-400 font-bold">{s.attended}</td>
                          <td className="px-5 py-3 text-white/60">{s.total}</td>
                          <td className="px-5 py-3">
                            <span className={`text-sm font-extrabold ${pct >= 75 ? 'text-green-400' : 'text-red-400'}`}>{pct}%</span>
                          </td>
                          <td className="px-5 py-3"><MiniBar pct={parseFloat(pct)} /></td>
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

      {/* ── NOTICES TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'notices' && <PrincipalNoticeBoard />}

    </div>
  );
};

export default HODDashboard;
