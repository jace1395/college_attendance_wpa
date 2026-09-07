from django.urls import path
from .views import (
    # Student Views
    StudentDashboardView,
    StudentNotificationsView,
    StudentLeaveRequestView,
    
    # Teacher Views
    TeacherDashboardView,
    AttendanceGridView,
    AttendanceUnlockRequestView,
    MarkAttendanceView,  # The one we added for saving attendance!
    
    # HOD & Mentor Views
    HODInfoView,
    HODClassStatsView,
    MentorMenteesView,
    
    # Timetable Views
    TimetableDashboardView,
    TimetableAssignView,
    
    # Admin Views
    AdminDashboardView,
    AdminUsersListView,
    AdminDeactivateUserView,
    AdminUnlockRequestsView,
    AdminApproveUnlockView,
    AdminDenyUnlockView,
    AdminTeacherSubjectsView,
    AdminBackupExportView,
    
    # Principal Views
    PrincipalDashboardView,
    PrincipalStreamView,
    PrincipalClassDetailView,
    
    # File Uploads & Reports
    ReportAPIView,
    FileUploadAPIView
)

urlpatterns = [
    # --------------------------------------------------------------------------
    # 1. Student Routes
    # --------------------------------------------------------------------------
    path('api/student/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
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
    path('api/teacher/hod/class-stats/', HODClassStatsView.as_view(), name='hod-class-stats'),
    path('api/teacher/mentor/mentees/', MentorMenteesView.as_view(), name='mentor-mentees'),

    # --------------------------------------------------------------------------
    # 4. Timetable Incharge
    # --------------------------------------------------------------------------
    path('api/timetable/dashboard/', TimetableDashboardView.as_view(), name='timetable-dashboard'),
    path('api/timetable/assign/', TimetableAssignView.as_view(), name='timetable-assign'),

    # --------------------------------------------------------------------------
    # 5. Admin Console
    # --------------------------------------------------------------------------
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/admin/users/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('api/admin/users/<int:user_id>/deactivate/', AdminDeactivateUserView.as_view(), name='admin-user-deactivate'),
    path('api/admin/unlock-requests/', AdminUnlockRequestsView.as_view(), name='admin-unlock-requests'),
    path('api/admin/unlock-requests/<int:request_id>/approve/', AdminApproveUnlockView.as_view(), name='admin-approve-unlock'),
    path('api/admin/unlock-requests/<int:request_id>/deny/', AdminDenyUnlockView.as_view(), name='admin-deny-unlock'),
    path('api/admin/teacher-subjects/', AdminTeacherSubjectsView.as_view(), name='admin-teacher-subjects'),
    path('api/admin/backup/export/', AdminBackupExportView.as_view(), name='admin-backup-export'),
    path('api/upload/', FileUploadAPIView.as_view(), name='file-upload'),

    # --------------------------------------------------------------------------
    # 6. Principal Oversight
    # --------------------------------------------------------------------------
    path('api/principal/dashboard/', PrincipalDashboardView.as_view(), name='principal-dashboard'),
    path('api/principal/stream-view/', PrincipalStreamView.as_view(), name='principal-stream-view'),
    path('api/principal/class-detail/', PrincipalClassDetailView.as_view(), name='principal-class-detail'),
    
    # --------------------------------------------------------------------------
    # 7. General Reports
    # --------------------------------------------------------------------------
    path('api/reports/', ReportAPIView.as_view(), name='reports'),
]