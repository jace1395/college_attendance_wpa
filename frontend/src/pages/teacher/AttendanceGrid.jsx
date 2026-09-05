import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { getSubjectAttendanceGrid, markAttendance } from '../../services/api';
import { saveAttendanceLocally } from '../../utils/indexedDB';

const AttendanceGrid = () => {
  const { class_id } = useParams();
  const [roster, setRoster] = useState([]);
  const [dates, setDates] = useState([]);
  const [attendance, setAttendance] = useState({}); // shape: { "student_id_date": "status" }
  const [lockedDates, setLockedDates] = useState({}); // shape: { "date": boolean }
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null); // { type: 'success'|'error'|'offline', text }
  const [selectedMode, setSelectedMode] = useState('P'); // Active legend mode
  const [viewFilter, setViewFilter] = useState('Present'); // 'Past', 'Present', 'Future'
  const scrollContainerRef = useRef(null);
  const todayColRef = useRef(null);

  // Helper to generate dates for the current month
  const generateDates = () => {
    const dts = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isSunday = d.getDay() === 0;
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      // Calculate 24-hour lock logic
      const diffInHours = (now - d) / (1000 * 60 * 60);
      const isLocked = (diffInHours > 24 && !isSunday) || d > now;

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
      try {
        const data = await getSubjectAttendanceGrid(class_id);
        const dts = generateDates();
        setDates(dts);
        setRoster(data.roster || []);

        // Build initial attendance state from API data
        const initialAtt = {};
        const locks = {};
        dts.forEach(d => { locks[d.dateStr] = d.isLocked; });
        (data.attendance_records || []).forEach(rec => {
          initialAtt[`${rec.student_id}_${rec.date}`] = rec.status;
        });

        setAttendance(initialAtt);
        setLockedDates(locks);
      } catch (err) {
        console.error('[AttendanceGrid] Failed to fetch grid data:', err);
        // Render date skeleton with empty roster on error
        const dts = generateDates();
        setDates(dts);
        setRoster([]);
        const locks = {};
        dts.forEach(d => { locks[d.dateStr] = d.isLocked; });
        setLockedDates(locks);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [class_id]);

  // Auto-scroll to today's column after data loads
  useEffect(() => {
    if (!loading && todayColRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const todayEl = todayColRef.current;
      // Scroll so today's column is roughly centered
      const scrollLeft = todayEl.offsetLeft - container.offsetWidth / 2 + todayEl.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [loading]);

  // Save today's attendance — falls back to IndexedDB when offline
  const handleSaveAttendance = async () => {
    if (roster.length === 0) {
      alert('No students in roster to save.');
      return;
    }
    setIsSaving(true);
    setSaveMessage(null);

    const records = roster.map(student => ({
      student_id: student.student_id,
      status: attendance[`${student.student_id}_${todayStr}`] || 'Absent',
    }));
    const payload = { class_id: class_id, date: todayStr, time_slot: 'Regular', records };

    if (!navigator.onLine) {
      await saveAttendanceLocally(payload);
      setSaveMessage({ type: 'offline', text: 'Offline: Attendance saved locally. Will auto-sync when reconnected.' });
      setIsSaving(false);
      return;
    }

    try {
      await markAttendance(payload);
      setSaveMessage({ type: 'success', text: "Today's attendance saved successfully!" });
    } catch (err) {
      // Network failed mid-flight — persist locally as fallback
      await saveAttendanceLocally(payload);
      setSaveMessage({ type: 'offline', text: 'Save failed. Stored locally and will sync automatically.' });
      console.error('[AttendanceGrid] Save failed, stored offline:', err);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleStatusClick = (studentId, dateStr, isSunday) => {
    if (isSunday || lockedDates[dateStr]) return;

    const key = `${studentId}_${dateStr}`;
    // Stamp with the currently selected legend mode
    setAttendance(prev => ({ ...prev, [key]: selectedMode }));
  };

  // Legend click = select mode (does NOT bulk apply)
  const handleLegendClick = (status) => {
    setSelectedMode(status);
  };

  const modeLabels = { P: 'Present', A: 'Absent', OD: 'On Duty/Leave', NI: 'Non-Instructional' };

  const markColumnAll = (dateStr) => {
    if (lockedDates[dateStr]) return;
    
    if (window.confirm(`Mark entire class as ${modeLabels[selectedMode]} (${selectedMode}) for ${dateStr}?`)) {
      setAttendance(prev => {
          const next = { ...prev };
          roster.forEach(student => {
              next[`${student.student_id}_${dateStr}`] = selectedMode;
          });
          return next;
      });
    }
  };

  const requestUnlock = (dateStr) => {
    alert(`Unlock request sent to Principal for ${dateStr}`);
  };

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const filteredDates = dates.filter(d => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dDate = new Date(d.dateStr);
    dDate.setHours(0,0,0,0);
    
    if (viewFilter === 'Past') return dDate < today;
    if (viewFilter === 'Present') return dDate.getTime() === today.getTime();
    if (viewFilter === 'Future') return dDate > today;
    return true;
  });

  const getStatusColor = (status, isSunday) => {
    if (isSunday) return 'bg-slate-700/30 text-slate-500 border-slate-700/50 cursor-not-allowed';
    switch(status) {
      case 'P': return 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 cursor-pointer';
      case 'A': return 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 cursor-pointer';
      case 'OD': return 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30 cursor-pointer';
      case 'NI': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30 cursor-pointer';
      default: return 'bg-amber-50/10 text-white/40 border-amber-100/20 hover:bg-amber-50/20 cursor-pointer'; // off-white unmarked
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
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden mx-auto min-h-screen flex flex-col">
        
        {/* Header Block */}
        <div className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Link to="/teacher/dashboard" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 text-sm font-medium">Dashboard</Link>
                <ThemeToggle />
                {/* Save Attendance Button */}
                <button
                  onClick={handleSaveAttendance}
                  disabled={isSaving || roster.length === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                      Save Attendance
                    </>
                  )}
                </button>
              </div>
              {/* Save feedback banner */}
              {saveMessage && (
                <div className={`mb-3 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in-up ${
                  saveMessage.type === 'success' ? 'bg-green-500/20 border border-green-500/40 text-green-300' :
                  saveMessage.type === 'offline' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' :
                  'bg-red-500/20 border border-red-500/40 text-red-300'
                }`}>
                  {saveMessage.text}
                </div>
              )}
                <h1 className="text-3xl font-bold mb-1">Attendance Register</h1>
                <p className="text-xl text-white/70">Class ID: {class_id}</p>
            </div>

            
            {/* View Filter */}
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 mb-4 md:mb-0">
                {['Past', 'Present', 'Future'].map(v => (
                    <button
                        key={v}
                        onClick={() => setViewFilter(v)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            viewFilter === v ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {v}
                    </button>
                ))}
            </div>

            {/* Legend - Mode Selector */}
            <div className="flex flex-wrap gap-2 bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                {[
                  { key: 'P', label: 'P (Present)', dot: 'bg-green-500/50 border-green-500/50', activeBg: 'bg-green-500/20 ring-2 ring-green-400 shadow-[0_0_12px_rgba(34,197,94,0.3)]' },
                  { key: 'A', label: 'A (Absent)', dot: 'bg-red-500/50 border-red-500/50', activeBg: 'bg-red-500/20 ring-2 ring-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]' },
                  { key: 'OD', label: 'OD (On Duty/Leave)', dot: 'bg-blue-500/50 border-blue-500/50', activeBg: 'bg-blue-500/20 ring-2 ring-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]' },
                  { key: 'NI', label: 'NI (Non-Inst)', dot: 'bg-yellow-500/50 border-yellow-500/50', activeBg: 'bg-yellow-500/20 ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.3)]' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleLegendClick(item.key)}
                    className={`flex items-center gap-2 text-xs font-medium p-2 px-3 rounded-xl transition-all ${
                      selectedMode === item.key
                        ? `${item.activeBg} text-white font-bold scale-105`
                        : 'hover:bg-white/10 text-white/60'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded border ${item.dot}`}></div>
                    {item.label}
                  </button>
                ))}
            </div>
        </div>

        {/* Excel-Like Grid */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex-1 max-w-full">
            <div className="overflow-x-auto h-[65vh]" ref={scrollContainerRef}>
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                    <thead className="sticky top-0 bg-slate-800 z-20 shadow-md">
                        <tr>
                            <th className="p-2 md:p-4 font-semibold text-white/90 border-r border-white/10 sticky left-0 bg-slate-800 z-30 min-w-30 md:min-w-50">
                                Student Details
                            </th>
                            {filteredDates.map((d, idx) => {
                                const isToday = d.dateStr === todayStr;
                                return (
                                <th
                                  key={idx}
                                  ref={isToday ? todayColRef : null}
                                  onClick={() => !d.isSunday && !lockedDates[d.dateStr] && markColumnAll(d.dateStr)}
                                  title={!d.isSunday && !lockedDates[d.dateStr] ? `Click to mark entire class as ${modeLabels[selectedMode]} for this date` : d.isSunday ? 'Holiday' : '24h lock active'}
                                  className={`p-2 md:p-4 font-semibold border-r border-white/10 text-center transition-colors ${d.isSunday ? 'text-slate-500 bg-slate-800/80' : isToday ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60 cursor-pointer' : lockedDates[d.dateStr] ? 'text-white/90 opacity-60 cursor-not-allowed' : 'text-white/90 hover:bg-white/10 cursor-pointer'}`}
                                >
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs md:text-sm">{isToday ? '📍 Today' : d.dayName}</span>
                                        <span className="text-[10px] md:text-xs text-white/50">{d.dateStr.slice(5)}</span>
                                        
                                        {/* Lock indicator */}
                                        {!d.isSunday && lockedDates[d.dateStr] && (
                                            <div className="mt-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); requestUnlock(d.dateStr); }}
                                                    className="px-1 md:px-2 py-1 bg-red-500/10 text-red-400 text-[9px] md:text-[10px] rounded border border-red-500/20 hover:bg-red-500/20 transition-colors uppercase tracking-wider font-bold w-full truncate"
                                                    title="24h lock active. Request Principal Unlock."
                                                >
                                                    Locked
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </th>
                                );
                            })}
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
                                {filteredDates.map((d, d_idx) => {
                                    const key = `${student.student_id}_${d.dateStr}`;
                                    const status = attendance[key];
                                    
                                    return (
                                        <td 
                                            key={`${s_idx}_${d_idx}`} 
                                            className={`p-2 border-r border-white/5 text-center ${d.isSunday ? 'bg-slate-800/30' : d.dateStr === todayStr ? 'bg-blue-900/10' : ''}`}
                                            onClick={() => handleStatusClick(student.student_id, d.dateStr, d.isSunday)}
                                        >
                                            <div className="flex justify-center items-center h-full">
                                                {d.isSunday ? (
                                                    <span className="text-slate-600 text-[9px] md:text-xs uppercase font-bold tracking-widest -rotate-90">Holiday</span>
                                                ) : (
                                                    <div className={`w-7 h-7 md:w-10 md:h-10 text-xs md:text-sm flex items-center justify-center rounded-lg border font-bold shadow-inner select-none transition-all ${getStatusColor(status, d.isSunday)} ${lockedDates[d.dateStr] ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                        {status || '·'}
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
