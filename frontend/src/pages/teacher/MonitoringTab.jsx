import React, { useState, useEffect } from 'react';

const MonitoringTab = () => {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedDuty, setExpandedDuty] = useState(null);
  const [studentCount, setStudentCount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDuties = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/teacher/monitoring/duties/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDuties(data);
        }
      } catch (err) {
        console.error("Error fetching monitoring duties", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDuties();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (dutyIdx) => {
    const duty = duties[dutyIdx];
    if (!duty || !studentCount) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/teacher/monitoring/duties/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          duty_id: duty.id,
          total_students_present: studentCount
        })
      });
      if (res.ok) {
        alert("Report submitted successfully!");
        setDuties(duties.map(d => d.id === duty.id ? { ...d, status: "Completed", total_students: studentCount } : d));
        setExpandedDuty(null);
        setStudentCount("");
      } else {
        alert("Failed to submit report.");
      }
    } catch (err) {
      alert("Error submitting report.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!duties || duties.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl ">
        <h3 className="text-xl text-white/60 font-medium">You have no monitoring duties assigned for today.</h3>
      </div>
    );
  }

  return (
    <div className="">
      <h3 className="text-2xl font-semibold mb-6">Monitoring Duties</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {duties.map((duty, idx) => {
            const [startHour, startMinute] = (duty.time_start || "09:00").split(':').map(Number);
            const startTime = new Date(duty.date);
            startTime.setHours(startHour, startMinute, 0, 0);
            
            const isLocked = currentTime < startTime && duty.status !== 'Completed';
            const timeRemaining = Math.max(0, Math.floor((startTime - currentTime) / 1000));
            const isExpanded = expandedDuty === idx;

            return (
                <div 
                    key={idx}
                    className={`group bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 text-left  shadow-xl relative overflow-hidden ${
                        isExpanded ? 'ring-2 ring-blue-500 bg-slate-800/90' : 'hover:bg-slate-800/90 hover:border-white/30 hover:shadow-2xl cursor-pointer'
                    }`}
                    onClick={() => {
                        if (!isExpanded) {
                            setExpandedDuty(idx);
                            setStudentCount("");
                        }
                    }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <h4 className="text-2xl font-bold mb-1">{duty.room || duty.subject_name}</h4>
                            <p className="text-white/60">{duty.class_name || "General Duty"}</p>
                        </div>
                        <div className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg font-bold text-sm">
                            {duty.time_start} - {duty.time_end}
                        </div>
                    </div>
                    
                    <div className="relative z-10 mt-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${duty.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {duty.status}
                        </span>
                        {duty.status === 'Completed' && (
                            <span className="ml-2 text-xs text-emerald-400">
                                {duty.total_students} Students Present
                            </span>
                        )}
                    </div>

                    {isExpanded && (
                        <div className="mt-6 border-t border-white/10 pt-6  relative z-10" onClick={e => e.stopPropagation()}>
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 mb-4">
                                <label className="block text-sm text-white/70 mb-2">Total Students Present</label>
                                {isLocked ? (
                                    <div className="flex items-center gap-3 text-orange-400 bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 text-sm">
                                        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <span className="font-semibold">Duty starts in: {formatTime(timeRemaining)}</span>
                                    </div>
                                ) : (
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            min="0"
                                            disabled={duty.status === 'Completed'}
                                            value={studentCount}
                                            onChange={e => setStudentCount(e.target.value)}
                                            className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 outline-none border border-white/20 focus:border-blue-500 transition-colors pr-16 disabled:opacity-50"
                                            placeholder="Enter count..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                {duty.status !== 'Completed' && (
                                    <button
                                        disabled={isLocked || submitting || !studentCount}
                                        onClick={() => handleSubmit(idx)}
                                        className={`w-full py-2.5 rounded-xl font-bold  shadow-lg text-sm ${isLocked || submitting || !studentCount
                                            ? 'bg-slate-800 text-white/30 cursor-not-allowed border border-white/5'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                                        }`}
                                    >
                                        {submitting ? "Submitting..." : "Submit Report"}
                                    </button>
                                )}
                                <button
                                    onClick={() => setExpandedDuty(null)}
                                    className="w-full py-2 text-white/50 hover:text-white text-xs underline mt-2"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default MonitoringTab;
