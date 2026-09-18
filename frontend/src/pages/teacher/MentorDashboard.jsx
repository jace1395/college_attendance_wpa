import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import MenteeReportView from './MenteeReportView';

// MentorDashboard renders as an embedded tab inside TeacherDashboard.
// It receives an onBack callback to return to the Teacher Dashboard.
const MentorDashboard = ({ onBack }) => {
  const { user } = useAuth();

  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentee, setSelectedMentee] = useState(null);

  // Fetch ONLY this mentor's assigned mentees
  useEffect(() => {
    if (!user) return;
    const fetchMentees = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/api/teacher/mentor/mentees/');
        setMentees(data.mentees || []);
      } catch {
        setMentees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMentees();
  }, [user]);

  const filteredMentees = mentees.filter(m =>
    !searchQuery ||
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.roll?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const shortCount = mentees.filter(m => m.attendance_pct < 75).length;

  const getAttColor = (pct) => {
    if (pct >= 85) return 'text-green-400';
    if (pct >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };
  const getBarColor = (pct) => {
    if (pct >= 85) return 'from-green-500 to-emerald-400';
    if (pct >= 75) return 'from-yellow-500 to-amber-400';
    return 'from-red-500 to-orange-400';
  };

  if (selectedMentee) {
    return <MenteeReportView menteeId={selectedMentee.id} onBack={() => setSelectedMentee(null)} />;
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">

      {/* Panel Header with Back Button */}
      <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mentor Panel</h2>
            <p className="text-emerald-300/70 text-sm">
              Viewing attendance records for your assigned mentees only
            </p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Mentees',    value: mentees.length,   color: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
          { label: 'Below 75%',        value: shortCount,        color: 'bg-red-500/10 border-red-500/30',          text: 'text-red-400' },
          { label: 'Above 85%',        value: mentees.filter(m => m.attendance_pct >= 85).length, color: 'bg-green-500/10 border-green-500/30', text: 'text-green-400' },
        ].map(c => (
          <div key={c.label} className={`rounded-2xl p-5 border ${c.color}`}>
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">{c.label}</p>
            <p className={`text-3xl font-extrabold tracking-tight ${c.text}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Mentee List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-bold text-white/80">My Mentees</h3>
          <div className="ml-auto relative">
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or roll..."
              className="bg-slate-900/60 text-white/80 rounded-xl pl-9 pr-4 py-2 text-xs border border-white/10 focus:border-emerald-500 outline-none w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400"></div>
          </div>
        ) : filteredMentees.length === 0 ? (
          <div className="py-14 text-center text-white/30 flex flex-col items-center gap-3">
            <svg className="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p className="text-sm">{searchQuery ? 'No mentees match your search.' : 'No mentees assigned yet. Data will appear after API integration.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3">Roll No</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Year / Div</th>
                  <th className="px-5 py-3">Attendance</th>
                  <th className="px-5 py-3 w-40">Bar</th>
                  <th className="px-5 py-3 text-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredMentees.map(m => (
                  <tr key={m.roll} className={`border-t border-white/5 hover:bg-white/5 transition-colors ${m.attendance_pct < 75 ? 'bg-red-900/10' : ''}`}>
                    <td className="px-5 py-3 font-mono text-purple-300 text-xs">{m.roll}</td>
                    <td className="px-5 py-3 font-semibold text-white/90">{m.name}</td>
                    <td className="px-5 py-3 text-white/50 text-xs">
                      <span className="bg-white/10 px-2 py-0.5 rounded-md mr-1 font-mono">{m.year}</span>
                      {m.division && <span className="bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-md text-xs">Div {m.division}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-base font-extrabold ${getAttColor(m.attendance_pct)}`}>
                        {typeof m.attendance_pct === 'number' ? m.attendance_pct.toFixed(1) : m.attendance_pct}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="w-full bg-slate-800/60 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${getBarColor(m.attendance_pct)}  `}
                          style={{ width: `${Math.min(m.attendance_pct, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => setSelectedMentee(m)}
                        className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 hover:text-white rounded-lg text-xs font-bold border border-emerald-500/20 "
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;
