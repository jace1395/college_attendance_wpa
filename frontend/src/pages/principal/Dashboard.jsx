import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PrincipalReportsHub from './PrincipalReportsHub';
import PrincipalSearch from './PrincipalSearch';
import PrincipalViewTab from './PrincipalViewTab';
import apiClient from '../../services/apiClient';
import Layout from '../../components/shared/Layout';
import PrincipalMonitoringTab from './PrincipalMonitoringTab';
import PrincipalAdvancedGraph from './PrincipalAdvancedGraph';

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

  const { principal, college_stats_today, streams_available, stream_stats, class_stats } = dashboardData || {};

  const getBarColor = (percentage) => {
    if (percentage >= 75) return '#22c55e'; // green-500
    if (percentage >= 50) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  return (
    <Layout>
      {/* Navigation Tabs & Profile Info */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 mb-10 pb-6 border-b border-gray-200 dark:border-white/10">
        <div className="text-center xl:text-left flex flex-col sm:flex-row items-center gap-6 xl:gap-8">
          <div>
            {principal ? (
              <>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{principal.name}</h3>
                <p className="text-purple-600 dark:text-purple-400 font-semibold tracking-wide">Principal, Shree Damodar College</p>
              </>
            ) : (
              !loading && <p className="text-gray-400 dark:text-white/30">Principal data unavailable</p>
            )}
          </div>
          
          <div className="h-14 w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>
          
          {/* Live Date/Time Integrated */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl px-6 py-3 border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-xl font-bold tracking-wider font-mono text-purple-600 dark:text-purple-400 flex items-center gap-2 sm:border-r border-gray-200 dark:border-white/10 sm:pr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {liveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h2>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <input
                type="date"
                value={globalDate}
                onChange={(e) => setGlobalDate(e.target.value)}
                className="bg-transparent outline-none text-base text-gray-700 dark:text-white/90 font-medium cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-2 p-2 bg-gray-100 dark:bg-slate-800/80 border border-gray-200 dark:border-white/10 rounded-2xl w-full xl:w-auto shadow-sm">
          {['dashboard', 'view', 'monitoring', 'reports', 'search'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 xl:flex-none px-6 py-3 rounded-xl text-sm font-bold capitalize transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 transform scale-[1.02]'
                  : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
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
            <div className=" space-y-8">
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

              {/* Interactive Graphs */}
              <div className="mt-8">
                <PrincipalAdvancedGraph streams={streams_available} />
              </div>
            </div>
          )
        )}

        {activeTab === 'reports' && <PrincipalReportsHub streams={streams_available} onNavigateToView={() => setActiveTab('view')} />}
        {activeTab === 'view' && <PrincipalViewTab streams={streams_available} />}
        {activeTab === 'monitoring' && <PrincipalMonitoringTab />}
        {activeTab === 'search' && <PrincipalSearch />}
      </div>
    </Layout>
  );
};

export default PrincipalDashboard;
