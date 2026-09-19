import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

const TimetablePanel = ({ onBack }) => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    total_classes_per_week: 0,
    active_teachers: 0,
    uploaded_timetables: 0,
    pending_assignments: 0,
  });
  
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cascading Selection States
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [assignClass, setAssignClass] = useState('');
  const [assignTeacher, setAssignTeacher] = useState('');
  
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMsg, setAssignMsg] = useState(null);

  // Activity Log Pagination
  const [activityPage, setActivityPage] = useState(1);
  const [activityData, setActivityData] = useState({ results: [], next: null, previous: null });
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [dashRes, filterRes] = await Promise.all([
          apiClient.get('/api/timetable/dashboard/'),
          apiClient.get('/api/timetable/filters/')
        ]);
        setStats({
          total_classes_per_week: dashRes.data.total_classes_per_week ?? 0,
          active_teachers: dashRes.data.active_teachers ?? 0,
          uploaded_timetables: dashRes.data.uploaded_timetables ?? 0,
          pending_assignments: dashRes.data.pending_assignments ?? 0,
        });
        setFilters(filterRes.data || []);
      } catch (err) {
        console.error('Error fetching dashboard or filters', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const fetchActivities = async (page) => {
    setActivityLoading(true);
    try {
      const { data } = await apiClient.get(`/api/timetable/activity-log/?page=${page}`);
      setActivityData(data);
    } catch {
      setActivityData({ results: [], next: null, previous: null });
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(activityPage);
  }, [activityPage]);

  // Derived Options
  const deptObj = filters.find(d => d.id === parseInt(selectedDept));
  const streams = deptObj?.streams || [];
  const streamObj = streams.find(s => s.id === parseInt(selectedStream));
  const years = streamObj?.years || [];
  const yearObj = years.find(y => y.name === selectedYear);
  const subjects = yearObj?.subjects || [];
  const subjectObj = subjects.find(s => s.id === parseInt(selectedSubject));
  const classes = subjectObj?.classes || [];
  const teachers = deptObj?.teachers || [];

  // Reset downstream selections when a parent changes
  const handleDeptChange = (e) => {
    setSelectedDept(e.target.value);
    setSelectedStream(''); setSelectedYear(''); setSelectedSubject(''); setAssignClass(''); setAssignTeacher('');
  };
  const handleStreamChange = (e) => {
    setSelectedStream(e.target.value);
    setSelectedYear(''); setSelectedSubject(''); setAssignClass('');
  };
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setSelectedSubject(''); setAssignClass('');
  };
  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setAssignClass('');
  };

  const handleAssign = async () => {
    if (!assignClass || !assignTeacher) {
      setAssignMsg({ ok: false, text: 'Please select both a class and a teacher.' });
      return;
    }
    setAssignLoading(true);
    setAssignMsg(null);
    try {
      await apiClient.post('/api/timetable/assign/', { class_id: assignClass, teacher_id: assignTeacher });
      setAssignMsg({ ok: true, text: 'Teacher assigned successfully!' });
      setAssignClass('');
      setAssignTeacher('');
      fetchActivities(1);
      setActivityPage(1);
    } catch {
      setAssignMsg({ ok: false, text: 'Assignment failed. Please try again.' });
    } finally {
      setAssignLoading(false);
    }
  };

  const STAT_CARDS = [
    { label: 'Classes / Week', key: 'total_classes_per_week', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400' },
    { label: 'Active Teachers', key: 'active_teachers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
    { label: 'Uploaded Timetables', key: 'uploaded_timetables', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', color: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
    { label: 'Pending Assignments', key: 'pending_assignments', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'bg-red-500/10 border-red-500/30', text: 'text-red-400' },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-amber-900/10 border border-amber-500/20 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Timetable Incharge Panel</h2>
            <p className="text-amber-300/70 text-sm">Upload timetables and assign teachers to class slots</p>
          </div>
        </div>
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white/80 hover:text-white rounded-xl text-sm font-medium shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Teacher Dashboard
          </button>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className={`rounded-2xl p-5 border ${s.color}`}>
            <svg className={`w-7 h-7 mb-2 ${s.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon} />
            </svg>
            <p className={`text-3xl font-extrabold tracking-tight ${s.text}`}>{stats[s.key]}</p>
            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Upload + Assign ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="font-bold text-white/90">Upload Timetable</h3>
          </div>
          <p className="text-sm text-white/50">Upload a new timetable file for a class (Excel / CSV).</p>
          <label className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-400/50 transition-colors cursor-pointer group">
            <input type="file" accept=".xlsx,.csv" className="hidden" />
            <svg className="w-10 h-10 mx-auto mb-3 text-white/30 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-white/40 text-sm group-hover:text-white/60 transition-colors">Drag & drop or click to upload</p>
            <p className="text-white/20 text-xs mt-1">Supports .xlsx, .csv</p>
          </label>
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-transform transform shadow-lg shadow-blue-500/20">
            Upload File
          </button>
        </div>

        {/* Assign Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-white/90">Assign Teacher to Class</h3>
          </div>
          <p className="text-sm text-white/50">Link a teacher to a subject / class slot in the timetable.</p>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Department</label>
              <select value={selectedDept} onChange={handleDeptChange} className="w-full bg-slate-900/60 text-white/80 rounded-xl px-3 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm">
                <option value="">— Select Dept —</option>
                {filters.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Stream</label>
              <select value={selectedStream} onChange={handleStreamChange} disabled={!selectedDept} className="w-full bg-slate-900/60 text-white/80 rounded-xl px-3 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm disabled:opacity-50">
                <option value="">— Select Stream —</option>
                {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Year</label>
              <select value={selectedYear} onChange={handleYearChange} disabled={!selectedStream} className="w-full bg-slate-900/60 text-white/80 rounded-xl px-3 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm disabled:opacity-50">
                <option value="">— Select Year —</option>
                {years.map(y => <option key={y.name} value={y.name}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Subject</label>
              <select value={selectedSubject} onChange={handleSubjectChange} disabled={!selectedYear} className="w-full bg-slate-900/60 text-white/80 rounded-xl px-3 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm disabled:opacity-50">
                <option value="">— Select Subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Class / Division</label>
              <select value={assignClass} onChange={e => setAssignClass(e.target.value)} disabled={!selectedSubject} className="w-full bg-slate-900/60 text-white/80 rounded-xl px-3 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm disabled:opacity-50">
                <option value="">— Select Class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Assign Teacher</label>
              <select value={assignTeacher} onChange={e => setAssignTeacher(e.target.value)} disabled={!selectedDept} className="w-full bg-slate-900/60 text-white/80 rounded-xl px-3 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm disabled:opacity-50">
                <option value="">— Select Teacher —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {assignMsg && (
            <p className={`text-sm font-semibold px-4 py-2 rounded-xl mt-2 ${assignMsg.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
              {assignMsg.text}
            </p>
          )}

          <button onClick={handleAssign} disabled={assignLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-transform transform shadow-lg shadow-emerald-500/20 mt-4">
            {assignLoading ? 'Assigning...' : 'Assign Teacher'}
          </button>
        </div>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity
        </h3>
        {activityLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-400"></div>
          </div>
        ) : activityData.results.length === 0 ? (
          <p className="text-center py-8 text-white/30 text-sm">
            No recent activity. Timetable uploads and assignments will appear here.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {activityData.results.map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-slate-900/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${r.color || 'bg-amber-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/80">{r.action}</p>
                  <p className="text-xs text-white/40">{r.detail}</p>
                </div>
                <p className="text-xs text-white/30 font-mono whitespace-nowrap">{r.time}</p>
              </div>
            ))}
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <button 
                disabled={!activityData.previous} 
                onClick={() => setActivityPage(p => p - 1)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-white/70"
              >
                Previous
              </button>
              <span className="text-white/40 text-sm font-medium">Page {activityPage}</span>
              <button 
                disabled={!activityData.next} 
                onClick={() => setActivityPage(p => p + 1)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-white/70"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default TimetablePanel;
