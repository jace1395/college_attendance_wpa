import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import DownloadButton from '../../components/shared/DownloadButton';
import ThemeToggle from '../../components/shared/ThemeToggle';

/* ─── Mock Data ─────────────────────────────────────────────────────────── */
const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const STATUSES = ['P', 'A', 'OD', 'NI'];
const STATUS_STYLES = {
  P:  { bg: 'bg-green-600/80',  text: 'text-green-200',  label: 'Present' },
  A:  { bg: 'bg-red-600/80',    text: 'text-red-200',    label: 'Absent' },
  OD: { bg: 'bg-blue-600/80',   text: 'text-blue-200',   label: 'On Duty / Leave' },
  NI: { bg: 'bg-white/10',      text: 'text-white/40',   label: 'Non-Instructional' },
};

// Generate mock monthly grid data per student
const MOCK_STUDENTS = [
  { roll: '2511001', name: 'Alice Johnson' },
  { roll: '2511002', name: 'Bob Smith' },
  { roll: '2511003', name: 'Carol White' },
  { roll: '2511004', name: 'David Brown' },
  { roll: '2511008', name: 'Arjun Sharma' },
  { roll: '2511012', name: 'Priya Nair' },
];

const generateGrid = (periods) => {
  const pool = ['P', 'P', 'P', 'A', 'OD', 'NI'];
  const grid = {};
  MOCK_STUDENTS.forEach(s => {
    grid[s.roll] = {};
    periods.forEach(m => {
      grid[s.roll][m] = pool[Math.floor(Math.random() * pool.length)];
    });
  });
  return grid;
};

const MOCK_TEACHER = {
  teacher: { name: 'Sumit Kumar', email: 'sumit.kumar@vvm.edu.in', department: 'BVoc', current_semester: 3, available_semesters: [1, 2, 3] },
  assigned_classes: [
    { class_id: 'BVC_SEM3_WD', subject_name: 'Web Development', class_name: 'SY BVoc(ST)', classes_conducted: 20, avg_attendance: 82.5, division: 'A', total_students: 60 },
    { class_id: 'BVC_SEM3_SE', subject_name: 'Software Engineering', class_name: 'SY BVoc(ST)', classes_conducted: 18, avg_attendance: 65.0, division: 'B', total_students: 55 },
    { class_id: 'BVC_SEM1_IT', subject_name: 'IT Fundamentals', class_name: 'FY BVoc(ST)', classes_conducted: 22, avg_attendance: 90.2, division: 'A', total_students: 58 },
  ],
  defaulters: [
    { roll: '2511008', name: 'Arjun Sharma', subject: 'Web Development', percentage: 58.3, classes_missed: 8 },
    { roll: '2511012', name: 'Priya Nair', subject: 'Software Engineering', percentage: 44.4, classes_missed: 10 },
    { roll: '2511019', name: 'Rahul Desai', subject: 'Web Development', percentage: 70.0, classes_missed: 6 },
    { roll: '2511031', name: 'Sneha Gupta', subject: 'Software Engineering', percentage: 55.5, classes_missed: 8 },
  ],
  monitoring_duties: [
    { duty_id: 'MON_101', time_start: '09:15', time_end: '10:15', room: 'F101 (FY B.Voc)', total_students: 60, status: 'pending' },
  ],
  pending_tickets: [
    { ticket_id: 'TKT_001', student_name: 'Arjun Sharma', roll: '2511008', date: '2026-08-28', subject: 'Web Development', reason: 'I was present in class but my attendance was marked absent due to a system error.' },
    { ticket_id: 'TKT_002', student_name: 'Priya Nair', roll: '2511012', date: '2026-08-27', subject: 'Software Engineering', reason: 'I submitted a medical certificate for that day. Please reconsider.' },
  ],
};

const LINE_COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#a78bfa'];

/* ─── Attendance Grid Legend ─────────────────────────────────────────────── */
const AttendanceLegend = () => (
  <div className="flex flex-wrap gap-3 mb-4">
    {Object.entries(STATUS_STYLES).map(([key, val]) => (
      <div key={key} className="flex items-center gap-1.5">
        <span className={`w-6 h-6 rounded text-xs font-black flex items-center justify-center ${val.bg} ${val.text}`}>{key}</span>
        <span className="text-white/50 text-xs">{val.label}</span>
      </div>
    ))}
  </div>
);

/* ─── Subject Attendance Card ────────────────────────────────────────────── */
const SubjectAttendanceCard = ({ cls }) => {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('Monthly'); // 'Daily', 'Weekly', 'Monthly'
  
  const [monthlyGrid] = useState(() => generateGrid(MONTHS));
  const [weeklyGrid]  = useState(() => generateGrid(['Week 1', 'Week 2', 'Week 3', 'Week 4']));
  const [dailyGrid]   = useState(() => generateGrid(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']));

  const good = cls.avg_attendance >= 75;

  const currentPeriods = filter === 'Monthly' ? MONTHS : filter === 'Weekly' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const currentGrid = filter === 'Monthly' ? monthlyGrid : filter === 'Weekly' ? weeklyGrid : dailyGrid;

  return (
    <div className={`bg-white/5 backdrop-blur-xl border rounded-3xl shadow-xl transition-all ${good ? 'border-green-500/20' : 'border-red-500/20'}`}>
      {/* Card Header */}
      <div className="p-6 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">{cls.class_name}</p>
          <h4 className="text-lg font-black text-white">{cls.subject_name}</h4>
          <p className="text-white/40 text-xs mt-0.5">{cls.classes_conducted} classes conducted</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-white/40 mb-0.5">Avg Attendance</p>
            <p className={`text-3xl font-black ${good ? 'text-green-400' : 'text-red-400'}`}>{cls.avg_attendance}%</p>
          </div>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${expanded ? 'bg-blue-600 border-blue-500 rotate-180' : 'bg-white/5 border-white/10'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Excel-style Monthly Grid */}
      {expanded && (
        <div className="px-6 pb-6">
          <div className="h-px bg-white/10 mb-4" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <AttendanceLegend />
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 shrink-0">
              {['Daily', 'Weekly', 'Monthly'].map(f => (
                <button
                  key={f}
                  onClick={(e) => { e.stopPropagation(); setFilter(f); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-max text-xs">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left px-3 py-2.5 text-white/50 font-semibold uppercase tracking-wider w-40 sticky left-0 bg-slate-900/80">Student</th>
                  {currentPeriods.map(m => (
                    <th key={m} className="px-3 py-2.5 text-center text-white/50 font-semibold uppercase tracking-wider">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MOCK_STUDENTS.map(s => (
                  <tr key={s.roll} className="hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2 sticky left-0 bg-slate-900/80">
                      <p className="text-white font-bold truncate max-w-[150px]">{s.name}</p>
                      <p className="text-white/30 text-xs">{s.roll}</p>
                    </td>
                    {currentPeriods.map(m => {
                      const status = currentGrid[s.roll]?.[m] || 'NI';
                      const style = STATUS_STYLES[status];
                      return (
                        <td key={m} className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-7 rounded-lg text-xs font-black ${style.bg} ${style.text}`}>{status}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Mark Attendance Modal ──────────────────────────────────────────────── */
const MarkAttendanceModal = ({ cls, onClose }) => {
  const [students] = useState([
    { roll: '2511001', name: 'Alice Johnson' },
    { roll: '2511002', name: 'Bob Smith' },
    { roll: '2511003', name: 'Carol White' },
    { roll: '2511004', name: 'David Brown' },
    { roll: '2511005', name: 'Eve Davis' },
    { roll: '2511008', name: 'Arjun Sharma' },
    { roll: '2511012', name: 'Priya Nair' },
  ]);
  const [attendance, setAttendance] = useState(() =>
    Object.fromEntries(students.map(s => [s.roll, 'Present']))
  );
  const [saved, setSaved] = useState(false);

  const toggle = (roll) => setAttendance(prev => ({ ...prev, [roll]: prev[roll] === 'Present' ? 'Absent' : 'Present' }));
  const markAll = (status) => setAttendance(Object.fromEntries(students.map(s => [s.roll, status])));

  const handleSave = () => {
    console.log('Saving attendance:', attendance);
    setSaved(true);
    setTimeout(onClose, 1500);
  };

  const presentCount = Object.values(attendance).filter(v => v === 'Present').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-slate-900 border border-white/20 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-black text-white">Mark Attendance</h3>
            <p className="text-white/50 text-sm">{cls?.subject_name} — {cls?.class_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {saved ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white text-xl font-black">Attendance Saved!</p>
            <p className="text-white/50 text-sm mt-1">{presentCount}/{students.length} present</p>
          </div>
        ) : (
          <>
            <div className="p-4 flex gap-2 shrink-0">
              <button onClick={() => markAll('Present')} className="flex-1 py-2 text-xs font-bold bg-green-600/30 hover:bg-green-600/50 border border-green-500/30 text-green-300 rounded-xl transition-colors">
                Mark All Present
              </button>
              <button onClick={() => markAll('Absent')} className="flex-1 py-2 text-xs font-bold bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 text-red-300 rounded-xl transition-colors">
                Mark All Absent
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 space-y-2">
              {students.map(s => {
                const isPresent = attendance[s.roll] === 'Present';
                return (
                  <div key={s.roll} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isPresent ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div>
                      <p className="text-white font-semibold text-sm">{s.name}</p>
                      <p className="text-white/40 text-xs">{s.roll}</p>
                    </div>
                    <button
                      onClick={() => toggle(s.roll)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${isPresent ? 'bg-green-600 text-white hover:bg-red-600' : 'bg-red-600 text-white hover:bg-green-600'}`}
                    >
                      {isPresent ? 'Present' : 'Absent'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-white/10 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/60 text-sm">{presentCount}/{students.length} present</p>
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  Offline-capable
                </div>
              </div>
              <button onClick={handleSave} id="save-attendance-btn" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-600/30">
                Save Attendance
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Review Tickets Modal ───────────────────────────────────────────────── */
const ReviewTicketsModal = ({ tickets, onClose }) => {
  const [localTickets, setLocalTickets] = useState(tickets);

  const handle = (id, action) => {
    setLocalTickets(prev => prev.map(t => t.ticket_id === id ? { ...t, resolved: action } : t));
    console.log(`Ticket ${id} ${action}d`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-slate-900 border border-white/20 rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-black text-white">Review Tickets</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {localTickets.map(t => (
            <div key={t.ticket_id} className={`rounded-2xl p-5 border transition-all ${t.resolved === 'approve' ? 'bg-green-500/10 border-green-500/30' : t.resolved === 'reject' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-black">{t.student_name}</p>
                  <p className="text-white/50 text-xs">{t.roll} · {t.date} · {t.subject}</p>
                </div>
                <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded-lg text-white/50">{t.ticket_id}</span>
              </div>
              <p className="text-white/70 text-sm italic bg-white/5 rounded-xl p-3 mb-4">"{t.reason}"</p>
              {t.resolved ? (
                <p className={`text-sm font-black text-center ${t.resolved === 'approve' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.resolved === 'approve' ? '✓ Approved' : '✗ Rejected'}
                </p>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => handle(t.ticket_id, 'approve')} id={`approve-ticket-${t.ticket_id}`} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-black rounded-xl transition-all hover:-translate-y-0.5">
                    ✓ Approve
                  </button>
                  <button onClick={() => handle(t.ticket_id, 'reject')} id={`reject-ticket-${t.ticket_id}`} className="flex-1 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-black rounded-xl transition-all">
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {localTickets.length === 0 && <p className="text-center text-white/40 py-10">No pending tickets.</p>}
        </div>
      </div>
    </div>
  );
};

/* ─── Monitoring Subject Panel ────────────────────────────────────────────── */
const MonitoringSubjectPanel = ({ classes }) => {
  const [counts, setCounts] = useState({});
  const [submitted, setSubmitted] = useState({});

  const handleSubmit = (cls) => {
    const count = parseInt(counts[cls.class_id] || 0);
    setSubmitted(prev => ({
      ...prev,
      [cls.class_id]: { count, total: cls.total_students, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
    }));
  };

  const downloadData = Object.entries(submitted).map(([id, s]) => {
    const cls = classes.find(c => c.class_id === id);
    return { Subject: cls?.subject_name, Class: cls?.class_name, Present: s.count, Total: s.total, Percentage: Math.round((s.count / s.total) * 100) + '%', Time: s.time };
  });

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black text-white mb-4">Monitoring — Live Class Report</h3>
      {classes.map(cls => {
        const result = submitted[cls.class_id];
        const pct = result ? Math.round((result.count / result.total) * 100) : null;
        return (
          <div key={cls.class_id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider">{cls.class_name}</p>
                <p className="text-white font-black text-lg">{cls.subject_name}</p>
                <p className="text-white/40 text-xs">Total enrolled: {cls.total_students} students</p>
              </div>
              {result && (
                <div className="flex items-center gap-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl px-4 py-3">
                  <div className="text-center">
                    <p className="text-blue-300 text-xs font-semibold">Present</p>
                    <p className="text-white font-black text-2xl">{result.count}</p>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-blue-300 text-xs font-semibold">Coverage</p>
                    <p className={`font-black text-2xl ${pct >= 75 ? 'text-green-400' : 'text-red-400'}`}>{pct}%</p>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-blue-300 text-xs font-semibold">Reported</p>
                    <p className="text-white/80 text-sm font-bold">{result.time}</p>
                  </div>
                </div>
              )}
            </div>
            {/* Input */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="number"
                  min="0"
                  max={cls.total_students}
                  value={counts[cls.class_id] || ''}
                  onChange={e => setCounts(prev => ({ ...prev, [cls.class_id]: e.target.value }))}
                  placeholder="Enter present count..."
                  className="w-full bg-slate-800 text-white text-base rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-blue-500 transition-colors pr-20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">/ {cls.total_students}</span>
              </div>
              <button
                onClick={() => handleSubmit(cls)}
                disabled={!counts[cls.class_id]}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm"
              >
                Submit to Principal
              </button>
            </div>
            {result && (
              <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Report sent to Principal at {result.time}
              </p>
            )}
          </div>
        );
      })}

      {/* Download button at the bottom */}
      {Object.keys(submitted).length > 0 && (
        <div className="flex justify-end pt-2">
          <DownloadButton data={downloadData} filename="monitoring_report" label="Download Monitoring Report" />
        </div>
      )}
    </div>
  );
};

/* ─── Main Teacher Dashboard ─────────────────────────────────────────────── */
const TeacherDashboard = () => {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFilter, setActiveFilter] = useState('Weekly');
  const [selectedClass, setSelectedClass] = useState('all');
  const [markModal, setMarkModal] = useState(null);
  const [ticketsModal, setTicketsModal] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState({});
  const [smartAlert, setSmartAlert] = useState(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const t = setTimeout(() => {
      const d = { ...MOCK_TEACHER, teacher: { ...MOCK_TEACHER.teacher, name: user.name || 'Teacher', email: user.email } };
      setData(d);
      setLoading(false);
      // Smart alert — simulating an ongoing class
      const now = new Date();
      setSmartAlert(d.assigned_classes[0]);
    }, 600);
    return () => clearTimeout(t);
  }, [user]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { teacher, assigned_classes, defaulters, trend_data, monitoring_duties, pending_tickets } = data;

  const tabs = ['dashboard', 'attendance', 'monitoring', 'tickets', 'reports'];

  const downloadData = defaulters.map(d => ({
    Roll: d.roll, Name: d.name, Subject: d.subject, Percentage: d.percentage, 'Classes Missed': d.classes_missed
  }));

  return (
    <div className="min-h-screen bg-cover bg-fixed text-white pb-16" style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}>
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md fixed pointer-events-none" />
      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">VVM <span className="text-blue-400">ATTENDANCE</span></h1>
            <p className="text-white/50 text-sm mt-0.5">Teacher Portal — {teacher.department} Dept.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ThemeToggle />
            <button onClick={handleLogout} id="teacher-logout-btn" className="px-3 py-2 sm:px-4 bg-red-500/20 text-red-200 hover:bg-red-500/40 rounded-xl border border-red-500/30 text-sm font-bold transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* Profile + Tabs */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
                {teacher.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-black">{teacher.name}</h2>
                <p className="text-white/60 text-sm">{teacher.email}</p>
              </div>
            </div>
            <div className="tabs-scroll flex gap-1 flex-nowrap bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 max-w-full overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab}
                  id={`teacher-tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                >
                  {tab === 'tickets' ? `Tickets ${pending_tickets.length > 0 ? `(${pending_tickets.length})` : ''}` : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Alert Banner */}
        {smartAlert && activeTab === 'dashboard' && (
          <div className="bg-gradient-to-r from-blue-600/90 to-indigo-600/90 border border-blue-400/50 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="font-black text-white">You have a class right now!</p>
                <p className="text-blue-100 text-sm">{smartAlert.subject_name} — {smartAlert.class_name}</p>
              </div>
            </div>
            <button onClick={() => setMarkModal(smartAlert)} className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-black shadow-lg transition-all hover:-translate-y-0.5 whitespace-nowrap">
              Take Attendance Now
            </button>
          </div>
        )}

        {/* ── Dashboard Tab ─────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {assigned_classes.map(cls => {
                const good = cls.avg_attendance >= 75;
                return (
                  <div key={cls.class_id} className={`bg-white/5 backdrop-blur-xl border rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group ${good ? 'border-green-500/20' : 'border-red-500/20'}`}
                    onClick={() => setMarkModal(cls)}>
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">{cls.class_name}</p>
                    <h4 className="text-lg font-black text-white mb-1">{cls.subject_name}</h4>
                    <p className="text-white/40 text-xs mb-4">{cls.classes_conducted} classes conducted</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-white/40 mb-1">Avg Attendance</p>
                        <p className={`text-3xl font-black ${good ? 'text-green-400' : 'text-red-400'}`}>{cls.avg_attendance}%</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Attendance Tab — Subject Dashboard + Monthly Excel Grid ────── */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-white">Attendance — by Subject</h3>
              <DownloadButton data={defaulters.map(d => ({ Roll: d.roll, Name: d.name, Subject: d.subject, Percentage: d.percentage, ClassesMissed: d.classes_missed }))} filename="attendance_report" label="Export All" />
            </div>
            {assigned_classes.map(cls => (
              <SubjectAttendanceCard key={cls.class_id} cls={cls} />
            ))}
          </div>
        )}

        {/* ── Monitoring Tab — live present-count per subject ───────────── */}
        {activeTab === 'monitoring' && (
          <MonitoringSubjectPanel classes={assigned_classes} />
        )}

        {/* ── Tickets Tab ──────────────────────────────────────────────── */}
        {activeTab === 'tickets' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white">Dispute Tickets</h3>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-sm font-bold">
                {pending_tickets.length} Pending
              </span>
            </div>
            <div className="space-y-4">
              {pending_tickets.map(t => (
                <div key={t.ticket_id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-black">{t.student_name}</p>
                      <p className="text-white/50 text-xs">{t.roll} · {t.date} · {t.subject}</p>
                    </div>
                    <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded-lg text-white/40">{t.ticket_id}</span>
                  </div>
                  <p className="text-white/70 text-sm italic bg-white/5 rounded-xl p-3 mb-4">"{t.reason}"</p>
                  <div className="flex gap-3">
                    <button onClick={() => console.log('Approve', t.ticket_id)} id={`approve-${t.ticket_id}`} className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-black text-sm rounded-xl transition-all hover:-translate-y-0.5">
                      ✓ Approve
                    </button>
                    <button onClick={() => console.log('Reject', t.ticket_id)} id={`reject-${t.ticket_id}`} className="flex-1 py-2.5 bg-red-600/80 hover:bg-red-600 text-white font-black text-sm rounded-xl transition-all">
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
              {pending_tickets.length === 0 && (
                <div className="text-center py-16 text-white/40">
                  <p className="text-4xl mb-3">✓</p>
                  <p className="font-medium">No pending tickets</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Reports Tab ──────────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-white mb-4">Download Reports</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {assigned_classes.map(cls => (
                <div key={cls.class_id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                  <p className="text-white/50 text-xs mb-1">{cls.class_name}</p>
                  <p className="text-white font-black mb-4">{cls.subject_name}</p>
                  <DownloadButton
                    data={[{ Subject: cls.subject_name, Class: cls.class_name, AvgAttendance: cls.avg_attendance, Classes: cls.classes_conducted }]}
                    filename={`${cls.class_id}_report`}
                    label="Download Report"
                    className="w-full justify-center"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Mark Attendance Modal */}
      {markModal && <MarkAttendanceModal cls={markModal} onClose={() => setMarkModal(null)} />}
      {ticketsModal && <ReviewTicketsModal tickets={pending_tickets} onClose={() => setTicketsModal(false)} />}
    </div>
  );
};

export default TeacherDashboard;
