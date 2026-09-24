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
  const [viewTabDefaultFilter, setViewTabDefaultFilter] = useState('Trends');
  const [viewTabParams, setViewTabParams] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/api/principal/dashboard/?date=${globalDate}`);
        setDashboardData(data);
      } catch (err) {
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
  }, [user, globalDate]);

  const { principal, college_stats_today, streams_available, stream_stats, class_stats } = dashboardData || {};

  const getBarColor = (percentage) => {
    if (percentage >= 75) return '#22c55e'; // green-500
    if (percentage >= 50) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const handleMetricCardClick = () => {
    setActiveTab('view');
    setViewTabDefaultFilter('Trends');
    setViewTabParams(null);
  };

  return (
    <Layout>
      {/* Navigation Tabs & Profile Info */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 mb-10 pb-6 border-b border-gray-200 dark:border-white/10">
        <div className="text-center xl:text-left flex flex-col sm:flex-row items-center gap-6 xl:gap-8">
          <div className="max-w-[200px] sm:max-w-[300px]">
            {principal ? (
              <>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 break-words whitespace-normal">{principal.name}</h3>
                <p className="text-purple-600 dark:text-purple-400 font-semibold tracking-wide break-words whitespace-normal">Principal, Shree Damodar College</p>
              </>
            ) : (
              !loading && <p className="text-gray-400 dark:text-white/30">Principal data unavailable</p>
            )}
          </div>
          
          <div className="h-14 w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>
          
          {/* Live Date Integrated */}
          <div className="flex flex-row items-center justify-center gap-4 whitespace-nowrap bg-gray-50 dark:bg-slate-900/50 rounded-2xl px-6 py-3 border border-gray-200 dark:border-white/10 shadow-sm">
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

        <div className="flex flex-nowrap items-center gap-1 sm:gap-2 p-1 bg-gray-100 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl w-full xl:w-auto shadow-sm overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {['dashboard', 'view', 'monitoring', 'reports', 'search'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-none px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-200 whitespace-nowrap ${
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
                onClick={handleMetricCardClick}
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
                <PrincipalAdvancedGraph 
                  streams={streams_available} 
                  onGraphClick={(params) => { 
                    setActiveTab('view'); 
                    setViewTabDefaultFilter('Trends');
                    setViewTabParams(params);
                    
                    if (params?.date) {
                      // Attempt to parse the date to YYYY-MM-DD
                      try {
                        const parsed = new Date(params.date);
                        if (!isNaN(parsed)) {
                          const yyyy = parsed.getFullYear();
                          const mm = String(parsed.getMonth() + 1).padStart(2, '0');
                          const dd = String(parsed.getDate()).padStart(2, '0');
                          setGlobalDate(`${yyyy}-${mm}-${dd}`);
                        }
                      } catch (e) {
                        // ignore parse errors
                      }
                    }
                  }} 
                />
              </div>
            </div>
          )
        )}

        {activeTab === 'reports' && <PrincipalReportsHub streams={streams_available} onNavigateToView={() => { setActiveTab('view'); setViewTabDefaultFilter('Trends'); setViewTabParams(null); }} />}
        {activeTab === 'view' && <PrincipalViewTab streams={streams_available} defaultSubTab={viewTabDefaultFilter} defaultParams={viewTabParams} />}
        {activeTab === 'monitoring' && <PrincipalMonitoringTab />}
        {activeTab === 'search' && <PrincipalSearch />}
      </div>
    </Layout>
  );
};

export default PrincipalDashboard;
