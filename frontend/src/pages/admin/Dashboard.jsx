import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserManagement from './UserManagement';
import SystemOverrides from './SystemOverrides';
import AdminReports from './AdminReports';
import StudentDataEntry from './StudentDataEntry';
import apiClient from '../../services/apiClient';
import Layout from '../../components/shared/Layout';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditFilter, setAuditFilter] = useState('All');

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);

  const [showYearModal, setShowYearModal] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const [creatingYear, setCreatingYear] = useState(false);

  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupFormat, setBackupFormat] = useState('excel');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/api/admin/dashboard/');
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setDashboardData({
          admin: null,
          system_stats: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchAuditLogs = async () => {
      setAuditLoading(true);
      try {
        const { data } = await apiClient.get(`/api/admin/audit-logs/?page=${auditCurrentPage}&role=${auditFilter}`);
        setAuditLogs(data.logs || []);
        setAuditTotalPages(data.total_pages || 1);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setAuditLoading(false);
      }
    };

    fetchAuditLogs();
  }, [user, auditCurrentPage, auditFilter]);

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    try {
      const { data, headers } = await apiClient.get(`/api/admin/backup/export/?type=${backupFormat}&academic_year=All`, {
        responseType: 'blob'
      });

      const contentDisposition = headers['content-disposition'];
      let filename = `College_Backup_All.${backupFormat === 'excel' ? 'xlsx' : backupFormat}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match.length > 1) {
          filename = match[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowBackupModal(false);

      // Refresh dashboard stats to get updated last_backup_date
      const dbResponse = await apiClient.get('/api/admin/dashboard/');
      setDashboardData(dbResponse.data);
    } catch (err) {
      console.error(err);
      alert("Failed to download backup: " + (err.response?.data?.detail || err.response?.data?.error || err.message));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setAuditFilter(filter);
    setAuditCurrentPage(1);
  };

  const handleCreateNewYear = async () => {
    if (!newYearInput.trim()) return;
    setCreatingYear(true);
    try {
      await apiClient.post('/api/admin/dashboard/', {
        action: 'new_academic_year',
        year: newYearInput
      });
      setShowYearModal(false);
      setNewYearInput('');
      const { data } = await apiClient.get('/api/admin/dashboard/');
      setDashboardData(data);
    } catch (err) {
      alert("Failed to create new academic year: " + (err.response?.data?.error || err.message));
    } finally {
      setCreatingYear(false);
    }
  };

  const { admin, system_stats } = dashboardData || {};

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
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-start mb-8 overflow-x-auto pb-2">
        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100/80 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl w-fit">
          {['overview', 'users', 'overrides', 'reports', 'data-entry'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize  whitespace-nowrap ${activeTab === tab
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
            >
              {tab === 'data-entry' ? 'Manage Data' : tab}
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
            <div className=" space-y-8">
              {/* System Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Students', value: system_stats?.total_students, color: 'blue' },
                  { label: 'Total Teachers', value: system_stats?.total_teachers, color: 'purple' },
                  { label: 'Active Sessions', value: system_stats?.active_sessions, color: 'green', live: true, breakdown: `Teachers: ${system_stats?.active_teachers || 0} | Students: ${system_stats?.active_students || 0}`, info: 'Total number of users who have logged in today' },
                  { label: 'Last Backup', value: system_stats?.last_database_backup || 'N/A', color: 'yellow', isText: true },
                ].map(({ label, value, color, live, isText, breakdown, info }) => (
                  <div key={label} className={`bg-white dark:bg-slate-800 border ${color === 'green' ? 'border-green-500/30' : 'border-gray-200 dark:border-white/10'} rounded-3xl p-6 shadow-sm relative overflow-visible group`}>
                    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${color}-500/10 rounded-full blur-xl group-hover:bg-${color}-500/20 transition-colors pointer-events-none`}></div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-gray-500 dark:text-white/60 text-sm font-semibold uppercase tracking-wider">{label}</p>
                      {info && (
                        <div className="relative group/tooltip">
                          <svg className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 dark:hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-active/tooltip:opacity-100 group-active/tooltip:visible transition-all z-20 text-center shadow-xl">
                            {info}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    {isText ? (
                      <div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white/90 mt-2">{value}</p>
                        {label === 'Last Backup' && (
                          <button
                            onClick={() => setShowBackupModal(true)}
                            className="mt-4 px-4 py-2 w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-bold text-sm rounded-xl transition-colors border border-yellow-500/20"
                          >
                            Download Backup
                          </button>
                        )}
                      </div>
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
                    {breakdown && (
                      <p className="text-xs text-gray-500 dark:text-white/50 mt-2 font-medium">{breakdown}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Classes */}
              {system_stats?.active_class_names && system_stats.active_class_names.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Classes Conducted Today</h3>
                  <div className="flex flex-wrap gap-2">
                    {system_stats.active_class_names.map((className, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-500/20">
                        {className}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Academic Year Management */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Academic Year Management</h3>
                  <p className="text-sm text-gray-500 dark:text-white/50 mt-1">Current Active Year: <span className="font-semibold text-blue-600 dark:text-blue-400">{system_stats?.current_academic_year || "2026-2027"}</span></p>
                </div>
                <button
                  onClick={() => setShowYearModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-bold shadow-sm shadow-blue-500/20"
                >
                  Create New Academic Year
                </button>
              </div>

              {/* Audit Trail */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-600 dark:text-white/60">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">System Audit Trail</h3>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900/50 p-1 rounded-xl overflow-x-auto custom-scrollbar">
                    {['All', 'Admin', 'Teacher', 'Student'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => handleFilterChange(filter)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${auditFilter === filter
                          ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                          }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`overflow-y-auto max-h-96 pr-2 space-y-3 transition-opacity duration-300 ${auditLoading ? 'opacity-50' : 'opacity-100'}`}>
                  {auditLogs && auditLogs.length > 0 ? auditLogs.map((log, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {log.role === 'Admin' && <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>}
                          {log.role === 'Teacher' && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>}
                          {log.role === 'Student' && <span className="w-2.5 h-2.5 rounded-full bg-green-500 block shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>}
                          {(!log.role || !['Admin', 'Teacher', 'Student'].includes(log.role)) && <span className="w-2.5 h-2.5 rounded-full bg-gray-400 block shadow-[0_0_8px_rgba(156,163,175,0.8)]"></span>}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white/90">
                            {log.action} <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-md bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300">{log.role}</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-white/50">{log.target}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-white/40 mt-2 sm:mt-0 font-mono">{log.timestamp}</div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-white/50">No recent activity for this filter.</p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {auditTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                    <button
                      onClick={() => setAuditCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={auditCurrentPage === 1 || auditLoading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-700"
                    >
                      Previous
                    </button>

                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Page <span className="font-semibold text-gray-900 dark:text-white">{auditCurrentPage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{auditTotalPages}</span>
                    </span>

                    <button
                      onClick={() => setAuditCurrentPage(prev => Math.min(auditTotalPages, prev + 1))}
                      disabled={auditCurrentPage === auditTotalPages || auditLoading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-700"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'overrides' && <SystemOverrides />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'data-entry' && <StudentDataEntry />}
      </div>

      {/* Create New Academic Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-200 dark:border-white/10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create New Academic Year</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm mb-4 border border-yellow-200 dark:border-yellow-700/50">
              <span className="font-bold">Warning:</span> Creating a new academic year will archive all currently active classes and clear the active timetable to prepare for a fresh start.
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Academic Year</label>
              <input
                type="text"
                placeholder="e.g. 2027-2028"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowYearModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewYear}
                disabled={creatingYear || !newYearInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {creatingYear && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Confirm Creation
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Download Backup</h3>
              <button onClick={() => setShowBackupModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Select the format for the full college attendance backup.</p>

              <div className="space-y-3">
                {[
                  { id: 'excel', label: 'Excel (.xlsx)', desc: 'Grouped into sheets by Stream' },
                  { id: 'pdf', label: 'PDF Report (.pdf)', desc: 'Formatted tabular report' },
                  { id: 'csv', label: 'CSV (.csv)', desc: 'Raw data suitable for scripts' }
                ].map(format => (
                  <label key={format.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${backupFormat === format.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                    <input
                      type="radio"
                      name="format"
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full"
                      checked={backupFormat === format.id}
                      onChange={() => setBackupFormat(format.id)}
                    />
                    <div>
                      <span className={`block font-semibold text-sm ${backupFormat === format.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{format.label}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{format.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadBackup}
                  disabled={isDownloading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDownloading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Download'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default AdminDashboard;
