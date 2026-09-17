import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import MonitoringTab from './MonitoringTab';
import TeacherNoticeBoard from './TeacherNoticeBoard';
import TeacherReports from './TeacherReports';
import HODDashboard from './HODDashboard';
import MentorDashboard from './MentorDashboard';
import TimetablePanel from './TimetablePanel';
import TimeTable from './TimeTable';
import apiClient from '../../services/apiClient';
import ThemeToggle from '../../components/shared/ThemeToggle';
const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(() => {
    const month = new Date().getMonth();
    return (month >= 7 && month <= 11) ? 'Odd' : 'Even';
  });

  // Modals / Alerts
  const [selectedClass, setSelectedClass] = useState(null); // Quick Stats Modal
  const [smartAlert, setSmartAlert] = useState(null); // Banner

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // SECURITY FIX: Identity is derived from the JWT token on the backend.
        // Never pass ?email= in the URL — it enables IDOR attacks.
        const params = {};
        if (selectedSemester) params.semester = selectedSemester;
        const { data } = await apiClient.get('/api/teacher/dashboard/', { params });
        setDashboardData(data);
        if (data.smart_alert) setSmartAlert(data.smart_alert);
        if (!selectedSemester && data.teacher?.current_semester) {
          setSelectedSemester(data.teacher.current_semester.toString());
        }
      } catch (err) {
        // On API failure, render empty state — do NOT hardcode personal data
        setDashboardData({ teacher: null, assigned_classes: [], monitoring_duties: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, selectedSemester]);

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { teacher, assigned_classes, monitoring_duties } = dashboardData || {};

  return (
    <>
      {/* 1. Fixed Background Layer (Never cuts off) */}
      <div className="fixed inset-0 -z-10 bg-[url('/imgs/login-signup.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md"></div>
      </div>

      {/* 2. Scrollable Content Layer */}
      <div className="relative z-0 min-h-screen w-full overflow-y-auto p-4 md:p-6 text-gray-900 dark:text-white">
        <div className="max-w-7xl mx-auto flex flex-col min-h-full">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold tracking-wider">
            SDCCE | <span className="text-blue-400">ATTENDANCE</span>
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 text-red-200 hover:bg-red-500/40 rounded-xl backdrop-blur-md transition-colors border border-red-500/30 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Profile Card & Navigation Tabs — mirrors Student Dashboard layout */}
        {teacher && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col gap-6 mb-8">
            
            {/* Top Section: Profile (Left) & Stats Widget (Right) */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
              
              {/* Left Side: Profile Info */}
              <div className="flex flex-col gap-2 text-center md:text-left w-full md:w-auto">
                <h2 className="text-3xl font-bold mb-1">{teacher.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">{teacher.department} Department</p>
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400">
                  <span>Semester</span>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white font-bold text-sm rounded-lg px-3 py-1.5 outline-none border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 cursor-pointer shadow-sm dark:shadow-xl"
                  >
                    {(teacher.available_semesters || []).map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Side: Stats Widget (Assigned Classes & Monitoring) */}
              <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl p-4 flex items-center gap-6 w-full md:w-auto justify-center">
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Assigned Classes</p>
                  <p className="text-2xl font-bold">{assigned_classes?.length || 0}</p>
                </div>
                <div className="w-px h-10 bg-gray-300 dark:bg-white/10"></div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monitoring</p>
                  <p className="text-2xl font-bold">{monitoring_duties?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Bottom Section: Centered Navbar */}
            <div className="flex justify-center w-full">
              <div className="flex flex-wrap items-center justify-center gap-1 p-1 bg-gray-100 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl">
                {[
                  { key: 'dashboard', label: 'Dashboard', always: true },
                  { key: 'monitoring', label: 'Monitoring', always: true },
                  { key: 'notices', label: 'Notices', always: true },
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

        {/* Smart Open Logic Banner */}
        {smartAlert && activeTab === 'dashboard' && (
          <div className="bg-linear-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-xl border border-blue-400/50 rounded-2xl p-6 mb-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">You have an ongoing class!</h3>
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

        {/* Tab Content Rendering */}
        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in-up">
              <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Assigned Classes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {assigned_classes?.map(cls => (
                  <button
                    key={cls.class_id}
                    onClick={() => setSelectedClass(cls)}
                    className="group bg-white dark:bg-slate-800 backdrop-blur-2xl border border-gray-200 dark:border-slate-700 rounded-3xl p-6 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 relative overflow-hidden"
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
                ))}
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && <MonitoringTab duties={monitoring_duties} />}
          {activeTab === 'notices' && <TeacherNoticeBoard />}
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

            <div className="bg-slate-800/90 backdrop-blur-xl border border-white/20 w-full max-w-md rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden animate-fade-in-up">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedClass.subject_name}</h3>
                    <p className="text-white/60">{selectedClass.class_name}</p>
                  </div>
                  <button onClick={() => setSelectedClass(null)} className="text-white/40 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Classes Conducted</p>
                    <p className="text-2xl font-bold text-white">{selectedClass.classes_conducted}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Avg Attendance</p>
                    <p className={`text-2xl font-bold ${selectedClass.avg_attendance >= 75 ? 'text-green-400' : 'text-red-400'}`}>
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
                    onClick={() => {
                      setSelectedClass(null);
                      setActiveTab('reports');
                    }}
                    className="w-full text-center bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold border border-white/10 transition-colors"
                  >
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>
    </>
  );
};

export default TeacherDashboard;
