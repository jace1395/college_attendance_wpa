import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getDepartmentFromId } from '../../utils/studentUtils';
import apiClient from '../../services/apiClient';
import ThemeToggle from '../../components/shared/ThemeToggle';
const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');

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
        const { data } = await apiClient.get('/api/student/dashboard/', { params });
        setDashboardData(data);
        if (!selectedSemester && data.student?.current_semester) {
          setSelectedSemester(data.student.current_semester.toString());
        }
      } catch (err) {
        // On API failure, render empty state — do NOT hardcode personal data
        setDashboardData({ student: null, subjects: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, selectedSemester]);

  const handleSemesterChange = (e) => {
      setSelectedSemester(e.target.value);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'text-green-600 dark:text-green-400 bg-green-500';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500';
    return 'text-red-600 dark:text-red-400 bg-red-500';
  };

  const getProgressStrokeColor = (percentage) => {
    if (percentage >= 75) return '#22c55e'; // green-500
    if (percentage >= 60) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { student, subjects } = dashboardData || {};
  const departmentName = getDepartmentFromId(student?.student_id);

  // Circular Progress Calculation
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = student ? circumference - (student.overall_attendance / 100) * circumference : circumference;

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

        {loading && dashboardData && (
             <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50">
                 <div className="bg-slate-800/90 text-white px-4 py-2 rounded-full shadow-lg border border-white/10 text-sm flex items-center gap-2">
                     <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                     Updating...
                 </div>
             </div>
        )}

        {/* Profile Card & Navigation Tabs */}
        {student && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col gap-6 mb-8">
            
            {/* Top Section: Profile (Left) & Stats Widget (Right) */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
              
              {/* Left Side: Profile Info */}
              <div className="flex flex-col gap-2 text-center md:text-left w-full md:w-auto">
                <h2 className="text-3xl font-bold mb-1">{student.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">{student.program || departmentName} | Roll No: <span className="text-gray-900 dark:text-white font-medium">{student.student_id}</span></p>
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400">
                    <span>Semester</span>
                    <select 
                        value={selectedSemester}
                        onChange={handleSemesterChange}
                        className="bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm rounded-lg px-2 py-1 outline-none border border-gray-200 dark:border-slate-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                        {student.available_semesters.map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                        ))}
                    </select>
                </div>
              </div>
              
              {/* Right Side: Circular Progress Widget */}
              <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl p-4 flex items-center gap-6 w-full md:w-auto justify-center">
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Attendance</p>
                  <p className="text-2xl font-bold">{student.overall_attendance}%</p>
                </div>
                {/* Circular Progress */}
                <div className="relative w-20 h-20 md:w-24 md:h-24">
                  <svg className="w-20 h-20 md:w-24 md:h-24 transform -rotate-90">
                    <circle
                      className="text-gray-200 dark:text-white/10"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r={radius}
                      cx="50%"
                      cy="50%"
                    />
                    <circle
                      className="transition-all duration-1000 ease-in-out"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke={getProgressStrokeColor(student.overall_attendance)}
                      fill="transparent"
                      r={radius}
                      cx="50%"
                      cy="50%"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {student.overall_attendance}%
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Centered Navbar */}
            <div className="flex justify-center w-full">
              <div className="flex flex-wrap items-center justify-center gap-1 p-1 bg-gray-100 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl">
                <Link to="/student/timetable" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/50">Timetable</Link>
                <Link to="/student/settings" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/50">Settings</Link>
              </div>
            </div>
          </div>
        )}

        {/* Subjects Grid */}
        <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Your Classes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {subjects && subjects.map((subject) => (
            <Link 
              to={`/student/subject/${subject.subject_id}`} 
              key={subject.subject_id}
              className="group bg-white dark:bg-slate-800 backdrop-blur-xl border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 block"
            >
              <div className="p-6">
                <h4 className="text-xl font-bold truncate mb-1 text-gray-900 dark:text-white">{subject.subject_name}</h4>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-6">{subject.teacher_name}</p>
                
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Attendance</span>
                  <span className={`text-lg font-bold ${getProgressColor(subject.attendance_percentage).replace('bg-green-500', '').replace('bg-yellow-500', '').replace('bg-red-500', '')} bg-transparent`}>
                    {subject.attendance_percentage}%
                  </span>
                </div>
                
                {/* Linear Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-4 overflow-hidden border border-gray-300 dark:border-slate-600">
                  <div 
                    className={`h-3 rounded-full ${subject.attendance_percentage >= 75 ? 'bg-green-500' : subject.attendance_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${subject.attendance_percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 pt-3 border-t border-gray-200 dark:border-slate-700">
                  <span className="font-medium">Conducted: {subject.total_classes_conducted}</span>
                  <span className="font-medium">Attended: {subject.classes_attended}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
