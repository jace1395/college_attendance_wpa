import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getDepartmentFromId } from '../../utils/studentUtils';
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
        const semParam = selectedSemester ? `&semester=${selectedSemester}` : '';
        const response = await fetch(`/api/student/dashboard/?email=${user.email}${semParam}`);
        if (!response.ok) throw new Error('API not available');
        const data = await response.json();
        setDashboardData(data);
        if (!selectedSemester && data.student?.current_semester) {
            setSelectedSemester(data.student.current_semester.toString());
        }
      } catch (err) {
        // Fallback to empty state mock
        setTimeout(() => {
          setDashboardData({
            student: {
              student_id: user?.email?.split('@')[0] || "2201049",
              name: user?.name || "Student",
              email: user?.email || "student@vvm.edu.in",
              overall_attendance: 0,
              available_semesters: ["Semester 1", "Semester 3"],
              current_semester: "Semester 3"
            },
            subjects: []
          });
          setLoading(false);
        }, 600);
      }
    };

    fetchDashboard();
  }, [user, selectedSemester]);

  const handleSemesterChange = (e) => {
      setSelectedSemester(e.target.value);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'text-green-500 bg-green-500';
    if (percentage >= 60) return 'text-yellow-500 bg-yellow-500';
    return 'text-red-500 bg-red-500';
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
    <div 
      className="min-h-screen bg-cover bg-fixed text-white"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md pointer-events-none"></div>

      <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto min-h-screen flex flex-col">
        
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
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl flex flex-col items-center gap-8">
          <div className="flex flex-col md:flex-row w-full items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold mb-1">{student.name}</h2>
              <p className="text-white/70 text-lg mb-2">{student.program || departmentName} | Roll No: <span className="text-white font-medium">{student.student_id}</span></p>
              <div className="flex items-center justify-center md:justify-start gap-2 text-white/70">
                  <span>Semester</span>
                  <select 
                      value={selectedSemester}
                      onChange={handleSemesterChange}
                      className="bg-slate-800 text-white text-sm rounded-lg px-2 py-1 outline-none border border-white/20 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                      {student.available_semesters.map(sem => (
                          <option key={sem} value={sem}>{sem}</option>
                      ))}
                  </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/10">
              <div className="text-right">
                <p className="text-sm text-white/70 mb-1">Overall Attendance</p>
                <p className="text-2xl font-bold">{student.overall_attendance}%</p>
              </div>
              {/* Circular Progress */}
              <div className="relative w-20 h-20 md:w-24 md:h-24">
                <svg className="w-20 h-20 md:w-24 md:h-24 transform -rotate-90">
                  <circle
                    className="text-white/10"
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

          <div className="flex flex-wrap justify-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 shadow-sm w-full md:w-auto">
            <Link to="/student/dashboard" className="px-5 py-2.5 bg-blue-600 text-white shadow-lg rounded-xl text-sm font-bold capitalize transition-all">Dashboard</Link>
            <Link to="/student/timetable" className="px-5 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-sm font-bold capitalize transition-all">Timetable</Link>
            <Link to="/student/notices" className="px-5 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-sm font-bold capitalize transition-all">Notices</Link>
            <Link to="/student/leave" className="px-5 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-sm font-bold capitalize transition-all">Leave</Link>
          </div>
        </div>
        )}

        {/* Subjects Grid */}
        <h3 className="text-2xl font-semibold mb-6">Your Classes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {subjects && subjects.map((subject) => (
            <Link 
              to={`/student/subject/${subject.subject_id}`} 
              key={subject.subject_id}
              className="group bg-indigo-600/80 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:bg-indigo-500/80 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 block"
            >
              <div className="p-6">
                <h4 className="text-xl font-bold truncate mb-1 text-white">{subject.subject_name}</h4>
                <p className="text-sm text-indigo-200 mb-6">{subject.teacher_name}</p>
                
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm text-indigo-100 font-medium">Attendance</span>
                  <span className={`text-lg font-bold ${getProgressColor(subject.attendance_percentage).split(' ')[0]} bg-transparent`}>
                    {subject.attendance_percentage}%
                  </span>
                </div>
                
                {/* Linear Progress Bar */}
                <div className="w-full bg-black/20 rounded-full h-3 mb-4 overflow-hidden border border-white/10">
                  <div 
                    className={`h-3 rounded-full ${getProgressColor(subject.attendance_percentage).split(' ')[1]}`} 
                    style={{ width: `${subject.attendance_percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-indigo-200 pt-3 border-t border-indigo-400/30">
                  <span className="font-medium">Conducted: {subject.total_classes_conducted}</span>
                  <span className="font-medium">Attended: {subject.classes_attended}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
