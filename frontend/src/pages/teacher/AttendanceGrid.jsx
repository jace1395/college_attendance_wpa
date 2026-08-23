import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const AttendanceGrid = () => {
  const { class_id } = useParams();
  const [roster, setRoster] = useState([]);
  const [dates, setDates] = useState([]);
  const [attendance, setAttendance] = useState({}); // shape: { "student_id_date": "status" }
  const [lockedDates, setLockedDates] = useState({}); // shape: { "date": boolean }
  const [loading, setLoading] = useState(true);

  // Helper to generate dates for the current month
  const generateDates = () => {
    const dts = [];
    const now = new Date();
    // Generate dates for the past 14 days
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isSunday = d.getDay() === 0;
      
      const dateStr = d.toISOString().split('T')[0];
      
      // Calculate 24-hour lock logic (for mock purposes, let's say anything older than 1 day is locked)
      const diffInHours = (now - d) / (1000 * 60 * 60);
      const isLocked = diffInHours > 24 && !isSunday;

      dts.push({
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isSunday,
        isLocked
      });
    }
    return dts;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setTimeout(() => {
        // Mock roster
        const mockRoster = [
          { student_id: '2511001', name: 'Alice Smith' },
          { student_id: '2511011', name: 'Jace Doe' },
          { student_id: '2511018', name: 'Bob Johnson' },
        ];
        
        const dts = generateDates();
        setDates(dts);
        setRoster(mockRoster);

        // Populate initial mock attendance state
        const initialAtt = {};
        const locks = {};
        dts.forEach(d => {
            locks[d.dateStr] = d.isLocked;
            if (d.isSunday) return;
            mockRoster.forEach(s => {
                // Randomly assign P or A for mock
                const statuses = ['P', 'P', 'P', 'A', 'OD', 'NI'];
                const randomStat = statuses[Math.floor(Math.random() * statuses.length)];
                initialAtt[`${s.student_id}_${d.dateStr}`] = randomStat;
            });
        });

        setAttendance(initialAtt);
        setLockedDates(locks);
        setLoading(false);
      }, 600);
    };

    fetchData();
  }, [class_id]);

  const handleStatusClick = (studentId, dateStr, isSunday) => {
    if (isSunday || lockedDates[dateStr]) return;

    const key = `${studentId}_${dateStr}`;
    const current = attendance[key];
    
    let next = 'P';
    if (current === 'P') next = 'A';
    else if (current === 'A') next = 'OD';
    else if (current === 'OD') next = 'NI';
    else if (current === 'NI') next = 'P';

    setAttendance(prev => ({ ...prev, [key]: next }));
  };

  const markColumnAll = (dateStr, status) => {
    if (lockedDates[dateStr]) return;
    
    setAttendance(prev => {
        const next = { ...prev };
        roster.forEach(student => {
            next[`${student.student_id}_${dateStr}`] = status;
        });
        return next;
    });
  };

  const requestUnlock = (dateStr) => {
    alert(`Unlock request sent to Principal for ${dateStr}`);
  };

  const getStatusColor = (status, isSunday) => {
    if (isSunday) return 'bg-slate-700/30 text-slate-500 border-slate-700/50 cursor-not-allowed';
    switch(status) {
      case 'P': return 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 cursor-pointer';
      case 'A': return 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 cursor-pointer';
      case 'OD': return 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30 cursor-pointer';
      case 'NI': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30 cursor-pointer';
      default: return 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 cursor-pointer'; // empty state
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-fixed text-white pb-10"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md fixed pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden mx-auto min-h-screen flex flex-col">
        
        {/* Header Block */}
        <div className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
                <Link to="/teacher/dashboard" className="text-blue-400 hover:text-blue-300 mb-4 inline-flex items-center gap-2 font-medium w-fit">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold mb-1">Attendance Register</h1>
                <p className="text-xl text-white/70">Class ID: {class_id}</p>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-3 bg-slate-900/50 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 text-xs font-medium"><div className="w-3 h-3 rounded bg-green-500/50 border border-green-500/50"></div> P (Present)</div>
                <div className="flex items-center gap-2 text-xs font-medium"><div className="w-3 h-3 rounded bg-red-500/50 border border-red-500/50"></div> A (Absent)</div>
                <div className="flex items-center gap-2 text-xs font-medium"><div className="w-3 h-3 rounded bg-blue-500/50 border border-blue-500/50"></div> OD (On Duty)</div>
                <div className="flex items-center gap-2 text-xs font-medium"><div className="w-3 h-3 rounded bg-yellow-500/50 border border-yellow-500/50"></div> NI (Non-Inst)</div>
            </div>
        </div>

        {/* Excel-Like Grid */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex-1 max-w-full">
            <div className="overflow-x-auto h-[65vh]">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                    <thead className="sticky top-0 bg-slate-800 z-20 shadow-md">
                        <tr>
                            <th className="p-4 font-semibold text-white/90 border-r border-white/10 sticky left-0 bg-slate-800 z-30 min-w-[200px]">
                                Student Details
                            </th>
                            {dates.map((d, idx) => (
                                <th key={idx} className={`p-4 font-semibold border-r border-white/10 text-center ${d.isSunday ? 'text-slate-500 bg-slate-800/80' : 'text-white/90'}`}>
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm">{d.dayName}</span>
                                        <span className="text-xs text-white/50">{d.dateStr.slice(5)}</span>
                                        
                                        {/* Lock / Bulk Actions */}
                                        {!d.isSunday && (
                                            <div className="mt-3">
                                                {lockedDates[d.dateStr] ? (
                                                    <button 
                                                        onClick={() => requestUnlock(d.dateStr)}
                                                        className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] rounded border border-red-500/20 hover:bg-red-500/20 transition-colors uppercase tracking-wider font-bold w-full"
                                                        title="24h lock active. Request Principal Unlock."
                                                    >
                                                        Locked (Req Unlock)
                                                    </button>
                                                ) : (
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <button 
                                                            onClick={() => markColumnAll(d.dateStr, 'P')}
                                                            className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] rounded border border-green-500/20 hover:bg-green-500/20 transition-colors uppercase font-bold"
                                                        >
                                                            Mark All P
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {roster.map((student, s_idx) => (
                            <tr key={student.student_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4 border-r border-white/10 sticky left-0 bg-slate-900/95 z-10 group-hover:bg-slate-800 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold">{student.name}</span>
                                        <span className="text-xs text-white/50">{student.student_id}</span>
                                    </div>
                                </td>
                                {dates.map((d, d_idx) => {
                                    const key = `${student.student_id}_${d.dateStr}`;
                                    const status = attendance[key];
                                    
                                    return (
                                        <td 
                                            key={`${s_idx}_${d_idx}`} 
                                            className={`p-2 border-r border-white/5 text-center ${d.isSunday ? 'bg-slate-800/30' : ''}`}
                                            onClick={() => handleStatusClick(student.student_id, d.dateStr, d.isSunday)}
                                        >
                                            <div className="flex justify-center items-center h-full">
                                                {d.isSunday ? (
                                                    <span className="text-slate-600 text-xs uppercase font-bold tracking-widest rotate-[-90deg]">Holiday</span>
                                                ) : (
                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg border font-bold shadow-inner select-none transition-all ${getStatusColor(status, d.isSunday)} ${lockedDates[d.dateStr] ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                        {status || '-'}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceGrid;
