import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import DownloadButton from '../../components/shared/DownloadButton';
import ThemeToggle from '../../components/shared/ThemeToggle';

/* ─── Mock Data ──────────────────────────────────────────────────────────── */
const MOCK_MENTEES = [
  {
    roll: '2511001', name: 'Alice Johnson', overall: 88.5,
    subjects: [
      { name: 'Web Dev', pct: 90 }, { name: 'SE', pct: 85 }, { name: 'DBMS', pct: 91 }, { name: 'OS', pct: 88 },
    ]
  },
  {
    roll: '2511002', name: 'Bob Smith', overall: 55.2,
    subjects: [
      { name: 'Web Dev', pct: 60 }, { name: 'SE', pct: 44 }, { name: 'DBMS', pct: 55 }, { name: 'OS', pct: 62 },
    ]
  },
  {
    roll: '2511003', name: 'Carol White', overall: 72.1,
    subjects: [
      { name: 'Web Dev', pct: 75 }, { name: 'SE', pct: 70 }, { name: 'DBMS', pct: 68 }, { name: 'OS', pct: 75 },
    ]
  },
  {
    roll: '2511004', name: 'David Brown', overall: 90.3,
    subjects: [
      { name: 'Web Dev', pct: 95 }, { name: 'SE', pct: 88 }, { name: 'DBMS', pct: 90 }, { name: 'OS', pct: 88 },
    ]
  },
  {
    roll: '2511008', name: 'Arjun Sharma', overall: 58.3,
    subjects: [
      { name: 'Web Dev', pct: 58 }, { name: 'SE', pct: 50 }, { name: 'DBMS', pct: 65 }, { name: 'OS', pct: 60 },
    ]
  },
];

const SUBJECTS = ['Web Dev', 'SE', 'DBMS', 'OS'];
const LINE_COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#a78bfa', '#fb7185'];

/* ─── Alert Modal ────────────────────────────────────────────────────────── */
const AlertModal = ({ mentee, onClose }) => {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    console.log(`Alert sent to ${mentee.name}:`, message);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-slate-900 border border-white/20 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600/30 to-purple-600/30 border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Send Alert</h3>
            <p className="text-white/60 text-sm">To: {mentee.name} ({mentee.roll})</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-white font-black text-lg">Alert Sent!</p>
              <p className="text-white/50 text-sm mt-1">{mentee.name} has been notified.</p>
              <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black transition-colors">Close</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <p className="text-red-300 text-sm font-semibold mb-1">⚠ Low Attendance Alert</p>
                <p className="text-white/60 text-xs">Current overall: <span className="text-red-400 font-bold">{mentee.overall}%</span></p>
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="Write a message to your mentee..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
              <button
                onClick={handleSend}
                id={`send-alert-${mentee.roll}`}
                disabled={!message.trim()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-600/20"
              >
                Send In-App Alert
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Mentor Dashboard ──────────────────────────────────────────────── */
const MentorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [alertTarget, setAlertTarget] = useState(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      setData({ mentor: { name: user.name || 'Mentor', email: user.email }, mentees: MOCK_MENTEES });
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [user]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { mentor, mentees } = data;
  const criticalMentees = mentees.filter(m => m.overall < 75);

  const downloadData = mentees.flatMap(m =>
    m.subjects.map(s => ({ Roll: m.roll, Name: m.name, Subject: s.name, Percentage: s.pct, Overall: m.overall }))
  );

  // Chart: overall attendance trend per mentee (using overall as static "trend")
  const chartData = mentees.map(m => ({ name: m.name.split(' ')[0], attendance: m.overall }));

  return (
    <div className="min-h-screen bg-cover bg-fixed text-white pb-16" style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}>
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md fixed pointer-events-none" />
      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">VVM <span className="text-violet-400">MENTOR</span></h1>
            <p className="text-white/50 text-sm mt-0.5">Mentor Portal</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ThemeToggle />
            <button onClick={handleLogout} id="mentor-logout-btn" className="px-3 py-2 sm:px-4 bg-red-500/20 text-red-200 hover:bg-red-500/40 rounded-xl border border-red-500/30 text-sm font-bold transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* Profile + Tabs */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
                {mentor.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-black">{mentor.name}</h2>
                <p className="text-white/60 text-sm">{mentor.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-violet-500/30 border border-violet-500/40 rounded-full text-violet-300 text-xs font-bold">Mentor</span>
              </div>
            </div>
            <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10">
              {['overview', 'my mentees'].map(tab => (
                <button key={tab} id={`mentor-tab-${tab.replace(' ', '-')}`} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-violet-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Overview Tab ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-xl border border-violet-500/20 rounded-3xl p-6 shadow-xl">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Total Mentees</p>
                <p className="text-4xl font-black text-white">{mentees.length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 shadow-xl">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Below 75%</p>
                <p className="text-4xl font-black text-red-400">{criticalMentees.length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6 shadow-xl">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Avg Overall</p>
                <p className="text-4xl font-black text-green-400">
                  {(mentees.reduce((a, m) => a + m.overall, 0) / mentees.length).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Bar overview */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-6">Mentees Overview</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} labelStyle={{ color: 'white' }} />
                  <Line type="monotone" dataKey="attendance" stroke="#a78bfa" strokeWidth={3} dot={{ r: 5, fill: '#a78bfa' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Critical alerts */}
            {criticalMentees.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 shadow-xl">
                <h3 className="text-red-300 font-black mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" /> Mentees Requiring Attention
                </h3>
                <div className="space-y-3">
                  {criticalMentees.map(m => (
                    <div key={m.roll} className="flex items-center justify-between p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                      <div>
                        <p className="text-white font-bold">{m.name}</p>
                        <p className="text-red-400 text-sm font-black">{m.overall}% overall</p>
                      </div>
                      <button onClick={() => setAlertTarget(m)} id={`alert-${m.roll}`}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black rounded-xl transition-all hover:-translate-y-0.5">
                        Send Alert
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── My Mentees Tab ────────────────────────────────────────────── */}
        {activeTab === 'my mentees' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">My Mentees — Master Table</h3>
              <DownloadButton data={downloadData} filename="mentee_report" label="Download Report" />
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/10">
                    <th className="text-left pb-3 font-semibold pr-4">Student</th>
                    {SUBJECTS.map(s => <th key={s} className="text-center pb-3 font-semibold px-2">{s}</th>)}
                    <th className="text-right pb-3 font-semibold">Overall</th>
                    <th className="text-right pb-3 font-semibold pl-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mentees.map(m => {
                    const overall = m.overall;
                    const overallColor = overall >= 75 ? 'text-green-400' : 'text-red-400';
                    return (
                      <tr key={m.roll} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 pr-4">
                          <p className="text-white font-bold text-sm">{m.name}</p>
                          <p className="text-white/40 text-xs">{m.roll}</p>
                        </td>
                        {m.subjects.map(s => {
                          const col = s.pct >= 75 ? 'text-green-400' : s.pct >= 60 ? 'text-amber-400' : 'text-red-400';
                          return (
                            <td key={s.name} className={`text-center py-4 px-2 text-sm font-bold ${col}`}>{s.pct}%</td>
                          );
                        })}
                        <td className={`text-right py-4 font-black ${overallColor}`}>{overall}%</td>
                        <td className="text-right py-4 pl-4">
                          <button onClick={() => setAlertTarget(m)} id={`table-alert-${m.roll}`}
                            className="px-3 py-1.5 bg-violet-600/80 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all">
                            Alert
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {alertTarget && <AlertModal mentee={alertTarget} onClose={() => setAlertTarget(null)} />}
    </div>
  );
};

export default MentorDashboard;
