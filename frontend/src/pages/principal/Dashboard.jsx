import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import DownloadButton from '../../components/shared/DownloadButton';
import ThemeToggle from '../../components/shared/ThemeToggle';

/* ─── Mock Data ──────────────────────────────────────────────────────────── */
const MOCK_PRINCIPAL = {
  principal: { name: 'Dr. Prita D Mallya', email: 'principal@vvm.edu.in' },
  college_stats_today: {
    total_students_present: 1245,
    total_students_absent: 155,
    overall_attendance_percentage: 88.9,
    classes_conducted_today: 42,
  },
  stream_overview: [
    { name: 'BCA', value: 82.4, students: 480 },
    { name: 'BVoc', value: 78.1, students: 320 },
    { name: 'BCom', value: 85.6, students: 610 },
    { name: 'BBA', value: 74.2, students: 390 },
    { name: 'BBA(FS)', value: 88.0, students: 210 },
    { name: 'MCom', value: 90.3, students: 180 },
    { name: 'LLB', value: 68.5, students: 220 },
    { name: 'LLM', value: 72.1, students: 95 },
  ],
  top_defaulters: [
    { rank: 1, name: 'Rahul Mehta', roll: '2411031', stream: 'LLB', overall: 42.1, classes_missed: 48 },
    { rank: 2, name: 'Priya Sharma', roll: '2311045', stream: 'BBA', overall: 45.8, classes_missed: 42 },
    { rank: 3, name: 'Arjun Nair', roll: '2511008', stream: 'BVoc', overall: 48.3, classes_missed: 39 },
    { rank: 4, name: 'Sneha Gupta', roll: '2411067', stream: 'BCom', overall: 51.5, classes_missed: 34 },
    { rank: 5, name: 'Vijay Kumar', roll: '2311089', stream: 'LLB', overall: 53.2, classes_missed: 33 },
    { rank: 6, name: 'Ananya Roy', roll: '2511022', stream: 'BCA', overall: 55.0, classes_missed: 31 },
    { rank: 7, name: 'Rohan Das', roll: '2411012', stream: 'BVoc', overall: 57.3, classes_missed: 28 },
    { rank: 8, name: 'Fatima Sheikh', roll: '2311099', stream: 'BBA(FS)', overall: 59.0, classes_missed: 27 },
  ],
};

const PIE_COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#a78bfa', '#fb7185', '#f472b6', '#38bdf8', '#4ade80'];

/* ─── Monitoring Feed from Teachers ─────────────────────────────────────── */
const MOCK_MONITORING_FEEDS = [
  { id: 'MF001', teacher: 'Sumit Kumar', subject: 'Web Development', class_name: 'SY BVoc(ST)', time: '10:15 AM', total: 60, present: 52 },
  { id: 'MF002', teacher: 'Anita Desai', subject: 'Marketing', class_name: 'FY BBA', time: '11:15 AM', total: 72, present: 68 },
  { id: 'MF003', teacher: 'Rajiv Menon', subject: 'DBMS', class_name: 'SY BCA', time: '09:15 AM', total: 48, present: 44 },
  { id: 'MF004', teacher: 'Priya Shah', subject: 'Accountancy', class_name: 'FY BCom', time: '02:15 PM', total: 65, present: 41 },
];

const STREAMS = ['BVoc', 'BCA', 'BCom', 'BBA', 'BBA(FS)'];
const YEARS = ['FY', 'SY', 'TY'];
const STREAM_DRILLDOWN = {};
YEARS.forEach(y => {
  STREAM_DRILLDOWN[y] = {};
  STREAMS.forEach(s => {
    STREAM_DRILLDOWN[y][s] = {
      attendance: Math.round(65 + Math.random() * 25),
      present: Math.round(30 + Math.random() * 30),
      total: 60,
    };
  });
});

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-white/20 rounded-xl px-4 py-3 shadow-2xl">
        <p className="font-black text-white">{d.name}</p>
        <p style={{ color: payload[0].fill }} className="text-lg font-black">{d.value}%</p>
        <p className="text-white/50 text-xs">{d.students} students</p>
      </div>
    );
  }
  return null;
};

/* ─── Principal Dashboard ────────────────────────────────────────────────── */
const PrincipalDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [liveTime, setLiveTime] = useState(new Date());
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      setData({ ...MOCK_PRINCIPAL, principal: { ...MOCK_PRINCIPAL.principal, name: user.name || MOCK_PRINCIPAL.principal.name } });
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [user]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { principal, college_stats_today, stream_overview, top_defaulters } = data;
  const downloadData = top_defaulters.map(d => ({ Rank: d.rank, Name: d.name, Roll: d.roll, Stream: d.stream, Overall: d.overall, ClassesMissed: d.classes_missed }));

  return (
    <div className="min-h-screen bg-cover bg-fixed text-white pb-16" style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}>
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md fixed pointer-events-none" />
      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-purple-100 flex items-center gap-3">
              <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {liveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
            <p className="text-white/50 text-sm mt-0.5">Principal's Command Center</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-900/50 rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <input type="date" value={globalDate} onChange={e => setGlobalDate(e.target.value)} className="bg-transparent outline-none text-sm text-white" />
            </div>
            <ThemeToggle />
            <button onClick={handleLogout} id="principal-logout-btn" className="px-3 py-2 sm:px-4 bg-red-500/20 text-red-200 hover:bg-red-500/40 rounded-xl border border-red-500/30 text-sm font-bold transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* Profile + Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">{principal.name}</h2>
            <p className="text-purple-300 font-semibold text-sm">Principal, Shree Damodar College of Commerce & Economics</p>
          </div>
          <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10">
            {['dashboard', 'notices', 'view', 'reports'].map(tab => (
              <button key={tab} id={`principal-tab-${tab}`} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                {tab === 'notices' ? '🔔 Notices' : tab === 'view' ? '📊 Stream View' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Dashboard Tab ─────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Present Today', value: college_stats_today.total_students_present, color: 'purple', textColor: 'text-purple-400' },
                { label: 'Absent Today', value: college_stats_today.total_students_absent, color: 'red', textColor: 'text-red-400' },
                { label: 'Overall %', value: `${college_stats_today.overall_attendance_percentage}%`, color: 'green', textColor: 'text-green-400' },
                { label: 'Classes Today', value: college_stats_today.classes_conducted_today, color: 'blue', textColor: 'text-blue-400' },
              ].map((card, idx) => (
                <div key={idx} className={`bg-white/5 backdrop-blur-xl border border-${card.color}-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden group`}
                  style={{ borderColor: `rgba(var(--tw-color-${card.color}-500), 0.3)` }}>
                  <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${card.color}-500/20 rounded-full blur-xl group-hover:bg-${card.color}-500/30 transition-colors`} />
                  <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">{card.label}</p>
                  <p className={`text-4xl font-black ${card.textColor}`}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Pie Chart — Stream Comparison — clickable */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl cursor-pointer hover:border-purple-500/30 transition-all group"
                onClick={() => setActiveTab('view')}
                title="Click to view full stream breakdown"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-black text-white">Stream Attendance Overview</h3>
                  <span className="text-xs text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-1 rounded-lg group-hover:bg-purple-500/30 transition-colors">Click to drill down →</span>
                </div>
                <p className="text-white/40 text-xs mb-6">Comparing attendance health across all college streams</p>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stream_overview} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={110} innerRadius={55}
                    >
                      {stream_overview.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}
                      formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Defaulters List */}
              <div className="bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    Top Defaulters — College-wide
                  </h3>
                  <DownloadButton data={downloadData} filename="master_report" label="Master Report" />
                </div>
                <div className="space-y-2 overflow-y-auto max-h-[270px] pr-1">
                  {top_defaulters.map(d => (
                    <div key={d.rank} className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${d.rank <= 3 ? 'bg-red-600 text-white' : 'bg-white/10 text-white/60'}`}>
                        {d.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{d.name}</p>
                        <p className="text-white/50 text-xs">{d.roll} · {d.stream}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-red-400 font-black text-sm">{d.overall}%</p>
                        <p className="text-white/40 text-xs">{d.classes_missed} missed</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Notices Tab — Teacher Monitoring Feeds ────────────────────── */}
        {activeTab === 'notices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-white">Live Monitoring Reports</h3>
              <span className="text-xs text-white/40">From teachers — updated in real time</span>
            </div>
            {MOCK_MONITORING_FEEDS.map(feed => {
              const pct = Math.round((feed.present / feed.total) * 100);
              const good = pct >= 75;
              return (
                <div key={feed.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white/50 text-xs uppercase tracking-wider">{feed.class_name}</p>
                    <p className="text-white font-black text-lg">{feed.subject}</p>
                    <p className="text-white/50 text-sm">by {feed.teacher} · <span className="text-purple-300">{feed.time}</span></p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-white/40 text-xs">Present</p>
                      <p className="text-white font-black text-2xl">{feed.present}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/40 text-xs">Total</p>
                      <p className="text-white/70 font-black text-2xl">{feed.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/40 text-xs">Coverage</p>
                      <p className={`font-black text-2xl ${good ? 'text-green-400' : 'text-red-400'}`}>{pct}%</p>
                    </div>
                    <div className={`w-2 h-10 rounded-full ${good ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Stream View Tab — FY/SY/TY × Streams drill-down ──────────── */}
        {activeTab === 'view' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-white">Stream Attendance — Detailed View</h3>
              <button onClick={() => setActiveTab('dashboard')} className="text-xs text-white/50 hover:text-white px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl transition-colors">← Back to Dashboard</button>
            </div>
            {YEARS.map(year => (
              <div key={year} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <h4 className="text-lg font-black text-white mb-5 flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-600/30 border border-purple-500/40 rounded-xl text-purple-300 text-sm">{year}</span>
                  <span className="text-white/60 text-sm font-semibold">— {year === 'FY' ? 'First Year' : year === 'SY' ? 'Second Year' : 'Third Year'}</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {STREAMS.map((stream, idx) => {
                    const d = STREAM_DRILLDOWN[year][stream];
                    const good = d.attendance >= 75;
                    return (
                      <div key={stream} className={`rounded-2xl p-4 border text-center ${good ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center font-black text-xs text-white" style={{ backgroundColor: `${PIE_COLORS[idx]}30`, border: `1px solid ${PIE_COLORS[idx]}50` }}>
                          {stream.substring(0, 2)}
                        </div>
                        <p className="text-white font-bold text-xs mb-1">{stream}</p>
                        <p className={`text-2xl font-black ${good ? 'text-green-400' : 'text-red-400'}`}>{d.attendance}%</p>
                        <p className="text-white/40 text-xs mt-1">{d.present}/{d.total} present</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Reports Tab ──────────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-white">Download Master Reports</h3>
            <p className="text-white/50 text-sm">Download data for any student, class, or stream across the college.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stream_overview.map((stream, idx) => (
                <div key={stream.name} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white" style={{ backgroundColor: `${PIE_COLORS[idx]}30`, border: `1px solid ${PIE_COLORS[idx]}50` }}>
                      {stream.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-white font-black">{stream.name}</p>
                      <p className="text-white/50 text-xs">{stream.students} students</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/50 text-xs">Avg Attendance</p>
                    <p className={`font-black ${stream.value >= 75 ? 'text-green-400' : 'text-red-400'}`}>{stream.value}%</p>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full mb-4">
                    <div className="h-full rounded-full" style={{ width: `${stream.value}%`, backgroundColor: PIE_COLORS[idx] }} />
                  </div>
                  <DownloadButton
                    data={[{ Stream: stream.name, Attendance: stream.value, Students: stream.students }]}
                    filename={`${stream.name}_master_report`}
                    label="Download"
                    className="w-full justify-center text-xs"
                  />
                </div>
              ))}
            </div>

            {/* Full college master download */}
            <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-3xl p-8 text-center shadow-2xl">
              <h4 className="text-2xl font-black text-white mb-2">Download Complete Master Report</h4>
              <p className="text-white/60 mb-6">All students, all classes, all streams — entire college data</p>
              <div className="flex justify-center">
                <DownloadButton
                  data={downloadData}
                  filename="college_master_report"
                  label="Download Complete Master Report"
                  className="text-base px-8 py-3"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PrincipalDashboard;
