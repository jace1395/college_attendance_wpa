import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "../../components/shared/ThemeToggle";
// Overview-only tab — Edit, Reschedule, and Monitor have been removed per spec
const STATS = [
  { label: "Total Classes/Week",    value: 0, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400" },
  { label: "Active Teachers",       value: 0, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" },
  { label: "Uploaded Timetables",   value: 0, icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12", color: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" },
  { label: "Pending Assignments",   value: 0, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "bg-red-500/10 border-red-500/30", text: "text-red-400" },
];

const TimetableDashboard = ({ embedded = false, onBack }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(STATS);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Assign state
  const [filters, setFilters] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/timetable/dashboard/?email=${user.email}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStats(prev => prev.map((s, i) => ({
          ...s,
          value: [
            data.total_classes_per_week,
            data.active_teachers,
            data.uploaded_timetables,
            data.pending_assignments,
          ][i] ?? 0
        })));
        
        // Fetch filters
        const filterRes = await fetch('/api/timetable/filters/');
        if (filterRes.ok) {
          const filterData = await filterRes.json();
          setFilters(filterData);
        }
      } catch (e) {
        console.error("Dashboard data load error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const res = await fetch(`/api/timetable/activity-log/?page=${page}`);
        if (res.ok) {
          const data = await res.json();
          setRecentActivity(data.results || []);
          setTotalPages(Math.ceil(data.count / 5) || 1);
        }
      } catch (e) {
        setRecentActivity([]);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [user, page]);

  const handleAssign = async () => {
    if (!selectedClass || !selectedTeacher) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/timetable/assign/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ class_id: selectedClass, teacher_id: selectedTeacher })
      });
      if (res.ok) {
        setSelectedDept("");
        setSelectedStream("");
        setSelectedYear("");
        setSelectedSubject("");
        setSelectedClass("");
        setSelectedTeacher("");
        setPage(1); // Reset page to trigger log refresh
        alert('Assigned successfully!');
      } else {
        alert('Assignment failed.');
      }
    } catch (e) {
      alert('Error occurred.');
    } finally {
      setAssigning(false);
    }
  };

  // Derived filter options based on selection
  const deptData = filters.find(d => d.id == selectedDept);
  const currentStreams = deptData ? deptData.streams : [];
  const streamData = currentStreams.find(s => s.id == selectedStream);
  const currentYears = streamData ? streamData.years : [];
  const yearData = currentYears.find(y => y.name === selectedYear);
  const currentSubjects = yearData ? yearData.subjects : [];
  const subjectData = currentSubjects.find(s => s.id == selectedSubject);
  const currentClasses = subjectData ? subjectData.classes : [];
  const currentTeachers = deptData ? deptData.teachers : [];

  // When embedded inside TeacherDashboard, render as a clean panel
  if (embedded) {
    return (
      <div className=" flex flex-col gap-6">

        {/* Embedded Panel Header with Back Button */}
        <div className="bg-amber-900/10 border border-amber-500/20 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Timetable Incharge Panel</h2>
              <p className="text-amber-300/70 text-sm">Upload and assign class timetables for your department</p>
            </div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white/80 hover:text-white rounded-xl  text-sm font-medium shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Teacher Dashboard
            </button>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className={"rounded-2xl p-5 border relative overflow-hidden " + s.color}>
              <svg className={"w-8 h-8 mb-3 " + s.text} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon}/>
              </svg>
              <p className={"text-3xl font-extrabold tracking-tight " + s.text}>{s.value}</p>
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Upload / Assign */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl"><svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg></div>
              <h3 className="font-bold text-white/90">Upload Timetable</h3>
            </div>
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-400/50 transition-colors cursor-pointer">
              <svg className="w-10 h-10 mx-auto mb-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              <p className="text-white/40 text-sm">Drag & drop or click to upload (.xlsx, .csv)</p>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold  shadow-lg shadow-blue-500/20">Upload File</button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl"><svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
              <h3 className="font-bold text-white/90">Assign Teacher to Class</h3>
            </div>
            <div className="flex flex-col gap-3">
              <select className="w-full bg-slate-900/60 text-white/80 rounded-xl px-4 py-2.5 border border-white/10 outline-none focus:border-emerald-500 text-sm appearance-none"><option value="">— Select a class —</option></select>
              <select className="w-full bg-slate-900/60 text-white/80 rounded-xl px-4 py-2.5 border border-white/10 outline-none focus:border-emerald-500 text-sm appearance-none"><option value="">— Select a teacher —</option></select>
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold  shadow-lg shadow-emerald-500/20 mt-auto">Assign</button>
          </div>
        </div>

      </div>
    );
  }

  // Full-page standalone mode
  return (
    <div
      className="min-h-screen text-white bg-cover bg-fixed"
      style={{ backgroundImage: "url('/imgs/login-signup.jpg')" }}
    >
      <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6 min-h-screen">
        <Link to="/teacher/dashboard" className="text-blue-400 hover:text-blue-300 mb-6 inline-flex items-center gap-2 font-medium w-fit">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>


        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-xl border border-amber-500/20">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Timetable Incharge</h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-amber-500/20 border-amber-500/40 text-amber-300">
                Dashboard
              </span>
            </div>
            <p className="text-sm text-white/40 ml-11">Welcome, {user?.name || "Timetable Incharge"} | Upload and assign class timetables</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl border border-red-500/30 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className={"rounded-2xl p-5 border relative overflow-hidden " + s.color}>
              <svg className={"w-8 h-8 mb-3 " + s.text} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon}/>
              </svg>
              <p className={"text-3xl font-extrabold tracking-tight " + s.text}>{s.value}</p>
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Upload / Assign Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Timetable Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
              </div>
              <h3 className="font-bold text-white/90">Upload Timetable</h3>
            </div>
            <p className="text-sm text-white/50">Upload a new timetable file (Excel/CSV) for a class or programme.</p>
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-400/50 transition-colors cursor-pointer">
              <svg className="w-10 h-10 mx-auto mb-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p className="text-white/40 text-sm">Drag & drop or click to upload</p>
              <p className="text-white/20 text-xs mt-1">Supports .xlsx, .csv</p>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-transform transform shadow-lg shadow-blue-500/20">
              Upload File
            </button>
          </div>

          {/* Assign Timetable Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h3 className="font-bold text-white/90">Assign Teacher to Class</h3>
            </div>
            <p className="text-sm text-white/50">Link a teacher to a subject/class slot in the timetable.</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Department</label>
                <select 
                  value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setSelectedStream(""); setSelectedYear(""); setSelectedSubject(""); setSelectedClass(""); setSelectedTeacher(""); }}
                  className="w-full bg-slate-900/60 text-white/80 rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm appearance-none"
                >
                  <option value="">— Select Dept —</option>
                  {filters.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Stream</label>
                <select 
                  value={selectedStream} onChange={e => { setSelectedStream(e.target.value); setSelectedYear(""); setSelectedSubject(""); setSelectedClass(""); setSelectedTeacher(""); }}
                  className="w-full bg-slate-900/60 text-white/80 rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm appearance-none"
                  disabled={!selectedDept}
                >
                  <option value="">— Select Stream —</option>
                  {currentStreams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Year</label>
                <select 
                  value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setSelectedSubject(""); setSelectedClass(""); setSelectedTeacher(""); }}
                  className="w-full bg-slate-900/60 text-white/80 rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm appearance-none"
                  disabled={!selectedStream}
                >
                  <option value="">— Select Year —</option>
                  {currentYears.map(y => <option key={y.name} value={y.name}>{y.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Subject</label>
                <select 
                  value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedClass(""); setSelectedTeacher(""); }}
                  className="w-full bg-slate-900/60 text-white/80 rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm appearance-none"
                  disabled={!selectedYear}
                >
                  <option value="">— Select Subject —</option>
                  {currentSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Class</label>
                <select 
                  value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-900/60 text-white/80 rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm appearance-none"
                  disabled={!selectedSubject}
                >
                  <option value="">— Select Class —</option>
                  {currentClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Teacher</label>
                <select 
                  value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}
                  className="w-full bg-slate-900/60 text-white/80 rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-emerald-500 text-sm appearance-none"
                  disabled={!selectedClass}
                >
                  <option value="">— Select Teacher —</option>
                  {currentTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleAssign}
              disabled={!selectedClass || !selectedTeacher || assigning}
              className={`w-full py-3 rounded-xl font-bold transition-transform transform shadow-lg mt-auto ${
                !selectedClass || !selectedTeacher || assigning 
                ? 'bg-slate-700 text-white/50 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              }`}
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Recent Activity
            </h3>
            <div className="flex gap-2">
              <button 
                disabled={page === 1 || loadingLogs}
                onClick={() => setPage(p => p - 1)}
                className="px-2 py-1 bg-white/10 rounded hover:bg-white/20 disabled:opacity-50 text-xs text-white"
              >Prev</button>
              <span className="text-xs text-white/50 py-1">Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages || loadingLogs}
                onClick={() => setPage(p => p + 1)}
                className="px-2 py-1 bg-white/10 rounded hover:bg-white/20 disabled:opacity-50 text-xs text-white"
              >Next</button>
            </div>
          </div>
          
          {loadingLogs ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-400"></div>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">
              No recent activity. Timetable uploads and assignments will appear here.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentActivity.map((r, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-slate-900/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-lg ${r.color || "bg-amber-500"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/80">{r.action}</p>
                    <p className="text-xs text-white/40">{r.detail}</p>
                  </div>
                  <p className="text-xs text-white/30 font-mono whitespace-nowrap">{r.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TimetableDashboard;