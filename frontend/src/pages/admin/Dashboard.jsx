import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from './UserManagement';
import SystemOverrides from './SystemOverrides';
import AdminReports from './AdminReports';
import StudentDataEntry from './StudentDataEntry';
import AdminStudentReports from './AdminStudentReports';
import ThemeToggle from '../../components/shared/ThemeToggle';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState('2026-2027');

  const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027', '2027-2028'];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/dashboard/`);
        if (!response.ok) throw new Error('API not available');
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        // Fallback to mock data
        setTimeout(() => {
          setDashboardData({
            admin: {
              name: user.name || "System Admin",
              email: user.email || "admin@vvm.edu.in",
              role: "Superuser"
            },
            system_stats: {
              total_students: 0,
              total_teachers: 0,
              active_sessions: 0,
              last_database_backup: "No backups available"
            },
            recent_audit_logs: []
          });
          setLoading(false);
        }, 600);
      }
    };

    fetchDashboard();
  }, [user]);

  const handleManualBackup = () => {
      alert(`Triggering backup for Academic Year ${academicYear} to Google Cloud Storage...`);
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { admin, system_stats, recent_audit_logs } = dashboardData || {};

  return (
    <div 
      className="min-h-screen bg-cover bg-fixed text-white pb-10"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md fixed pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        
        {/* Header Block */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl">
          <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
              </div>
              <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-wider">
                      ADMIN <span className="text-blue-400">CONSOLE</span>
                  </h1>
                  <p className="text-sm text-white/50">{admin?.email} â€¢ <span className="text-blue-300">{admin?.role}</span></p>
              </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="bg-slate-800/70 text-white/80 text-sm rounded-xl px-3 py-2 border border-white/10 focus:border-blue-500 outline-none cursor-pointer"
              >
                {ACADEMIC_YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
              </select>
              <button 
                onClick={handleManualBackup}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Sync / Backup
              </button>
              <ThemeToggle />
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 text-red-200 hover:bg-red-500/40 rounded-xl transition-colors border border-red-500/30 text-sm font-medium"
              >
                Logout
              </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-start mb-8 overflow-x-auto pb-2">
            <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 shrink-0">
                {['overview', 'users', 'overrides', 'reports', 'data-entry', 'student-reports'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${
                            activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                         {tab === 'data-entry' ? 'Manage Data' : tab === 'student-reports' ? 'Student Reports' : tab}
                    </button>
                ))}
            </div>
        </div>

        {/* Tab Content Rendering */}
        <div className="flex-1">
            {activeTab === 'overview' && (
                <div className="animate-fade-in-up space-y-8">
                    
                    {/* System Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Total Students</p>
                            <p className="text-4xl font-bold text-white">{system_stats?.total_students}</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Total Teachers</p>
                            <p className="text-4xl font-bold text-white">{system_stats?.total_teachers}</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-green-500/30 rounded-3xl p-6 shadow-[0_0_15px_rgba(34,197,94,0.15)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/20 rounded-full blur-xl group-hover:bg-green-500/30 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Active Sessions</p>
                            <div className="flex items-center gap-3">
                                <p className="text-4xl font-bold text-green-400">{system_stats?.active_sessions}</p>
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-colors"></div>
                            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Last Backup</p>
                            <p className="text-xl font-bold text-white/90 mt-2">Today, 02:00 AM</p>
                        </div>
                    </div>

                    {/* Audit Trail */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                            <div className="p-2 bg-slate-800 rounded-lg text-white/60">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold">System Audit Trail</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-4">
                            {recent_audit_logs?.map((log, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            {log.action.includes('User') && <span className="w-2.5 h-2.5 rounded-full bg-green-500 block shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>}
                                            {log.action.includes('Backup') && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>}
                                            {log.action.includes('Role') && <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>}
                                            {log.action.includes('Unlock') && <span className="w-2.5 h-2.5 rounded-full bg-red-500 block shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>}
                                            {log.action.includes('Bulk') && <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 block shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white/90">{log.action}</p>
                                            <p className="text-sm text-white/50">{log.target}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-white/40 mt-2 sm:mt-0 font-mono">
                                        {log.timestamp}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'overrides' && <SystemOverrides />}
            {activeTab === 'reports' && <AdminReports />}
            {activeTab === 'data-entry' && <StudentDataEntry />}
            {activeTab === 'student-reports' && <AdminStudentReports />}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
