from django.urls import path
from .views import (
    # Student Views
    StudentDashboardView,
    StudentSubjectDetailView,
    StudentNotificationsView,
    StudentLeaveRequestView,
    
    # Teacher Views
    TeacherDashboardView,
    AttendanceGridView,
    AttendanceUnlockRequestView,
    MarkAttendanceView,
    
    # HOD & Mentor Views
    HODInfoView,
    HODOverviewStatsAPIView,
    HODClassStatsView,
    HODStudentReportAPIView,
    MentorMenteesView,
    MenteeReportAPIView,
    
    # Timetable Views
    TimetableDashboardView,
    TimetableAssignView,
    TimetableActivityLogView,
    TimetableFiltersAPIView,
    MonitoringTeacherWorkloadView,
    MonitoringDutyListCreateView,
    TeacherMonitoringDutyView,
    MonitorClassesView,
    FreeTeachersView,
    MonitoringUnlockRequestView,
    TimetableFreezeView,
    
    # Admin Views
    AdminPrincipalManagementView,
    AdminDashboardView,
    AdminUsersListView,
    AdminDeactivateUserView,
    AdminResetPasswordView,
    AdminUnlockRequestsView,
    AdminApproveUnlockView,
    AdminDenyUnlockView,
    AdminTeacherSubjectsView,
    AdminBackupExportView,
    AuditLogPaginationView,
    
    # Principal Views
    PrincipalDashboardView,
    PrincipalFilterOptionsView,
    PrincipalAdvancedGraphView,
    PrincipalMonitoringDutiesView,
    PrincipalStreamView,
    PrincipalClassDetailView,
    
    # File Uploads & Reports
    ReportAPIView,
    FileUploadAPIView,
    AttendanceTicketCreateView,
    StudentReportAPIView,
    TeacherReportAPIView,
    
    # Admin Hierarchy Views
    AdminFilterOptionsView,
    AdminStudentHierarchyView,
    AdminTeacherHierarchyView,
    AdminHODHierarchyView,
    AdminMentorHierarchyView,
    
    # Report Views
    GlobalReportAPIView,

    # More Principal Views
    PrincipalReportsHubView,
    PrincipalSearchView,
    PrincipalTeacherEfficiencyView,
    PrincipalMentorOversightView,
    PrincipalDivisionAnalysisView,

    # More Admin Views
    AdminUserDetailView,
    AdminReportsGraphDataView,
    AdminForceUnlockView,
    AdminBulkUnlockView,
    AdminSetSemesterDatesView,
    AdminArchiveSemesterView,
)

urlpatterns = [
    # --------------------------------------------------------------------------
    # 1. Student Routes
    # --------------------------------------------------------------------------
    path('api/student/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('api/student/subject/<int:subject_id>/', StudentSubjectDetailView.as_view(), name='student-subject-detail'),
    path('api/student/notifications/', StudentNotificationsView.as_view(), name='student-notifications'),
    path('api/student/leave/', StudentLeaveRequestView.as_view(), name='student-leave'),

    # --------------------------------------------------------------------------
    # 2. Teacher Core Routes
    # --------------------------------------------------------------------------
    path('api/teacher/dashboard/', TeacherDashboardView.as_view(), name='teacher-dashboard'),
    path('api/teacher/classes/<int:class_id>/grid/', AttendanceGridView.as_view(), name='teacher-attendance-grid'),
    path('api/teacher/attendance/unlock-request/', AttendanceUnlockRequestView.as_view(), name='teacher-unlock-request'),
    path('api/attendance/mark/', MarkAttendanceView.as_view(), name='mark-attendance'),

    # --------------------------------------------------------------------------
    # 3. HOD & Mentor Extensions
    # --------------------------------------------------------------------------
    path('api/teacher/hod/info/', HODInfoView.as_view(), name='hod-info'),
    path('api/teacher/hod/overview-stats/', HODOverviewStatsAPIView.as_view(), name='hod-overview-stats'),
    path('api/teacher/hod/class-stats/', HODClassStatsView.as_view(), name='hod-class-stats'),
    path('api/teacher/hod/student/<int:student_id>/report/', HODStudentReportAPIView.as_view(), name='hod-student-report'),
    path('api/teacher/mentor/mentees/', MentorMenteesView.as_view(), name='mentor-mentees'),
    path('api/teacher/mentor/mentees/<int:mentee_id>/report/', MenteeReportAPIView.as_view(), name='mentor-mentee-report'),

    # --------------------------------------------------------------------------
    # 4. Timetable Incharge
    # --------------------------------------------------------------------------
    path('api/timetable/dashboard/', TimetableDashboardView.as_view(), name='timetable-dashboard'),
    path('api/timetable/assign/', TimetableAssignView.as_view(), name='timetable-assign'),
    path('api/timetable/activity-log/', TimetableActivityLogView.as_view(), name='timetable-activity-log'),
    path('api/timetable/filters/', TimetableFiltersAPIView.as_view(), name='timetable-filters'),
    path('api/timetable/monitor/teachers/', MonitoringTeacherWorkloadView.as_view(), name='timetable-monitor-teachers'),
    path('api/timetable/monitor/assign/', MonitoringDutyListCreateView.as_view(), name='timetable-monitor-assign'),
    path('api/timetable/monitor/classes/', MonitorClassesView.as_view(), name='timetable-monitor-classes'),
    path('api/timetable/free-teachers/', FreeTeachersView.as_view(), name='timetable-free-teachers'),
    path('api/teacher/monitoring/duties/', TeacherMonitoringDutyView.as_view(), name='teacher-monitoring-duties'),
    path('api/teacher/monitoring/unlock-request/', MonitoringUnlockRequestView.as_view(), name='monitoring-unlock-request'),
    path('api/timetable/freeze/', TimetableFreezeView.as_view(), name='timetable-freeze'),

    # --------------------------------------------------------------------------
    # 5. Admin Console
    # --------------------------------------------------------------------------
    path('api/admin/principal-management/', AdminPrincipalManagementView.as_view(), name='admin-principal-management'),
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/admin/users/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('api/admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('api/admin/hierarchy/filters/', AdminFilterOptionsView.as_view(), name='admin-hierarchy-filters'),
    path('api/admin/hierarchy/students/', AdminStudentHierarchyView.as_view(), name='admin-hierarchy-students'),
    path('api/admin/hierarchy/teachers/', AdminTeacherHierarchyView.as_view(), name='admin-hierarchy-teachers'),
    path('api/admin/hierarchy/hods/', AdminHODHierarchyView.as_view(), name='admin-hierarchy-hods'),
    path('api/admin/hierarchy/mentors/', AdminMentorHierarchyView.as_view(), name='admin-hierarchy-mentors'),
    path('api/admin/users/<int:user_id>/deactivate/', AdminDeactivateUserView.as_view(), name='admin-user-deactivate'),
    path('api/admin/users/<int:user_id>/reset-password/', AdminResetPasswordView.as_view(), name='admin-user-reset-password'),
    path('api/admin/unlock-requests/', AdminUnlockRequestsView.as_view(), name='admin-unlock-requests'),
    path('api/admin/unlock-requests/<int:request_id>/approve/', AdminApproveUnlockView.as_view(), name='admin-approve-unlock'),
    path('api/admin/unlock-requests/<int:request_id>/deny/', AdminDenyUnlockView.as_view(), name='admin-deny-unlock'),
    path('api/admin/teacher-subjects/', AdminTeacherSubjectsView.as_view(), name='admin-teacher-subjects'),
    path('api/admin/backup/export/', AdminBackupExportView.as_view(), name='admin-backup-export'),
    path('api/admin/audit-logs/', AuditLogPaginationView.as_view(), name='admin-audit-logs'),
    path('api/admin/force-unlock/', AdminForceUnlockView.as_view(), name='admin-force-unlock'),
    path('api/admin/bulk-unlock/', AdminBulkUnlockView.as_view(), name='admin-bulk-unlock'),
    path('api/admin/reports/graph-data/', AdminReportsGraphDataView.as_view(), name='admin-reports-graph-data'),
    path('api/admin/set-semester-dates/', AdminSetSemesterDatesView.as_view(), name='admin-set-semester-dates'),
    path('api/admin/archive-semester/', AdminArchiveSemesterView.as_view(), name='admin-archive-semester'),
    path('api/upload/', FileUploadAPIView.as_view(), name='file-upload'),

    # --------------------------------------------------------------------------
    # 6. Principal Oversight
    # --------------------------------------------------------------------------
    path('api/principal/dashboard/', PrincipalDashboardView.as_view(), name='principal-dashboard'),
    path('api/principal/filters/', PrincipalFilterOptionsView.as_view(), name='principal-filters'),
    path('api/reports/principal/aggregate/', PrincipalAdvancedGraphView.as_view(), name='principal-advanced-graph'),
    path('api/principal/monitoring-duties/', PrincipalMonitoringDutiesView.as_view(), name='principal-monitoring-duties'),
    path('api/principal/reports-hub/', PrincipalReportsHubView.as_view(), name='principal-reports-hub'),
    path('api/principal/stream-view/', PrincipalStreamView.as_view(), name='principal-stream-view'),
    path('api/principal/class-detail/', PrincipalClassDetailView.as_view(), name='principal-class-detail'),
    path('api/principal/search/', PrincipalSearchView.as_view(), name='principal-search'),
    path('api/principal/teacher-efficiency/', PrincipalTeacherEfficiencyView.as_view(), name='principal-teacher-efficiency'),
    path('api/principal/mentor-oversight/', PrincipalMentorOversightView.as_view(), name='principal-mentor-oversight'),
    path('api/reports/principal/division-analysis/', PrincipalDivisionAnalysisView.as_view(), name='principal-division-analysis'),
    
    # --------------------------------------------------------------------------
    # 7. General Reports
    # --------------------------------------------------------------------------
    path('api/reports/', ReportAPIView.as_view(), name='reports'),
    path('api/reports/global/', GlobalReportAPIView.as_view(), name='global-reports'),
    path('api/attendance/tickets/', AttendanceTicketCreateView.as_view(), name='attendance-tickets'),
    path('api/reports/student/me/', StudentReportAPIView.as_view(), name='student-report'),
    path('api/reports/teacher/classes/', TeacherReportAPIView.as_view(), name='teacher-report'),
]