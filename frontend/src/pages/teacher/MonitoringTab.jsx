import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const MonitoringTab = () => {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedDuty, setExpandedDuty] = useState(null);
  const [studentCount, setStudentCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeView, setActiveView] = useState('active'); // 'active' or 'archived'

  useEffect(() => {
    const fetchDuties = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/teacher/monitoring/duties/');
        if (res.status === 200) {
          setDuties(res.data);
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

  const handleSubmit = async (dutyId) => {
    const duty = duties.find(d => d.id === dutyId);
    if (!duty || !studentCount) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/teacher/monitoring/duties/', {
        duty_id: duty.id,
        total_students_present: studentCount
      });
      if (res.status === 200) {
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
    if (seconds >= 86400) {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      return `${d}d ${h}h`;
    }
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h}h ${m}m ${s}s`;
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  const activeDuties = duties.filter(d => {
      const dutyDate = new Date(d.date);
      dutyDate.setHours(0,0,0,0);
      return dutyDate.getTime() === today.getTime() && d.status !== 'Completed';
  });
  
  const archivedDuties = duties.filter(d => {
      const dutyDate = new Date(d.date);
      dutyDate.setHours(0,0,0,0);
      return (dutyDate.getTime() === today.getTime() && d.status === 'Completed') || dutyDate.getTime() < today.getTime();
  });

  const groupDutiesByDate = (dutyList) => {
    return dutyList.reduce((acc, duty) => {
        if (!acc[duty.date]) acc[duty.date] = [];
        acc[duty.date].push(duty);
        return acc;
    }, {});
  };

  const groupDutiesByMonthAndDate = (dutyList) => {
    return dutyList.reduce((acc, duty) => {
        const dutyDate = new Date(duty.date);
        const monthKey = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(dutyDate);
        if (!acc[monthKey]) acc[monthKey] = {};
        if (!acc[monthKey][duty.date]) acc[monthKey][duty.date] = [];
        acc[monthKey][duty.date].push(duty);
        return acc;
    }, {});
  };

  const groupedActive = groupDutiesByDate(activeDuties);
  const groupedArchivedByMonth = groupDutiesByMonthAndDate(archivedDuties);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  const renderDutyCards = (dutyList) => {
    return dutyList.map(duty => {
      const [startHour, startMinute] = (duty.time_start || "09:00").split(':').map(Number);
      const startTime = new Date(duty.date);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const isLocked = currentTime < startTime && duty.status !== 'Completed';
      const timeRemaining = Math.max(0, Math.floor((startTime - currentTime) / 1000));
      const isExpanded = expandedDuty === duty.id;

      return (
          <div 
              key={duty.id}
              className={`group backdrop-blur-2xl border rounded-3xl p-6 text-left shadow-xl relative overflow-hidden transition-all duration-300 ${
                  isExpanded 
                      ? 'ring-2 ring-blue-500 bg-slate-800/90 border-blue-500/50 scale-100 opacity-100' 
                      : expandedDuty !== null 
                          ? 'bg-slate-900/50 border-white/10 opacity-50 scale-[0.98] hover:opacity-80 hover:scale-100 cursor-pointer'
                          : 'bg-slate-900/80 border-white/20 hover:bg-slate-800/90 hover:border-white/30 hover:shadow-2xl cursor-pointer'
              }`}
              onClick={() => {
                  if (isExpanded) {
                      setExpandedDuty(null);
                  } else {
                      setExpandedDuty(duty.id);
                      setStudentCount(duty.total_enrolled ? duty.total_enrolled.toString() : "");
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
                          {duty.status === 'Completed' ? (
                              <div className="flex flex-col items-center justify-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                  <svg className="w-8 h-8 text-emerald-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                  <p className="text-emerald-400 font-semibold mb-1">Attendance Submitted</p>
                                  <p className="text-emerald-400/70 text-sm mb-4">You have already entered the count.</p>
                                  <button 
                                      onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                              await apiClient.post('/api/teacher/monitoring/unlock-request/', { duty_id: duty.id });
                                              alert("Unlock request sent to administrators.");
                                          } catch (err) {
                                              alert(err.response?.data?.error || "Failed to send unlock request.");
                                          }
                                      }}
                                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs font-bold text-white transition-colors"
                                  >
                                      Request Unlock from Admin
                                  </button>
                              </div>
                          ) : (
                              <>
                                  <label className="block text-sm text-white/70 mb-2">Total Students Present {duty.total_enrolled ? `(Max: ${duty.total_enrolled})` : ""}</label>
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
                                              onChange={e => {
                                                  let val = e.target.value;
                                                  if (duty.total_enrolled && parseInt(val) > duty.total_enrolled) {
                                                      val = duty.total_enrolled.toString();
                                                  }
                                                  setStudentCount(val);
                                              }}
                                              className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 outline-none border border-white/20 focus:border-blue-500 transition-colors pr-16 disabled:opacity-50"
                                              placeholder="Enter count..."
                                          />
                                      </div>
                                  )}
                              </>
                          )}
                      </div>

                      <div className="flex flex-col gap-3">
                          {duty.status !== 'Completed' && (
                              <button
                                  disabled={isLocked || submitting || !studentCount}
                                  onClick={() => handleSubmit(duty.id)}
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
    });
  };

  return (
    <div className="">
      {/* Internal Tabs for Monitoring */}
      <div className="flex items-center gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 w-max">
          <button
              onClick={() => setActiveView('active')}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeView === 'active' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
              Active Today ({activeDuties.length})
          </button>
          <button
              onClick={() => setActiveView('archived')}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeView === 'archived' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
              Archived History ({archivedDuties.length})
          </button>
      </div>

      {activeView === 'active' && (
          <div className="animate-fade-in">
              {Object.keys(groupedActive).length > 0 ? (
                  Object.keys(groupedActive).sort((a,b) => a.localeCompare(b)).map(dateStr => (
                      <div key={dateStr} className="mb-8">
                          <h4 className="text-xl font-medium text-white/80 mb-4 pb-2 border-b border-white/10">{formatDate(dateStr)}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                              {renderDutyCards(groupedActive[dateStr])}
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="flex flex-col items-center justify-center h-48 bg-slate-900/50 border border-white/10 rounded-3xl">
                      <p className="text-white/50 text-lg">No active monitoring duties today.</p>
                  </div>
              )}
          </div>
      )}

      {activeView === 'archived' && (
          <div className="animate-fade-in opacity-80">
              {Object.keys(groupedArchivedByMonth).length > 0 ? (
                  Object.keys(groupedArchivedByMonth).sort((a,b) => b.localeCompare(a)).map(monthStr => (
                      <div key={monthStr} className="mb-12">
                          <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/20 pb-2">{monthStr}</h3>
                          
                          {Object.keys(groupedArchivedByMonth[monthStr]).sort((a,b) => b.localeCompare(a)).map(dateStr => (
                              <div key={dateStr} className="mb-8 ml-4">
                                  <h4 className="text-lg font-medium text-white/70 mb-4">{formatDate(dateStr)}</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                                      {renderDutyCards(groupedArchivedByMonth[monthStr][dateStr])}
                                  </div>
                              </div>
                          ))}
                      </div>
                  ))
              ) : (
                  <div className="flex flex-col items-center justify-center h-48 bg-slate-900/50 border border-white/10 rounded-3xl">
                      <p className="text-white/50 text-lg">No duties archived yet.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default MonitoringTab;
