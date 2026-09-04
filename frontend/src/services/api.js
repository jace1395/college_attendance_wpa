/**
 * API Service — wired to the live Django REST Framework backend.
 * All functions use the centralized apiClient (Axios instance) which
 * automatically handles auth tokens and silent token refresh.
 */

import apiClient from './apiClient';

// ============================================================
// STUDENT
// ============================================================

/**
 * Fetches the full student dashboard payload.
 * Includes attendance summary, subject trend data, etc.
 */
export const getStudentDashboard = async () => {
  const { data } = await apiClient.get('/api/student/dashboard/');
  return data;
};

// Convenience wrappers — extract the relevant slice from the dashboard
// so existing component call-sites require minimal changes.

export const getMyAttendanceSummary = async () => {
  const data = await getStudentDashboard();
  return data.attendance_summary ?? data;
};

export const getMySubjectTrend = async (subjectId) => {
  const { data } = await apiClient.get('/api/student/dashboard/', {
    params: { subject_id: subjectId },
  });
  return data.subject_trend ?? data;
};

// ============================================================
// TEACHER
// ============================================================

/**
 * Fetches the full teacher dashboard payload.
 * Includes subjects overview, session grids, monitoring reports, etc.
 */
export const getTeacherDashboard = async () => {
  const { data } = await apiClient.get('/api/teacher/dashboard/');
  return data;
};

export const getMySubjectsOverview = async () => {
  const data = await getTeacherDashboard();
  return data.subjects_overview ?? data;
};

export const getSubjectAttendanceGrid = async (subjectId) => {
  const { data } = await apiClient.get('/api/teacher/dashboard/', {
    params: { subject_id: subjectId },
  });
  return data.attendance_grid ?? data;
};

export const getMonitoringReport = async (subjectId) => {
  const { data } = await apiClient.get('/api/teacher/dashboard/', {
    params: { subject_id: subjectId },
  });
  return data.monitoring_report ?? data;
};

// ============================================================
// ATTENDANCE
// ============================================================

/**
 * Marks attendance for a session.
 * @param {Object} payload — e.g. { subject_id, date, records: [{student_id, status}] }
 */
export const markAttendance = async (payload) => {
  const { data } = await apiClient.post('/api/attendance/mark/', payload);
  return data;
};

// Alias kept for backward-compat with any code calling submitLiveHeadcount
export const submitLiveHeadcount = async (subjectId, count) =>
  markAttendance({ subject_id: subjectId, headcount: count });

// ============================================================
// HOD
// ============================================================

export const getDepartmentOverview = async (departmentId) => {
  const { data } = await apiClient.get('/api/teacher/dashboard/', {
    params: { department_id: departmentId },
  });
  return data.department_overview ?? data;
};

export const getStreamComparison = async (departmentId) => {
  const { data } = await apiClient.get('/api/teacher/dashboard/', {
    params: { department_id: departmentId },
  });
  return data.stream_comparison ?? data;
};

export const getDefaulterMatrix = async (departmentId) => {
  const { data } = await apiClient.get('/api/teacher/dashboard/', {
    params: { department_id: departmentId },
  });
  return data.defaulter_matrix ?? data;
};

export const getFacultyCompletionTrend = async (departmentId) => {
  const { data } = await apiClient.get('/api/teacher/dashboard/', {
    params: { department_id: departmentId },
  });
  return data.faculty_completion_trend ?? data;
};

// ============================================================
// MENTOR
// ============================================================

export const getMenteeAttendanceRanking = async (mentorId) => {
  const { data } = await apiClient.get('/api/teacher/dashboard/', {
    params: { mentor_id: mentorId },
  });
  return data.mentee_ranking ?? data;
};

// ============================================================
// PRINCIPAL
// ============================================================

/**
 * Fetches the full principal dashboard payload.
 */
export const getPrincipalDashboard = async () => {
  const { data } = await apiClient.get('/api/principal/dashboard/');
  return data;
};

export const getInstituteOverview = async () => {
  const data = await getPrincipalDashboard();
  return data.institute_overview ?? data;
};

export const getDepartmentComparison = async () => {
  const data = await getPrincipalDashboard();
  return data.department_comparison ?? data;
};

export const getInstituteTrend = async () => {
  const data = await getPrincipalDashboard();
  return data.institute_trend ?? data;
};

export const getStreamDetail = async (year, stream) => {
  const { data } = await apiClient.get('/api/principal/dashboard/', {
    params: { year, stream },
  });
  return data.stream_detail ?? data;
};

// ============================================================
// ADMIN
// ============================================================

/**
 * Fetches the full admin dashboard payload.
 */
export const getAdminDashboard = async () => {
  const { data } = await apiClient.get('/api/admin/dashboard/');
  return data;
};

export const getAccountCountsByRole = async () => {
  const data = await getAdminDashboard();
  return data.account_counts ?? data;
};

export const getUsersByFilter = async (role, stream, year) => {
  const { data } = await apiClient.get('/api/admin/dashboard/', {
    params: { role, stream, year },
  });
  return data.users ?? data;
};

export const archiveStudentBatch = async (batchId) => {
  const { data } = await apiClient.post('/api/admin/dashboard/', {
    action: 'archive_batch',
    batch_id: batchId,
  });
  return data;
};
