import React, { useState, useEffect } from 'react';

const MonitoringTab = ({ duties }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
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

  // Assuming 1 duty for simplicity based on mock data
  const duty = duties[0];
  
  // Logic for countdown and lock
  // Parse time_start (e.g., "09:15")
  const [startHour, startMinute] = duty.time_start.split(':').map(Number);
  
  const startTime = new Date();
  startTime.setHours(startHour, startMinute, 0, 0);

  const isLocked = currentTime < startTime;
  const timeRemaining = Math.max(0, Math.floor((startTime - currentTime) / 1000));

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-fade-in-up max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Monitoring Duty</h2>
          <p className="text-white/60">{duty.room}</p>
        </div>
        <div className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl font-bold text-lg">
          {duty.time_start} - {duty.time_end}
        </div>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 mb-6">
        <label className="block text-sm text-white/70 mb-2">Total Students Present in Area</label>
        
        {isLocked ? (
          <div className="flex items-center gap-4 text-orange-400 bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
            <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="font-semibold">Duty starts in: {formatTime(timeRemaining)}</span>
          </div>
        ) : (
          <input 
            type="number"
            min="0"
            className="w-full bg-slate-800 text-white text-lg rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-blue-500 transition-colors"
            placeholder="Enter count..."
          />
        )}
      </div>

      <button 
        disabled={isLocked}
        className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg text-lg ${
          isLocked 
            ? 'bg-slate-800 text-white/30 cursor-not-allowed border border-white/5'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transform hover:-translate-y-1' 
        }`}
      >
        Submit Report
      </button>
    </div>
  );
};

export default MonitoringTab;
