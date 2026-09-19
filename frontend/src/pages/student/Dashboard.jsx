import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getDepartmentFromId } from '../../utils/studentUtils';
import apiClient from '../../services/apiClient';
import Layout from '../../components/shared/Layout';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // SECURITY FIX: Identity is derived from the JWT token on the backend.
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

  const getProgressStrokeColor = (percentage) => {
    if (percentage >= 75) return '#22c55e';
    if (percentage >= 60) return '#eab308';
    return '#ef4444';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAttendanceTextColor = (percentage) => {
    if (percentage >= 75) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const { student, subjects } = dashboardData || {};
  const departmentName = getDepartmentFromId(student?.student_id);

  // Circular Progress
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = student
    ? circumference - (student.overall_attendance / 100) * circumference
    : circumference;

  return (
    <Layout>
      {/* Semester-switching inline loader */}
      {loading && dashboardData && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white dark:bg-slate-800/90 text-gray-800 dark:text-white px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-white/10 text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            Updating...
          </div>
        </div>
      )}

      {/* Initial Skeleton Loader */}
      {loading && !dashboardData ? (
        <div className="animate-pulse space-y-6">
          {/* Profile card skeleton */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-3 flex-1">
                <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
              </div>
              <div className="w-24 h-24 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
            </div>
          </div>
          {/* Subject cards skeleton */}
          <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-40"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full mt-4"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Profile Card & Navigation Tabs */}
          {student && (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col gap-6 mb-8">

              {/* Top: Profile (Left) & Stats Widget (Right) */}
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">

                {/* Left: Profile Info */}
                <div className="flex flex-col gap-2 text-center md:text-left w-full md:w-auto">
                  <h2 className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{student.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                    {student.program || departmentName} | Roll No: <span className="text-gray-900 dark:text-white font-medium">{student.student_id}</span>
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400">
                    <span>Semester</span>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm rounded-lg px-2 py-1 outline-none border border-gray-200 dark:border-slate-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {student.available_semesters?.map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right: Circular Progress Widget */}
                <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl p-4 flex items-center gap-6 w-full md:w-auto justify-center">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Attendance</p>
                    <p className={`text-2xl font-bold ${getAttendanceTextColor(student.overall_attendance)}`}>
                      {student.overall_attendance}%
                    </p>
                  </div>
                  <div className="relative w-20 h-20 md:w-24 md:h-24">
                    <svg className="w-20 h-20 md:w-24 md:h-24 transform -rotate-90">
                      <circle className="text-gray-200 dark:text-white/10" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="50%" cy="50%" />
                      <circle className=" 0 ease-in-out" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke={getProgressStrokeColor(student.overall_attendance)} fill="transparent" r={radius} cx="50%" cy="50%" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
                      {student.overall_attendance}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Quick Nav */}
              <div className="flex justify-center w-full">
                <div className="flex flex-wrap items-center justify-center gap-1 p-1 bg-gray-100 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl">
                  <Link to="/student/timetable" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/50">Timetable</Link>
                  <Link to="/student/notifications" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/50">Notifications</Link>
                  <a href="#subjects" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/50">Subjects</a>
                </div>
              </div>
            </div>
          )}

          {/* Subjects Grid */}
          <h3 id="subjects" className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white pt-4">Your Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {subjects && subjects.length > 0 ? subjects.map((subject) => (
              <Link
                to={`/student/subject/${subject.subject_id}`}
                key={subject.subject_id}
                className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:bg-gray-50 dark:hover:bg-slate-700  shadow-sm hover:shadow-md hover:-translate-y-1 block"
              >
                <div className="p-6">
                  <h4 className="text-xl font-bold truncate mb-1 text-gray-900 dark:text-white">{subject.subject_name}</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-6">{subject.teacher_name}</p>

                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Attendance</span>
                    <span className={`text-lg font-bold ${getAttendanceTextColor(subject.attendance_percentage)}`}>
                      {subject.attendance_percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${getProgressBarColor(subject.attendance_percentage)}`}
                      style={{ width: `${subject.attendance_percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 pt-3 border-t border-gray-200 dark:border-slate-700">
                    <span className="font-medium">Conducted: {subject.total_classes_conducted}</span>
                    <span className="font-medium">Attended: {subject.classes_attended}</span>
                  </div>
                </div>
              </Link>
            )) : (
              !loading && (
                <div className="col-span-full text-center py-16 text-gray-400 dark:text-white/30">
                  <p className="text-lg">No subjects found for this semester.</p>
                </div>
              )
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default StudentDashboard;
