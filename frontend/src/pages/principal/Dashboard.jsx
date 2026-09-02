import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PrincipalReportsHub from './PrincipalReportsHub';
import PrincipalSearch from './PrincipalSearch';
import PrincipalNoticeBoard from './PrincipalNoticeBoard';
import PrincipalViewTab from './PrincipalViewTab';
import ThemeToggle from '../../components/shared/ThemeToggle';

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
          setDashboardData({
            principal: {
              name: user?.name || "Dr. Principal",
              email: user?.email || "principal@vvm.edu.in",
            },
            college_stats_today: {
              total_students_present: 0,
              total_students_absent: 0,
              overall_attendance_percentage: 0,
              classes_conducted_today: 0
            },
            streams_available: [
              "BCom", "BCA", "BVoc", "BBA", "BBA(FS)", "MCom", "LLB", "LLM"
            ],
            pending_approvals: []
          });
          setLoading(false);
        }, 600);
      }
    };

    fetchDashboard();
  }, [user]);


  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const { principal, college_stats_today, streams_available } = dashboardData || {};

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
              <ThemeToggle />
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
                {['dashboard', 'view', 'reports', 'search', 'notices'].map(tab => (
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 cursor-pointer" onClick={() => setActiveTab('view')}>
                        <div className="bg-white/5 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden group hover:border-purple-500/60 transition-colors">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Total Present</p>
                            <p className="text-4xl font-bold text-white">{college_stats_today?.total_students_present}</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-3xl p-6 shadow-[0_0_15px_rgba(239,68,68,0.1)] relative overflow-hidden group hover:border-red-500/60 transition-colors">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/20 rounded-full blur-xl group-hover:bg-red-500/30 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Total Absent</p>
                            <p className="text-4xl font-bold text-white">{college_stats_today?.total_students_absent}</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-green-500/30 rounded-3xl p-6 shadow-[0_0_15px_rgba(34,197,94,0.15)] relative overflow-hidden group hover:border-green-500/60 transition-colors">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/20 rounded-full blur-xl group-hover:bg-green-500/30 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Overall %</p>
                            <p className="text-4xl font-bold text-green-400">{college_stats_today?.overall_attendance_percentage}%</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-6 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative overflow-hidden group hover:border-blue-500/60 transition-colors">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Classes Conducted</p>
                            <p className="text-4xl font-bold text-blue-400">{college_stats_today?.classes_conducted_today}</p>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="font-semibold text-white/90">Attendance Unlock Requests</p>
                            <p className="text-sm text-white/50 mt-0.5">Unlock requests from teachers are now managed in the <span className="text-blue-300 font-medium">Admin Console → System Overrides</span>.</p>
                        </div>
                    </div>

                </div>
            )}

            {activeTab === 'reports' && <PrincipalReportsHub streams={streams_available} onNavigateToView={() => setActiveTab('view')} />}
            {activeTab === 'view' && <PrincipalViewTab streams={streams_available} />}
            {activeTab === 'search' && <PrincipalSearch />}
            {activeTab === 'notices' && <PrincipalNoticeBoard />}
        </div>

      </div>
    </div>
  );
};

export default PrincipalDashboard;
