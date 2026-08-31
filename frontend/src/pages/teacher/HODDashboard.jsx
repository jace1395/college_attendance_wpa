import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import DownloadButton from '../../components/shared/DownloadButton';
import ThemeToggle from '../../components/shared/ThemeToggle';

/* ─── Mock Data ──────────────────────────────────────────────────────────── */
const STREAM_DATA = [
  { name: 'BCA', attendance: 82.4, students: 480, defaulters: 42 },
  { name: 'BVoc', attendance: 78.1, students: 320, defaulters: 55 },
  { name: 'BCom', attendance: 85.6, students: 610, defaulters: 30 },
  { name: 'BBA', attendance: 74.2, students: 390, defaulters: 70 },
  { name: 'MCom', attendance: 90.3, students: 180, defaulters: 8 },
  { name: 'LLB', attendance: 68.5, students: 220, defaulters: 88 },
];

const DEPT_STREAMS = ['BCA', 'BVoc'];
const HOD_YEARS = ['FY', 'SY', 'TY'];
const HOD_DRILLDOWN = {};
HOD_YEARS.forEach(y => {
  HOD_DRILLDOWN[y] = {};
  DEPT_STREAMS.forEach(s => {
    HOD_DRILLDOWN[y][s] = { attendance: Math.round(68 + Math.random() * 22), present: Math.round(28 + Math.random() * 28), total: 60 };
  });
});

const MOCK_HOD_FEEDS = [
  { id: 'H001', teacher: 'Sumit Kumar', subject: 'Web Development', class_name: 'SY BVoc(ST)', time: '10:15 AM', total: 60, present: 52 },
  { id: 'H002', teacher: 'Rajiv Menon', subject: 'DBMS', class_name: 'SY BCA', time: '09:15 AM', total: 48, present: 44 },
];

const PIE_COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#a78bfa', '#fb7185', '#f472b6'];

const ALL_CLASSES = [
  { class_id: 'BCA_SEM1_A', subject_name: 'Programming Fundamentals', class_name: 'FY BCA A', classes_conducted: 22, avg_attendance: 85.0 },
  { class_id: 'BCA_SEM1_B', subject_name: 'Mathematics', class_name: 'FY BCA B', classes_conducted: 20, avg_attendance: 80.5 },
  { class_id: 'BVoc_SEM3_WD', subject_name: 'Web Development', class_name: 'SY BVoc(ST)', classes_conducted: 20, avg_attendance: 75.0 },
  { class_id: 'BCom_SEM2_A', subject_name: 'Accountancy', class_name: 'FY BCom A', classes_conducted: 18, avg_attendance: 88.2 },
];

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-white/20 rounded-xl px-4 py-3 shadow-2xl">
        <p className="font-black text-white">{d.name}</p>
        <p style={{ color: payload[0].fill }} className="font-bold">{d.attendance}%</p>
        <p className="text-white/50 text-xs">{d.students} students</p>
      </div>
    );
  }
  return null;
};

/* ─── HOD Dashboard ──────────────────────────────────────────────────────── */
const HODDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      setData({
        hod: { name: user.name || 'HOD', email: user.email, department: 'BCA & BVoc' },
        streams: STREAM_DATA,
        classes: ALL_CLASSES,
      });
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [user]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { hod, streams, classes } = data;
  const downloadData = streams.map(s => ({ Stream: s.name, Attendance: s.attendance, Students: s.students, Defaulters: s.defaulters }));

  return (
    <div className="min-h-screen bg-cover bg-fixed text-white pb-16" style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}>
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md fixed pointer-events-none" />
      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">VVM <span className="text-emerald-400">HOD PANEL</span></h1>
            <p className="text-white/50 text-sm mt-0.5">{hod.department} — Head of Department</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ThemeToggle />
            <button onClick={handleLogout} id="hod-logout-btn" className="px-3 py-2 sm:px-4 bg-red-500/20 text-red-200 hover:bg-red-500/40 rounded-xl border border-red-500/30 text-sm font-bold transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* Profile + Tabs */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
                {hod.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-black">{hod.name}</h2>
                <p className="text-white/60 text-sm">{hod.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/30 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-bold">HOD</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10">
              {['dashboard', 'department overview', 'notices', 'stream view'].map(tab => (
                <button key={tab} id={`hod-tab-${tab.replace(/ /g, '-')}`} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                  {tab === 'notices' ? '🔔 Notices' : tab === 'stream view' ? '📊 Stream View' : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Dashboard Tab ─────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 shadow-xl col-span-2 sm:col-span-1">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Total Streams</p>
                <p className="text-4xl font-black text-white">{streams.length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 shadow-xl col-span-2 sm:col-span-1">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Total Students</p>
                <p className="text-4xl font-black text-blue-400">{streams.reduce((a, s) => a + s.students, 0)}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6 shadow-xl col-span-2 sm:col-span-1">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Dept Avg</p>
                <p className="text-4xl font-black text-green-400">
                  {(streams.reduce((a, s) => a + s.attendance, 0) / streams.length).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 shadow-xl col-span-2 sm:col-span-1">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Defaulters</p>
                <p className="text-4xl font-black text-red-400">{streams.reduce((a, s) => a + s.defaulters, 0)}</p>
              </div>
            </div>

            {/* Assigned Classes */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-6">Department Classes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {classes.map(cls => {
                  const good = cls.avg_attendance >= 75;
                  return (
                    <div key={cls.class_id} className={`rounded-2xl p-4 border ${good ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <p className="text-white/50 text-xs mb-1">{cls.class_name}</p>
                      <p className="text-white font-black text-sm mb-2">{cls.subject_name}</p>
                      <p className={`text-2xl font-black ${good ? 'text-green-400' : 'text-red-400'}`}>{cls.avg_attendance}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Department Overview Tab ───────────────────────────────────── */}
        {activeTab === 'department overview' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Department Overview</h3>
              <DownloadButton data={downloadData} filename="department_report" label="Download Dept Report" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <h4 className="text-base font-black text-white mb-4">Stream Attendance Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={streams} dataKey="attendance" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, attendance }) => `${name}: ${attendance}%`} labelLine={false}>
                      {streams.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart — Defaulters per stream */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <h4 className="text-base font-black text-white mb-4">Defaulters per Stream</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={streams} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Bar dataKey="defaulters" radius={[8, 8, 0, 0]} maxBarSize={48}>
                      {streams.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} opacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stream Summary Table */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-x-auto">
              <h4 className="text-base font-black text-white mb-4">Stream Summary</h4>
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/10">
                    <th className="text-left pb-3">Stream</th>
                    <th className="text-center pb-3">Students</th>
                    <th className="text-center pb-3">Attendance</th>
                    <th className="text-right pb-3">Defaulters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {streams.map(s => {
                    const color = s.attendance >= 75 ? 'text-green-400' : 'text-red-400';
                    return (
                      <tr key={s.name} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-white font-bold">{s.name}</td>
                        <td className="py-3 text-center text-white/70">{s.students}</td>
                        <td className={`py-3 text-center font-black ${color}`}>{s.attendance}%</td>
                        <td className="py-3 text-right text-red-400 font-bold">{s.defaulters}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Notices Tab — HOD dept monitoring feeds ────────────────────── */}
        {activeTab === 'notices' && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white mb-4">Live Monitoring — {hod.department} Dept</h3>
            {MOCK_HOD_FEEDS.map(feed => {
              const pct = Math.round((feed.present / feed.total) * 100);
              const good = pct >= 75;
              return (
                <div key={feed.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white/50 text-xs uppercase tracking-wider">{feed.class_name}</p>
                    <p className="text-white font-black text-lg">{feed.subject}</p>
                    <p className="text-white/50 text-sm">by {feed.teacher} · <span className="text-emerald-300">{feed.time}</span></p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center"><p className="text-white/40 text-xs">Present</p><p className="text-white font-black text-2xl">{feed.present}</p></div>
                    <div className="text-center"><p className="text-white/40 text-xs">Total</p><p className="text-white/70 font-black text-2xl">{feed.total}</p></div>
                    <div className="text-center"><p className="text-white/40 text-xs">Coverage</p><p className={`font-black text-2xl ${good ? 'text-green-400' : 'text-red-400'}`}>{pct}%</p></div>
                    <div className={`w-2 h-10 rounded-full ${good ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Stream View Tab — Dept FY/SY/TY drill-down ─────────────────── */}
        {activeTab === 'stream view' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Stream View — {hod.department}</h3>
              <button onClick={() => setActiveTab('dashboard')} className="text-xs text-white/50 hover:text-white px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl transition-colors">← Back</button>
            </div>
            {HOD_YEARS.map(year => (
              <div key={year} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <h4 className="text-base font-black text-white mb-4 flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-600/30 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm">{year}</span>
                  <span className="text-white/60 text-sm font-semibold">— {year === 'FY' ? 'First Year' : year === 'SY' ? 'Second Year' : 'Third Year'}</span>
                </h4>
                <div className="flex gap-4">
                  {DEPT_STREAMS.map((stream, idx) => {
                    const d = HOD_DRILLDOWN[year][stream];
                    const good = d.attendance >= 75;
                    return (
                      <div key={stream} className={`flex-1 rounded-2xl p-4 border text-center ${good ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <p className="text-white font-bold text-sm mb-1">{stream}</p>
                        <p className={`text-3xl font-black ${good ? 'text-green-400' : 'text-red-400'}`}>{d.attendance}%</p>
                        <p className="text-white/40 text-xs mt-1">{d.present}/{d.total} present</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default HODDashboard;
