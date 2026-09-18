import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PrincipalReportsHub from './PrincipalReportsHub';
import PrincipalSearch from './PrincipalSearch';
import PrincipalViewTab from './PrincipalViewTab';
import apiClient from '../../services/apiClient';
import Layout from '../../components/shared/Layout';

const PrincipalDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/api/principal/dashboard/');
        setDashboardData(data);
      } catch (err) {
        // On API failure, render empty state — no hardcoded data
        setDashboardData({
          principal: null,
          college_stats_today: null,
          streams_available: [],
          pending_approvals: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const { principal, college_stats_today, streams_available } = dashboardData || {};

  return (
    <Layout>
      {/* Principal-specific sub-header: Live Clock + Date Picker */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
        <div>
          <p className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-wider mb-0.5">Live Time</p>
          <h2 className="text-2xl font-bold tracking-wider font-mono text-purple-600 dark:text-purple-300 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {liveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl px-4 py-2 border border-gray-200 dark:border-white/10 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <input
            type="date"
            value={globalDate}
            onChange={(e) => setGlobalDate(e.target.value)}
            className="bg-transparent outline-none text-sm text-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Navigation Tabs & Profile Info */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="text-center md:text-left">
          {principal ? (
            <>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white/90">{principal.name}</h3>
              <p className="text-purple-600 dark:text-purple-300 font-medium">Principal, Shree Damodar College</p>
            </>
          ) : (
            !loading && <p className="text-gray-400 dark:text-white/30">Principal data unavailable</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100/80 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl w-fit">
          {['dashboard', 'view', 'reports', 'search'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'dashboard' && (
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
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl h-20"></div>
            </div>
          ) : (
            <div className="animate-fade-in-up space-y-8">
              {/* 4 Metric Cards */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 cursor-pointer"
                onClick={() => setActiveTab('view')}
              >
                {[
                  { label: 'Total Present', value: college_stats_today?.total_students_present, color: 'purple', textColor: 'text-gray-900 dark:text-white' },
                  { label: 'Total Absent', value: college_stats_today?.total_students_absent, color: 'red', textColor: 'text-gray-900 dark:text-white' },
                  { label: 'Overall %', value: college_stats_today?.overall_attendance_percentage != null ? `${college_stats_today.overall_attendance_percentage}%` : '—', color: 'green', textColor: 'text-green-600 dark:text-green-400' },
                  { label: 'Classes Conducted', value: college_stats_today?.classes_conducted_today, color: 'blue', textColor: 'text-blue-600 dark:text-blue-400' },
                ].map(({ label, value, color, textColor }) => (
                  <div key={label} className={`bg-white dark:bg-slate-800 border border-${color}-500/30 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-${color}-500/60 transition-colors`}>
                    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${color}-500/20 rounded-full blur-xl group-hover:bg-${color}-500/30 transition-colors`}></div>
                    <p className="text-gray-500 dark:text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">{label}</p>
                    <p className={`text-4xl font-bold ${textColor}`}>{value ?? '—'}</p>
                  </div>
                ))}
              </div>

              {/* Info Banner */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white/90">Attendance Unlock Requests</p>
                  <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                    Unlock requests from teachers are managed in the <span className="text-blue-600 dark:text-blue-300 font-medium">Admin Console → System Overrides</span>.
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'reports' && <PrincipalReportsHub streams={streams_available} onNavigateToView={() => setActiveTab('view')} />}
        {activeTab === 'view' && <PrincipalViewTab streams={streams_available} />}
        {activeTab === 'search' && <PrincipalSearch />}
      </div>
    </Layout>
  );
};

export default PrincipalDashboard;
