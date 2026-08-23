import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PrincipalReportsHub from '../../components/principal/PrincipalReportsHub';
import PrincipalSearch from '../../components/principal/PrincipalSearch';
import PrincipalNoticeBoard from '../../components/principal/PrincipalNoticeBoard';

const PrincipalDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [liveTime, setLiveTime] = useState(new Date());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // Mocking API fetch
        const response = await fetch(`/api/principal/dashboard/`);
        if (!response.ok) throw new Error('API not available');
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.log("Backend not found, falling back to mock data.");
        setTimeout(() => {
          const mockData = {
            "principal": {
              "name": user.name || "Dr. Prita D Mallya",
              "email": user.email || "principal@vvm.edu.in"
            },
            "college_stats_today": {
              "total_students_present": 1245,
              "total_students_absent": 155,
              "overall_attendance_percentage": 88.9,
              "classes_conducted_today": 42
            },
            "streams_available": [
              "BCom", "BCA", "BVoc", "BBA", "BBA(FS)", "MCom", "LLB", "LLM"
            ],
            "pending_approvals": [
              {
                "request_id": "REQ_001",
                "teacher_name": "Sumit Kumar",
                "class_name": "SY BVoc(ST)",
                "subject": "Web Development",
                "date_to_unlock": "2026-08-21",
                "reason": "Forgot to mark attendance due to technical issue."
              },
              {
                "request_id": "REQ_002",
                "teacher_name": "Anita Desai",
                "class_name": "FY BBA",
                "subject": "Marketing",
                "date_to_unlock": "2026-08-20",
                "reason": "Correcting a mistaken absentee mark."
              }
            ]
          };
          setDashboardData(mockData);
          setLoading(false);
        }, 600);
      }
    };

    fetchDashboard();
  }, [user]);

  const handleApproveUnlock = (requestId) => {
      // Mock API call to unlock
      alert(`Request ${requestId} approved! The teacher's grid for this date has been unlocked.`);
      setDashboardData(prev => ({
          ...prev,
          pending_approvals: prev.pending_approvals.filter(r => r.request_id !== requestId)
      }));
  };

  const handleDenyUnlock = (requestId) => {
      alert(`Request ${requestId} denied.`);
      setDashboardData(prev => ({
          ...prev,
          pending_approvals: prev.pending_approvals.filter(r => r.request_id !== requestId)
      }));
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const { principal, college_stats_today, streams_available, pending_approvals } = dashboardData || {};

  return (
    <div 
      className="min-h-screen bg-cover bg-fixed text-white pb-10"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md fixed pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        
        {/* Header Block with Global Date Picker and Live Clock */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl">
          <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-bold tracking-wider font-mono text-purple-100 flex items-center gap-3">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {liveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h1>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="bg-slate-900/50 rounded-xl px-4 py-2 border border-white/10 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <input 
                      type="date"
                      value={globalDate}
                      onChange={(e) => setGlobalDate(e.target.value)}
                      className="bg-transparent outline-none text-sm text-white"
                  />
              </div>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 text-red-200 hover:bg-red-500/40 rounded-xl transition-colors border border-red-500/30 text-sm font-medium"
              >
                Logout
              </button>
          </div>
        </div>

        {/* Navigation Tabs & Profile Info */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-white/90">{principal?.name}</h2>
                <p className="text-purple-300 font-medium">Principal, Shree Damodar College</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10">
                {['dashboard', 'reports', 'search', 'notices'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                            activeTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {/* Tab Content Rendering */}
        <div className="flex-1">
            {activeTab === 'dashboard' && (
                <div className="animate-fade-in-up space-y-8">
                    
                    {/* 4 Glowing Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white/5 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Total Present</p>
                            <p className="text-4xl font-bold text-white">{college_stats_today?.total_students_present}</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-3xl p-6 shadow-[0_0_15px_rgba(239,68,68,0.1)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/20 rounded-full blur-xl group-hover:bg-red-500/30 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Total Absent</p>
                            <p className="text-4xl font-bold text-white">{college_stats_today?.total_students_absent}</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-green-500/30 rounded-3xl p-6 shadow-[0_0_15px_rgba(34,197,94,0.15)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/20 rounded-full blur-xl group-hover:bg-green-500/30 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Overall %</p>
                            <p className="text-4xl font-bold text-green-400">{college_stats_today?.overall_attendance_percentage}%</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-6 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Classes Conducted</p>
                            <p className="text-4xl font-bold text-blue-400">{college_stats_today?.classes_conducted_today}</p>
                        </div>
                    </div>

                    {/* Action Center - Pending Approvals */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-yellow-100">Action Center: Unlock Requests</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pending_approvals?.map(req => (
                                <div key={req.request_id} className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg">{req.teacher_name}</h4>
                                            <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-white/60">{req.request_id}</span>
                                        </div>
                                        <p className="text-sm text-white/70 mb-1">
                                            <span className="font-semibold text-white/90">Class:</span> {req.class_name} • {req.subject}
                                        </p>
                                        <p className="text-sm text-white/70 mb-1">
                                            <span className="font-semibold text-white/90">Date to Unlock:</span> {req.date_to_unlock}
                                        </p>
                                        <p className="text-sm text-yellow-200/70 italic mt-3 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                                            "{req.reason}"
                                        </p>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button 
                                            onClick={() => handleApproveUnlock(req.request_id)}
                                            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-1"
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => handleDenyUnlock(req.request_id)}
                                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl font-bold transition-colors border border-white/10"
                                        >
                                            Deny
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!pending_approvals || pending_approvals.length === 0) && (
                                <div className="col-span-1 lg:col-span-2 text-center py-10 text-white/50">
                                    No pending unlock requests at this time.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {activeTab === 'reports' && <PrincipalReportsHub streams={streams_available} />}
            {activeTab === 'search' && <PrincipalSearch />}
            {activeTab === 'notices' && <PrincipalNoticeBoard />}
        </div>

      </div>
    </div>
  );
};

export default PrincipalDashboard;
