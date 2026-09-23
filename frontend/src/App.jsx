import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import RouteGuard from "./components/RouteGuard";
import OfflineBanner from "./components/shared/OfflineBanner";
import ErrorBoundary from "./components/shared/ErrorBoundary";

// Auth
import Login from "./pages/auth/Login";

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));

// Principal
const PrincipalDashboard = lazy(() => import("./pages/principal/Dashboard"));

// Teacher
const TeacherDashboard = lazy(() => import("./pages/teacher/Dashboard"));
const AttendanceGrid = lazy(() => import("./pages/teacher/AttendanceGrid"));
const HODDashboard = lazy(() => import("./pages/teacher/HODDashboard"));
const MentorDashboard = lazy(() => import("./pages/teacher/MentorDashboard"));

// Student
const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const SubjectDetail = lazy(() => import("./pages/student/SubjectDetail"));
const TimeTable = lazy(() => import("./pages/student/TimeTable"));

const Messages = lazy(() => import("./pages/student/Messages"));
const Notifications = lazy(() => import("./pages/student/Notifications"));

// Shared (all roles)
const Settings = lazy(() => import("./pages/shared/Settings"));

// Timetable Incharge
const TimetableDashboard = lazy(() => import("./pages/timetable/Dashboard"));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <OfflineBanner />
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading...</div>}>
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

                <Route path="/student/messages" element={<Messages />} />
                <Route path="/student/notifications" element={<Notifications />} />
                <Route path="/student/:id" element={<StudentDashboard />} />
                {/* Keep old /student/settings path for backwards compat */}
                <Route path="/student/settings" element={<Settings />} />
              </Route>

              {/* Universal Settings — accessible by all authenticated roles */}
              <Route element={<RouteGuard allowedRoles={["admin", "principal", "teacher", "student"]} />}>
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Timetable Incharge Routes */}
              <Route element={<RouteGuard allowedRoles={["timetable_incharge"]} />}>
                <Route path="/timetable/dashboard" element={<TimetableDashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Router>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;