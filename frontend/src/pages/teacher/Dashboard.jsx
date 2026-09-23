import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import MonitoringTab from './MonitoringTab';

import TeacherReports from './TeacherReports';
import HODDashboard from './HODDashboard';
import MentorDashboard from './MentorDashboard';
import TimetablePanel from './TimetablePanel';
import TimeTable from './TimeTable';
import apiClient from '../../services/apiClient';
import Layout from '../../components/shared/Layout';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals / Alerts
  const [selectedClass, setSelectedClass] = useState(null);
  const [smartAlert, setSmartAlert] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // No semester filter — teachers teach across all active semesters
        const { data } = await apiClient.get('/api/teacher/dashboard/');
        setDashboardData(data);
        if (data.smart_alert) setSmartAlert(data.smart_alert);
      } catch (err) {
        // On API failure, render empty state
        setDashboardData({ teacher: null, assigned_classes: [], monitoring_duties: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const { teacher, assigned_classes, monitoring_duties } = dashboardData || {};

  return (
    <Layout>
      {/* Initial Skeleton Loader */}
      {loading && !dashboardData ? (
        <div className="animate-pulse space-y-6">
          {/* Profile card skeleton */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-3 flex-1">
                <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
              <div className="flex gap-6">
                <div className="w-20 h-16 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="w-20 h-16 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
              </div>
            </div>
            <div className="flex justify-center mt-4 gap-2">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>)}
            </div>
          </div>
          {/* Class cards skeleton */}
          <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 space-y-3">
                <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-px bg-gray-200 dark:bg-slate-700 mt-6"></div>
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {teacher && (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col gap-6 mb-8">

              {/* Top: Profile (Left) & Stats (Right) */}
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">

                {/* Left: Profile Info */}
                <div className="flex flex-col gap-2 text-center md:text-left w-full md:w-auto">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{teacher.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">{teacher.department} Department</p>
                  
                  {/* Stream/Subject/Class Selector */}
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400">
                    <select 
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          navigate(`/teacher/class/${e.target.value}`);
                        }
                      }}
                      className="bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm rounded-lg px-2 py-1 outline-none border border-gray-200 dark:border-slate-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="" disabled>Select Stream / Subject / Class</option>
                      {assigned_classes?.map(cls => (
                        <option key={cls.class_id} value={cls.class_id}>
                          {cls.dept_name || 'Computer Science'} - {cls.subject_name} ({cls.class_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right: Stats Widget */}
                <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl p-4 flex items-center gap-4 w-full md:w-auto justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Classes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{assigned_classes?.length || 0}</p>
                  </div>
                  <div className="w-px h-10 bg-gray-300 dark:bg-white/10 mx-2"></div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monitoring</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{monitoring_duties?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Bottom: Tab Navigation */}
              <div className="flex justify-center w-full">
                <div className="flex flex-wrap items-center justify-center gap-2 p-1 bg-gray-100 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl">
                  {[
                    { key: 'dashboard', label: 'Dashboard', always: true },
                    { key: 'monitoring', label: 'Monitoring', always: true },
                    { key: 'reports', label: 'Reports', always: true },
                    { key: 'my_timetable', label: 'Timetable', always: true },
                    { key: 'mentor', label: '★ Mentor', show: Boolean(teacher?.isMentor || user?.is_mentor) },
                    { key: 'hod', label: '★ HOD', show: Boolean(teacher?.isHOD || user?.is_hod) },
                    { key: 'timetable', label: '★ Timetable Incharge', show: Boolean(teacher?.isTimetableIncharge || user?.is_timetable_incharge) },
                  ]
                    .filter(tab => tab.always || tab.show)
                    .map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.key
                            ? tab.key === 'hod' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                              : tab.key === 'mentor' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                : tab.key === 'timetable' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                  : 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Smart Alert Banner */}
          {smartAlert && activeTab === 'dashboard' && (
            <div className="bg-linear-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-xl border border-blue-400/50 rounded-2xl p-6 mb-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">You have an ongoing class!</h3>
                  <p className="text-blue-100">{smartAlert.subject} in {smartAlert.room}</p>
                </div>
              </div>
              <Link
                to={`/teacher/class/${smartAlert.class_id}`}
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-1 whitespace-nowrap"
              >
                Take Attendance Now
              </Link>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="">
                <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Assigned Classes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assigned_classes && assigned_classes.length > 0 ? assigned_classes.map(cls => (
                    <button
                      key={cls.class_id}
                      onClick={() => setSelectedClass(cls)}
                      className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 text-left hover:bg-gray-50 dark:hover:bg-slate-700  shadow-sm hover:shadow-md hover:-translate-y-1 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
                      <h4 className="text-2xl font-bold mb-1 relative z-10 text-gray-900 dark:text-white">{cls.class_name}</h4>
                      <p className="text-blue-600 dark:text-blue-400 mb-8 relative z-10">{cls.subject_name}</p>
                      <div className="flex justify-between items-end relative z-10 border-t border-gray-200 dark:border-slate-700 pt-4">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Avg Attendance</p>
                          <p className={`text-xl font-bold ${cls.avg_attendance >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {cls.avg_attendance}%
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-600 transition-colors text-gray-600 dark:text-gray-400 group-hover:text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </div>
                    </button>
                  )) : (
                    <div className="col-span-full text-center py-16 text-gray-400 dark:text-white/30">
                      <p className="text-lg">No classes assigned yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'monitoring' && <MonitoringTab duties={monitoring_duties} />}

            {activeTab === 'reports' && <TeacherReports classes={assigned_classes} />}
            {activeTab === 'hod' && <HODDashboard onBack={() => setActiveTab('dashboard')} />}
            {activeTab === 'mentor' && <MentorDashboard onBack={() => setActiveTab('dashboard')} />}
            {activeTab === 'my_timetable' && <TimeTable />}
            {activeTab === 'timetable' && <TimetablePanel onBack={() => setActiveTab('dashboard')} />}
          </div>

          {/* Quick Stats Modal */}
          {selectedClass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedClass(null)}></div>
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/20 w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden ">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedClass.subject_name}</h3>
                      <p className="text-gray-600 dark:text-white/60">{selectedClass.class_name}</p>
                    </div>
                    <button onClick={() => setSelectedClass(null)} className="text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white bg-gray-100 dark:bg-white/5 p-2 rounded-full transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-200 dark:border-white/5 text-center">
                      <p className="text-xs text-gray-500 dark:text-white/50 uppercase tracking-wider mb-1">Classes Conducted</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedClass.classes_conducted}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-200 dark:border-white/5 text-center">
                      <p className="text-xs text-gray-500 dark:text-white/50 uppercase tracking-wider mb-1">Avg Attendance</p>
                      <p className={`text-2xl font-bold ${selectedClass.avg_attendance >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                        {selectedClass.avg_attendance}%
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      to={`/teacher/class/${selectedClass.class_id}`}
                      className="w-full text-center bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-1"
                    >
                      Mark Attendance
                    </Link>
                    <button
                      onClick={() => { setSelectedClass(null); setActiveTab('reports'); }}
                      className="w-full text-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white py-3 rounded-xl font-bold border border-gray-200 dark:border-white/10 transition-colors"
                    >
                      View Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default TeacherDashboard;
