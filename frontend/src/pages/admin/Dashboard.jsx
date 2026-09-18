import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserManagement from './UserManagement';
import SystemOverrides from './SystemOverrides';
import AdminReports from './AdminReports';
import StudentDataEntry from './StudentDataEntry';
import AdminStudentReports from './AdminStudentReports';
import apiClient from '../../services/apiClient';
import Layout from '../../components/shared/Layout';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState('2026-2027');

  const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027', '2027-2028'];

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/api/admin/dashboard/');
        setDashboardData(data);
      } catch (err) {
        // On API failure, render empty state — no hardcoded data
        setDashboardData({
          admin: null,
          system_stats: null,
          recent_audit_logs: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const handleManualBackup = () => {
    alert(`Triggering backup for Academic Year ${academicYear} to Google Cloud Storage...`);
  };

  const { admin, system_stats, recent_audit_logs } = dashboardData || {};

  return (
    <Layout>
      {/* Admin-specific Sub-header */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4 bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-white/10 rounded-3xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-gray-900 dark:text-white">
              ADMIN <span className="text-blue-600 dark:text-blue-400">CONSOLE</span>
            </h2>
            {admin && (
              <p className="text-sm text-gray-500 dark:text-white/50">
                {admin.email} • <span className="text-blue-600 dark:text-blue-300">{admin.role}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="bg-gray-50 dark:bg-slate-800/70 text-gray-800 dark:text-white/80 text-sm rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10 focus:border-blue-500 outline-none cursor-pointer"
          >
            {ACADEMIC_YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
          <button
            onClick={handleManualBackup}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-bold shadow-sm shadow-blue-500/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Sync / Backup
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-start mb-8 overflow-x-auto pb-2">
        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100/80 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl w-fit">
          {['overview', 'users', 'overrides', 'reports', 'data-entry', 'student-reports'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {tab === 'data-entry' ? 'Manage Data' : tab === 'student-reports' ? 'Student Reports' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'overview' && (
          loading && !dashboardData ? (
            /* Skeleton Loader */
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl p-6">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 mb-4"></div>
                    <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl p-6">
                <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700/50 rounded-2xl mb-3"></div>)}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up space-y-8">
              {/* System Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Students', value: system_stats?.total_students, color: 'blue' },
                  { label: 'Total Teachers', value: system_stats?.total_teachers, color: 'purple' },
                  { label: 'Active Sessions', value: system_stats?.active_sessions, color: 'green', live: true },
                  { label: 'Last Backup', value: system_stats?.last_backup || 'N/A', color: 'yellow', isText: true },
                ].map(({ label, value, color, live, isText }) => (
                  <div key={label} className={`bg-white dark:bg-slate-800 border ${color === 'green' ? 'border-green-500/30' : 'border-gray-200 dark:border-white/10'} rounded-3xl p-6 shadow-sm relative overflow-hidden group`}>
                    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${color}-500/10 rounded-full blur-xl group-hover:bg-${color}-500/20 transition-colors`}></div>
                    <p className="text-gray-500 dark:text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">{label}</p>
                    {isText ? (
                      <p className="text-xl font-bold text-gray-900 dark:text-white/90 mt-2">{value}</p>
                    ) : (
                      <div className="flex items-center gap-3">
                        <p className={`text-4xl font-bold ${color === 'green' ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>{value ?? '—'}</p>
                        {live && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Audit Trail */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
                  <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-600 dark:text-white/60">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">System Audit Trail</h3>
                </div>
                <div className="overflow-y-auto max-h-96 pr-2 space-y-3">
                  {recent_audit_logs && recent_audit_logs.length > 0 ? recent_audit_logs.map((log, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {log.action.includes('User') && <span className="w-2.5 h-2.5 rounded-full bg-green-500 block shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>}
                          {log.action.includes('Backup') && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>}
                          {log.action.includes('Role') && <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>}
                          {log.action.includes('Unlock') && <span className="w-2.5 h-2.5 rounded-full bg-red-500 block shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>}
                          {log.action.includes('Bulk') && <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 block shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white/90">{log.action}</p>
                          <p className="text-sm text-gray-500 dark:text-white/50">{log.target}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-white/40 mt-2 sm:mt-0 font-mono">{log.timestamp}</div>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-gray-400 dark:text-white/30">
                      <p>No audit logs available.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'overrides' && <SystemOverrides />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'data-entry' && <StudentDataEntry />}
        {activeTab === 'student-reports' && <AdminStudentReports />}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
