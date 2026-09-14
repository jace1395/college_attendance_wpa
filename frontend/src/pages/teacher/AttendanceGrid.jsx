import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSubjectAttendanceGrid, markAttendance } from '../../services/api';
import { saveAttendanceLocally } from '../../utils/indexedDB';
import ThemeToggle from '../../components/shared/ThemeToggle';

const AttendanceGrid = () => {
  const { class_id } = useParams();
  const [roster, setRoster] = useState([]);
  const [dates, setDates] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [lockedDates, setLockedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [selectedMode, setSelectedMode] = useState('P');
  
  // Date Picker State
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    if (d.getDay() === 0) d.setDate(d.getDate() - 1); // Sunday -> Saturday
    return d.toISOString().split('T')[0];
  });
  
  const scrollContainerRef = useRef(null);
  const todayColRef = useRef(null);

  const generateDates = (dateString) => {
    const dts = [];
    const now = new Date(); // True current time for lock logic
    const refDate = new Date(dateString);
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isSunday = d.getDay() === 0;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
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
        const dts = generateDates(selectedDate);
        setDates(dts);
        setRoster(data.roster || []);

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
        const dts = generateDates(selectedDate);
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
  }, [class_id, selectedDate]);

  useEffect(() => {
    if (!loading && todayColRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const todayEl = todayColRef.current;
      const scrollLeft = todayEl.offsetLeft - container.offsetWidth / 2 + todayEl.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [loading, dates]);

  const handleSaveAttendance = async () => {
    if (roster.length === 0) {
      alert('No students in roster to save.');
      return;
    }
    setIsSaving(true);
    setSaveMessage(null);

    const records = roster.map(student => ({
      student_id: student.student_id,
      status: attendance[`${student.student_id}_${selectedDate}`] || 'Absent',
    }));
    const payload = { class_id: class_id, date: selectedDate, time_slot: 'Regular', records };

    if (!navigator.onLine) {
      await saveAttendanceLocally(payload);
      setSaveMessage({ type: 'offline', text: 'Offline: Attendance saved locally. Will auto-sync when reconnected.' });
      setIsSaving(false);
      return;
    }

    try {
      await markAttendance(payload);
      setSaveMessage({ type: 'success', text: "Attendance saved successfully!" });
    } catch (err) {
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
    setAttendance(prev => ({ ...prev, [key]: selectedMode }));
  };

  const handleLegendClick = (status) => setSelectedMode(status);
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

  const requestUnlock = (dateStr) => alert(`Unlock request sent to Principal for ${dateStr}`);

  const getStatusColor = (status, isSunday) => {
    if (isSunday) return 'bg-slate-700/30 text-slate-500 cursor-not-allowed';
    switch(status) {
      case 'P': return 'bg-green-500/20 text-green-400 cursor-pointer';
      case 'A': return 'bg-red-500/20 text-red-400 cursor-pointer';
      case 'OD': return 'bg-blue-500/20 text-blue-400 cursor-pointer';
      case 'NI': return 'bg-yellow-500/20 text-yellow-400 cursor-pointer';
      default: return 'bg-transparent text-white/20 hover:bg-white/5 cursor-pointer'; 
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
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden mx-auto min-h-screen flex flex-col">
        
                <Link to="/teacher/dashboard" className="text-blue-400 hover:text-blue-300 mb-6 inline-flex items-center gap-2 font-medium w-fit">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>

        {/* Header Block */}
        <div className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <ThemeToggle />
                <Link to="/teacher/settings" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 text-sm font-medium">Settings</Link>
                <button
                  onClick={handleSaveAttendance}
                  disabled={isSaving || roster.length === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
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
            
            {/* Calendar Date Picker */}
            <div className="flex bg-slate-900/50 p-2 rounded-xl border border-white/10 mb-4 md:mb-0 items-center gap-3">
                <label className="text-sm font-medium text-white/70">Select Date:</label>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-800 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 [color-scheme:dark]"
                />
            </div>

            {/* Legend - Mode Selector */}
            <div className="flex flex-wrap gap-2 bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                {[
                  { key: 'P', label: 'P (Present)', dot: 'bg-green-500/50', activeBg: 'bg-green-500/20 ring-2 ring-green-400' },
                  { key: 'A', label: 'A (Absent)', dot: 'bg-red-500/50', activeBg: 'bg-red-500/20 ring-2 ring-red-400' },
                  { key: 'OD', label: 'OD (On Duty/Leave)', dot: 'bg-blue-500/50', activeBg: 'bg-blue-500/20 ring-2 ring-blue-400' },
                  { key: 'NI', label: 'NI (Non-Inst)', dot: 'bg-yellow-500/50', activeBg: 'bg-yellow-500/20 ring-2 ring-yellow-400' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleLegendClick(item.key)}
                    className={`flex items-center gap-2 text-xs font-medium p-2 px-3 rounded-xl transition-all ${
                      selectedMode === item.key ? `${item.activeBg} text-white font-bold scale-105` : 'hover:bg-white/10 text-white/60'
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
                            {dates.map((d, idx) => {
                                const isSelected = d.dateStr === selectedDate;
                                return (
                                <th
                                  key={idx}
                                  ref={isSelected ? todayColRef : null}
                                  onClick={() => !d.isSunday && !lockedDates[d.dateStr] && markColumnAll(d.dateStr)}
                                  title={!d.isSunday && !lockedDates[d.dateStr] ? `Click to mark entire class as ${modeLabels[selectedMode]} for this date` : d.isSunday ? 'Holiday' : '24h lock active'}
                                  className={`p-2 md:p-4 font-semibold border-r border-white/10 text-center transition-colors ${d.isSunday ? 'text-slate-500 bg-slate-800/80' : isSelected ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60 cursor-pointer' : lockedDates[d.dateStr] ? 'text-white/90 opacity-60 cursor-not-allowed' : 'text-white/90 hover:bg-white/10 cursor-pointer'}`}
                                >
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs md:text-sm">{isSelected ? '📍 ' + d.dayName : d.dayName}</span>
                                        <span className="text-[10px] md:text-xs text-white/50">{d.dateStr.slice(5)}</span>
                                        
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
                                {dates.map((d, d_idx) => {
                                    const key = `${student.student_id}_${d.dateStr}`;
                                    const status = attendance[key];
                                    
                                    return (
                                        <td 
                                            key={`${s_idx}_${d_idx}`} 
                                            className={`p-0 border-r border-white/5 text-center relative ${d.isSunday ? 'bg-slate-800/30' : d.dateStr === selectedDate ? 'bg-blue-900/10' : ''}`}
                                            onClick={() => handleStatusClick(student.student_id, d.dateStr, d.isSunday)}
                                        >
                                            <div className="w-full h-full min-h-[40px] flex justify-center items-center">
                                                {d.isSunday ? (
                                                    <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest absolute -rotate-90 origin-center whitespace-nowrap">Holiday</span>
                                                ) : (
                                                    <div className={`w-full h-full min-h-[40px] text-xs md:text-sm flex items-center justify-center font-bold select-none transition-all hover:brightness-125 ${getStatusColor(status, d.isSunday)} ${lockedDates[d.dateStr] ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
