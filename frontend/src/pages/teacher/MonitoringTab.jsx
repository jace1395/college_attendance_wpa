import React, { useState, useEffect } from 'react';

const MonitoringTab = ({ duties }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedDuty, setExpandedDuty] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!duties || duties.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-fade-in-up">
        <h3 className="text-xl text-white/60 font-medium">You have no monitoring duties assigned for today.</h3>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-fade-in-up">
      <h3 className="text-2xl font-semibold mb-6">Monitoring Duties</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {duties.map((duty, idx) => {
            const [startHour, startMinute] = (duty.time_start || "09:00").split(':').map(Number);
            const startTime = new Date();
            startTime.setHours(startHour, startMinute, 0, 0);
            
            const isLocked = currentTime < startTime;
            const timeRemaining = Math.max(0, Math.floor((startTime - currentTime) / 1000));
            const isExpanded = expandedDuty === idx;

            return (
                <div 
                    key={idx}
                    className={`group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left transition-all shadow-xl relative overflow-hidden ${
                        isExpanded ? 'ring-2 ring-blue-500 bg-white/10' : 'hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
                    }`}
                    onClick={() => !isExpanded && setExpandedDuty(idx)}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <h4 className="text-2xl font-bold mb-1">{duty.subject_name || duty.room}</h4>
                            <p className="text-white/60">{duty.class_name || "General Duty"}</p>
                        </div>
                        <div className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg font-bold text-sm">
                            {duty.time_start} - {duty.time_end}
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="mt-6 border-t border-white/10 pt-6 animate-fade-in-up relative z-10" onClick={e => e.stopPropagation()}>
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
                                            className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 outline-none border border-white/20 focus:border-blue-500 transition-colors pr-16"
                                            placeholder="Enter count..."
                                        />
                                        {duty.total_students && (
                                            <div className="absolute right-4 text-white/50 font-medium pointer-events-none">
                                                / {duty.total_students}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    disabled={isLocked}
                                    className={`w-full py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm ${isLocked
                                        ? 'bg-slate-800 text-white/30 cursor-not-allowed border border-white/5'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                                    }`}
                                >
                                    Submit Report
                                </button>
                                <button
                                    className="w-full py-2.5 rounded-xl font-bold transition-all border border-white/20 text-white hover:bg-white/10 flex items-center justify-center gap-2 text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Download Report
                                </button>
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
