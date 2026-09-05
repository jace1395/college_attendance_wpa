import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import RouteGuard from "./components/RouteGuard";
import OfflineBanner from "./components/shared/OfflineBanner";

// Auth
import Login from "./pages/auth/Login";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";

// Principal
import PrincipalDashboard from "./pages/principal/Dashboard";

// Teacher
import TeacherDashboard from "./pages/teacher/Dashboard";
import AttendanceGrid from "./pages/teacher/AttendanceGrid";
import HODDashboard from "./pages/teacher/HODDashboard";
import MentorDashboard from "./pages/teacher/MentorDashboard";

// Student
import StudentDashboard from "./pages/student/Dashboard";
import SubjectDetail from "./pages/student/SubjectDetail";
import TimeTable from "./pages/student/TimeTable";
import NoticeBoard from "./pages/student/NoticeBoard";
import LeaveRequest from "./pages/student/LeaveRequest";
import Messages from "./pages/student/Messages";

// Timetable Incharge
import TimetableDashboard from "./pages/timetable/Dashboard";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <OfflineBanner />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={
            <div className="p-10 text-center text-red-500 bg-slate-900 min-h-screen flex items-center justify-center">
              <div>
                <p className="text-6xl mb-4">403</p>
                <p className="text-xl font-bold text-red-400">Unauthorized Access</p>
                <a href="/login" className="mt-4 inline-block text-sm text-white/60 hover:text-white underline">Back to Login</a>
              </div>
            </div>
          } />

          {/* Admin Routes */}
          <Route element={<RouteGuard allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Principal Routes */}
          <Route element={<RouteGuard allowedRoles={["principal", "admin"]} />}>
            <Route path="/principal/dashboard" element={<PrincipalDashboard />} />
          </Route>

          {/* Teacher Routes */}
          <Route element={<RouteGuard allowedRoles={["teacher", "admin", "principal"]} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/class/:class_id" element={<AttendanceGrid />} />
            <Route path="/hod/dashboard" element={<HODDashboard />} />
            <Route path="/mentor/dashboard" element={<MentorDashboard />} />
            <Route path="/teacher/:id" element={<TeacherDashboard />} />
          </Route>

          {/* Student Routes */}
          <Route element={<RouteGuard allowedRoles={["student", "admin"]} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/subject/:subject_id" element={<SubjectDetail />} />
            <Route path="/student/timetable" element={<TimeTable />} />
            <Route path="/student/notices" element={<NoticeBoard />} />
            <Route path="/student/leave" element={<LeaveRequest />} />
            <Route path="/student/messages" element={<Messages />} />
            <Route path="/student/:id" element={<StudentDashboard />} />
          </Route>

          {/* Timetable Incharge Routes - Separate role, NOT admin */}
          <Route element={<RouteGuard allowedRoles={["timetable_incharge"]} />}>
            <Route path="/timetable/dashboard" element={<TimetableDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;