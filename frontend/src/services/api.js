/**
 * Mock API Service for AMS
 * These functions simulate asynchronous API calls to the Django backend.
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// STUDENT
// ==========================================
export const getMyAttendanceSummary = async () => {
  await delay(500);
  return { percentage: 78.5 };
};

export const getMySubjectTrend = async (subjectId) => {
  await delay(500);
  return [
    { label: 'Week 1', value: 80 },
    { label: 'Week 2', value: 75 },
    { label: 'Week 3', value: 78 },
  ];
};

// ==========================================
// TEACHER
// ==========================================
export const getMySubjectsOverview = async () => {
  await delay(500);
  return [
    { label: 'DSA', value: 82 },
    { label: 'DBMS', value: 74 }
  ];
};

export const getSubjectAttendanceGrid = async (subjectId) => {
  await delay(500);
  return [
    { session: 'Lecture 1', present: 45, absent: 5, od: 2, late: 3 },
    { session: 'Lecture 2', present: 42, absent: 8, od: 1, late: 4 }
  ];
};

export const submitLiveHeadcount = async (subjectId, count) => {
  await delay(500);
  return { success: true };
};

export const getMonitoringReport = async (subjectId) => {
  await delay(500);
  return [
    { label: 'Mon', value: 50 },
    { label: 'Tue', value: 48 },
    { label: 'Wed', value: 45 }
  ];
};

// ==========================================
// HOD
// ==========================================
export const getDepartmentOverview = async (departmentId) => {
  await delay(500);
  return { percentage: 81.2 };
};

export const getStreamComparison = async (departmentId) => {
  await delay(500);
  return [
    { label: 'FY BCA', value: 85 },
    { label: 'SY BCA', value: 78 },
    { label: 'TY BCA', value: 82 }
  ];
};

export const getDefaulterMatrix = async (departmentId) => {
  await delay(500);
  return {
    streams: ['BCA', 'BCOM', 'BVOC'],
    years: ['FY', 'SY', 'TY'],
    data: [
      [12, 5, 8],
      [15, 6, 9],
      [10, 4, 7]
    ]
  };
};

export const getFacultyCompletionTrend = async (departmentId) => {
  await delay(500);
  return [
    { label: 'Week 1', value: 90 },
    { label: 'Week 2', value: 88 },
    { label: 'Week 3', value: 92 }
  ];
};

// ==========================================
// MENTOR
// ==========================================
export const getMenteeAttendanceRanking = async (mentorId) => {
  await delay(500);
  return [
    { name: 'Alice', value: 65 },
    { name: 'Bob', value: 72 },
    { name: 'Charlie', value: 88 }
  ];
};

// ==========================================
// PRINCIPAL
// ==========================================
export const getInstituteOverview = async () => {
  await delay(500);
  return { percentage: 79.4 };
};

export const getDepartmentComparison = async () => {
  await delay(500);
  return [
    { label: 'Computer Science', value: 84 },
    { label: 'Commerce', value: 76 },
    { label: 'Arts', value: 81 }
  ];
};

export const getInstituteTrend = async () => {
  await delay(500);
  return [
    { label: 'Aug', value: 82 },
    { label: 'Sep', value: 80 },
    { label: 'Oct', value: 78 },
    { label: 'Nov', value: 81 }
  ];
};

export const getStreamDetail = async (year, stream) => {
  await delay(500);
  return [
    { label: 'Div A', value: 85 },
    { label: 'Div B', value: 80 }
  ];
};

// ==========================================
// ADMIN
// ==========================================
export const getAccountCountsByRole = async () => {
  await delay(500);
  return [
    { label: 'Students', value: 1200 },
    { label: 'Teachers', value: 85 },
    { label: 'HODs', value: 5 },
    { label: 'Mentors', value: 20 },
    { label: 'Admins', value: 3 }
  ];
};

export const getUsersByFilter = async (role, stream, year) => {
  await delay(500);
  return [
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' }
  ];
};

export const archiveStudentBatch = async (batchId) => {
  await delay(500);
  return { success: true };
};
