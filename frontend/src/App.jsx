import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RouteGuard from './components/RouteGuard';
import Login from './pages/auth/Login';
import TeacherDashboard from './pages/teacher/Dashboard';
import AttendanceGrid from './pages/teacher/AttendanceGrid';
import StudentDashboard from './pages/student/Dashboard';
import SubjectDetail from './pages/student/SubjectDetail';
import TimeTable from './pages/student/TimeTable';
import NoticeBoard from './pages/student/NoticeBoard';
import PrincipalDashboard from './pages/principal/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<div className="p-10 text-center text-red-500 bg-slate-900 min-h-screen">Unauthorized Access</div>} />

          {/* Admin Routes - Protected */}
          <Route element={<RouteGuard allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Principal Routes - Protected */}
          <Route element={<RouteGuard allowedRoles={['principal', 'admin']} />}>
            <Route path="/principal/dashboard" element={<PrincipalDashboard />} />
          </Route>

          {/* Teacher Routes - Protected */}
          <Route element={<RouteGuard allowedRoles={['teacher', 'admin', 'principal']} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/class/:class_id" element={<AttendanceGrid />} />
            <Route path="/teacher/:id" element={<TeacherDashboard />} />
          </Route>

          {/* Student Routes - Protected */}
          <Route element={<RouteGuard allowedRoles={['student', 'admin']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/subject/:subject_id" element={<SubjectDetail />} />
            <Route path="/student/timetable" element={<TimeTable />} />
            <Route path="/student/notices" element={<NoticeBoard />} />
            <Route path="/student/:id" element={<StudentDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
