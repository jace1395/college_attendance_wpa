import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import apiClient from '../../services/apiClient';

const StudentAttendanceModal = ({ studentId, apiEndpoint, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);

  const monthsToShow = [
    { val: 6, label: "June" }, { val: 7, label: "July" }, { val: 8, label: "August" },
    { val: 9, label: "September" }, { val: 10, label: "October" }, { val: 11, label: "November" },
    { val: 12, label: "December" }, { val: 1, label: "January" }, { val: 2, label: "February" },
    { val: 3, label: "March" }, { val: 4, label: "April" }, { val: 5, label: "May" }
  ];

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedMonth) params.month = selectedMonth;
        if (selectedSubject) params.subject_id = selectedSubject;
        
        const endpoint = apiEndpoint || `/api/teacher/mentor/mentees/${studentId}/report/`;
        const res = await apiClient.get(endpoint, { params });
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch mentee report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [studentId, selectedMonth, selectedSubject]);

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

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Back to List"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            {data.mentee.name}
          </h2>
          <p className="text-emerald-300/70 text-sm ml-12">
            {data.mentee.roll} • {data.mentee.email}
          </p>
        </div>
        <div className="text-right flex items-center gap-4 bg-slate-800/80 p-3 rounded-2xl border border-white/5">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Overall Attendance</p>
            <p className={`text-2xl font-black ${getAttColor(data.overall.pct)}`}>
              {data.overall.pct}%
            </p>
          </div>
          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
             <div className={`h-full bg-gradient-to-r ${getBarColor(data.overall.pct)}`} style={{width: `${data.overall.pct}%`}} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Attendance Trends</h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-sm font-normal text-white/80 bg-slate-800 px-3 py-1 rounded-lg border border-white/10 outline-none focus:border-emerald-500 cursor-pointer [color-scheme:dark]"
            >
              <option value="">All Time</option>
              {monthsToShow.map(m => (
                <option key={m.val} value={m.val}>{m.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-h-[300px]">
            {data.history.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/30 text-sm">
                No attendance data available for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    minTickGap={15} 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                    tickFormatter={(val) => {
                       const d = new Date(val);
                       return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                    }}
                  />
                  <YAxis stroke="currentColor" className="text-slate-500" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" isAnimationActive={false} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Subject Breakdown */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-lg flex flex-col max-h-[400px]">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-semibold text-white">Subject Breakdown</h3>
             {selectedSubject && (
               <button 
                 onClick={() => setSelectedSubject(null)}
                 className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 transition-colors"
               >
                 Clear Filter
               </button>
             )}
           </div>
           <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
             {data.subjects.length === 0 ? (
                <div className="text-center py-8 text-white/40">No subjects found.</div>
             ) : data.subjects.map((sub, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`border rounded-xl p-4 flex flex-col gap-2 transition-colors cursor-pointer ${
                    selectedSubject === sub.id 
                      ? 'bg-emerald-500/20 border-emerald-500/50' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                   <div className="flex justify-between items-start">
                     <span className="text-white/90 text-sm font-medium pr-2">{sub.name}</span>
                     <span className={`font-bold text-sm ${getAttColor(sub.pct)}`}>{sub.pct}%</span>
                   </div>
                   <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                     <div className={`h-full bg-gradient-to-r ${getBarColor(sub.pct)}`} style={{width: `${sub.pct}%`}} />
                   </div>
                   <div className="text-xs text-white/40 flex justify-between">
                     <span>Attended: {sub.attended}</span>
                     <span>Total: {sub.total}</span>
                   </div>
                </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default StudentAttendanceModal;
