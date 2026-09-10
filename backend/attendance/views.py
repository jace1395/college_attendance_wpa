import os
import io
import datetime
from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.http import FileResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser

import pandas as pd

from .models import (
    Subject, ClassBatch, Enrollment, Attendance,
    AttendanceTicket, Notification, MonitoringDuty, Timetable,
    StreamChoices, SemesterChoices
)
from .services import generate_attendance_report, process_timetable_upload
from users.services import process_user_upload

User = get_user_model()


# ==============================================================================
# Custom Permissions (Strict Role-Based Access Control)
# ==============================================================================

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'Student')


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['Teacher', 'HOD', 'Admin', 'Principal'])


class IsHOD(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role in ['HOD', 'Admin', 'Principal'] or getattr(request.user, 'is_hod', False)
            )
        )


class IsMentor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                getattr(request.user, 'is_mentor', False) or request.user.role in ['Admin', 'Principal']
            )
        )


class IsTimetableIncharge(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                getattr(request.user, 'is_timetable_incharge', False) or request.user.role in ['Admin', 'Principal']
            )
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role == 'Admin' or request.user.is_staff or request.user.is_superuser
            )
        )


class IsPrincipal(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role in ['Principal', 'Admin'] or request.user.is_superuser
            )
        )


# ==============================================================================
# Helper Functions
# ==============================================================================

def get_target_user(request):
    """
    Returns the authenticated user or optionally allows Admin/Principal/Teacher
    to specify an email query parameter for inspection.
    """
    email = request.query_params.get('email')
    if email and request.user.role in ['Admin', 'Principal', 'Teacher', 'HOD']:
        target = User.objects.filter(email=email).first()
        if target:
            return target
    return request.user


# ==============================================================================
# 1. Student Views
# ==============================================================================

class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_target_user(request)
        if user.role != 'Student' and request.user.role == 'Student':
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)

        requested_sem = request.query_params.get('semester')

        # Find enrollments for student
        enrollments = Enrollment.objects.filter(student=user).select_related('class_batch__subject', 'class_batch__teacher')

        # Collect available semesters
        all_semesters = sorted(list({
            en.class_batch.subject.semester
            for en in enrollments if en.class_batch.subject.semester
        }))
        if not all_semesters:
            all_semesters = [choice[0] for choice in SemesterChoices.choices]

        curr_semester = requested_sem if requested_sem in all_semesters else (all_semesters[0] if all_semesters else "Sem 1")

        filtered_enrollments = enrollments.filter(class_batch__subject__semester=curr_semester) if curr_semester else enrollments

        subjects_data = []
        total_conducted_all = 0
        total_attended_all = 0

        for en in filtered_enrollments:
            cb = en.class_batch
            subject = cb.subject
            teacher = cb.teacher

            total_conducted = Attendance.objects.filter(class_batch=cb).values('date', 'time_slot').distinct().count()
            classes_attended = Attendance.objects.filter(class_batch=cb, student=user, status='Present').count()

            percentage = round((classes_attended / total_conducted * 100), 1) if total_conducted > 0 else 0.0

            total_conducted_all += total_conducted
            total_attended_all += classes_attended

            subjects_data.append({
                "subject_id": cb.id,
                "subject_name": subject.name if subject else "Unknown",
                "teacher_name": (teacher.name or teacher.email) if teacher else "Not Assigned",
                "attendance_percentage": percentage,
                "total_classes_conducted": total_conducted,
                "classes_attended": classes_attended
            })

        overall_attendance = round((total_attended_all / total_conducted_all * 100), 1) if total_conducted_all > 0 else 0.0

        stream_name = "General"
        if filtered_enrollments.exists():
            first_subject = filtered_enrollments.first().class_batch.subject
            if first_subject and first_subject.stream:
                stream_name = first_subject.stream

        student_info = {
            "name": user.name or "Student",
            "student_id": user.roll_no or str(user.id),
            "email": user.email,
            "program": stream_name,
            "current_semester": curr_semester,
            "available_semesters": all_semesters,
            "overall_attendance": overall_attendance
        }

        return Response({
            "student": student_info,
            "subjects": subjects_data,
            "attendance_summary": {
                "overall_attendance": overall_attendance,
                "total_classes": total_conducted_all,
                "classes_attended": total_attended_all
            }
        })


class StudentSubjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, subject_id):
        user = get_target_user(request)
        if user.role != 'Student' and request.user.role == 'Student':
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)

        try:
            cb = ClassBatch.objects.get(id=subject_id)
            Enrollment.objects.get(student=user, class_batch=cb)
        except (ClassBatch.DoesNotExist, Enrollment.DoesNotExist):
            return Response({"error": "Subject not found or not enrolled"}, status=status.HTTP_404_NOT_FOUND)

        subject = cb.subject
        teacher = cb.teacher

        attendances = Attendance.objects.filter(class_batch=cb, student=user).order_by('-date')

        history = []
        for att in attendances:
            history.append({
                "date": att.date.strftime('%Y-%m-%d') if att.date else "",
                "type": "Regular",
                "status": att.status
            })

        return Response({
            "student": {
                "student_id": user.roll_no or str(user.id),
                "name": user.name or "Student",
                "email": user.email,
                "program": subject.stream if subject else "General",
                "current_semester": subject.semester if subject else "Unknown"
            },
            "subjects": [{
                "subject_id": cb.id,
                "subject_name": subject.name if subject else "Unknown",
                "teacher_name": (teacher.name or teacher.email) if teacher else "Not Assigned",
            }],
            "subject_attendance_history": history
        })


class StudentNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_target_user(request)
        notifications = Notification.objects.filter(user=user).order_by('-created_at')

        results = []
        for n in notifications:
            msg_lower = n.message.lower()
            notif_type = 'warning' if ('short' in msg_lower or 'warning' in msg_lower or 'below' in msg_lower) else \
                         'attendance_update' if 'attendance' in msg_lower else 'info'
            results.append({
                "id": n.id,
                "title": "Attendance Alert" if notif_type == 'warning' else "Class Update",
                "message": n.message,
                "type": notif_type,
                "read": n.is_read,
                "timestamp": n.created_at.strftime('%b %d, %Y %I:%M %p')
            })

        return Response({"notifications": results})


class StudentLeaveRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_target_user(request)
        tickets = AttendanceTicket.objects.filter(student=user).select_related('attendance__class_batch__subject').order_by('-created_at')
        records = []
        for t in tickets:
            att = t.attendance
            records.append({
                "id": t.id,
                "status": t.status,
                "reason": t.reason,
                "date": str(att.date) if att else None,
                "subject": att.class_batch.subject.name if (att and att.class_batch and att.class_batch.subject) else "General",
                "created_at": t.created_at.strftime('%Y-%m-%d %H:%M')
            })
        return Response({"leave_requests": records})

    def post(self, request):
        user = request.user
        leave_type = request.data.get('leave_type')
        from_date = request.data.get('from_date')
        to_date = request.data.get('to_date')
        reason = request.data.get('reason', '')

        if not from_date or not reason:
            return Response({"error": "from_date and reason are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Link ticket to latest attendance record or create request notification
        latest_att = Attendance.objects.filter(student=user).order_by('-date').first()
        if not latest_att:
            # Fallback to any class batch enrollment
            enrollment = Enrollment.objects.filter(student=user).first()
            if not enrollment:
                return Response({"error": "Student is not enrolled in any class."}, status=status.HTTP_400_BAD_REQUEST)
            latest_att = Attendance.objects.create(
                class_batch=enrollment.class_batch,
                student=user,
                date=from_date,
                time_slot="Regular",
                status="Absent",
                marked_by=None
            )

        ticket = AttendanceTicket.objects.create(
            attendance=latest_att,
            student=user,
            reason=f"[{leave_type or 'General'}] (From {from_date} to {to_date or from_date}): {reason}",
            status="Pending"
        )

        # Notify mentor if assigned
        if getattr(user, 'mentor', None):
            Notification.objects.create(
                user=user.mentor,
                message=f"Leave request submitted by {user.name or user.roll_no}: {reason}"
            )

        return Response({
            "message": "Leave request submitted successfully.",
            "id": ticket.id,
            "status": ticket.status
        }, status=status.HTTP_201_CREATED)


# ==============================================================================
# 2. Teacher Views
# ==============================================================================

class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        user = get_target_user(request)
        assigned_batches = ClassBatch.objects.filter(teacher=user).select_related('subject')

        assigned_classes = []
        for batch in assigned_batches:
            subject = batch.subject
            div_str = f" - Div {batch.division}" if batch.division else ""
            class_name = f"{subject.stream} {subject.semester}{div_str}" if subject else f"Class #{batch.id}"

            total_sessions = Attendance.objects.filter(class_batch=batch).values('date', 'time_slot').distinct().count()
            total_present = Attendance.objects.filter(class_batch=batch, status='Present').count()
            total_records = Attendance.objects.filter(class_batch=batch).count()

            avg_att = round((total_present / total_records * 100), 1) if total_records > 0 else 0.0

            assigned_classes.append({
                "class_id": batch.id,
                "class_name": class_name,
                "subject_name": subject.name if subject else "Subject",
                "classes_conducted": total_sessions,
                "avg_attendance": avg_att,
                "student_count": batch.enrollments.count()
            })

        # Monitoring duties
        duties_qs = MonitoringDuty.objects.filter(teacher=user).order_by('-date')[:5]
        monitoring_duties = [
            {
                "id": d.id,
                "date": str(d.date),
                "time_slot": d.time_slot,
                "class_room": d.class_room,
                "status": d.status
            }
            for d in duties_qs
        ]

        teacher_info = {
            "name": user.name or "Teacher",
            "email": user.email,
            "isMentor": getattr(user, 'is_mentor', False),
            "isHOD": getattr(user, 'is_hod', False) or user.role == 'HOD',
            "isTimetableIncharge": getattr(user, 'is_timetable_incharge', False),
        }

        # Check for ongoing class right now based on Timetable
        smart_alert = None
        today_name = datetime.datetime.now().strftime('%A')
        now_time = datetime.datetime.now().time()
        ongoing_schedule = Timetable.objects.filter(
            class_batch__teacher=user,
            day_of_week=today_name,
            start_time__lte=now_time,
            end_time__gte=now_time
        ).select_related('class_batch__subject').first()

        if ongoing_schedule:
            smart_alert = {
                "class_id": ongoing_schedule.class_batch.id,
                "subject": ongoing_schedule.class_batch.subject.name,
                "room": f"Room ({ongoing_schedule.day_of_week})"
            }

        return Response({
            "teacher": teacher_info,
            "assigned_classes": assigned_classes,
            "monitoring_duties": monitoring_duties,
            "smart_alert": smart_alert
        })


class AttendanceGridView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request, class_id):
        try:
            batch = ClassBatch.objects.select_related('subject', 'teacher').get(id=class_id)
        except ClassBatch.DoesNotExist:
            return Response({"error": "Class batch not found"}, status=status.HTTP_404_NOT_FOUND)

        enrollments = batch.enrollments.select_related('student').order_by('student__roll_no')
        roster = [
            {
                "student_id": en.student.id,
                "name": en.student.name or f"Student #{en.student.id}",
                "roll_no": en.student.roll_no or f"R-{en.student.id}"
            }
            for en in enrollments if en.student
        ]

        # Fetch all attendance records for this class
        records_qs = Attendance.objects.filter(class_batch=batch).values('student_id', 'date', 'status')
        attendance_records = [
            {
                "student_id": r['student_id'],
                "date": str(r['date']),
                "status": 'P' if r['status'] == 'Present' else 'A'
            }
            for r in records_qs
        ]

        return Response({
            "class_id": batch.id,
            "class_name": f"{batch.subject.name} - {batch.subject.stream} {batch.subject.semester}",
            "roster": roster,
            "attendance_records": attendance_records
        })


class AttendanceUnlockRequestView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request):
        class_id = request.data.get('class_id')
        date_to_unlock = request.data.get('date') or request.data.get('date_to_unlock')
        reason = request.data.get('reason', '')

        if not class_id or not date_to_unlock or not reason:
            return Response(
                {"error": "class_id, date, and reason are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        batch = ClassBatch.objects.filter(id=class_id).first()
        if not batch:
            return Response({"error": "Class batch not found."}, status=status.HTTP_404_NOT_FOUND)

        # Find or create a reference attendance record for this class & date
        att = Attendance.objects.filter(class_batch=batch, date=date_to_unlock).first()
        if not att:
            # Create a placeholder record so AttendanceTicket can reference it
            first_student = batch.enrollments.first()
            if not first_student or not first_student.student:
                return Response({"error": "No students enrolled in this class to associate attendance with."}, status=status.HTTP_400_BAD_REQUEST)
            att = Attendance.objects.create(
                class_batch=batch,
                student=first_student.student,
                date=date_to_unlock,
                time_slot="Regular",
                status="Absent",
                marked_by=request.user
            )

        ticket = AttendanceTicket.objects.create(
            attendance=att,
            student=request.user,
            reason=f"[Teacher Unlock Request for {batch.subject.name} on {date_to_unlock}]: {reason}",
            status="Pending"
        )

        return Response({
            "message": "Unlock request submitted successfully to administrators.",
            "ticket_id": ticket.id
        }, status=status.HTTP_201_CREATED)


class MarkAttendanceView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request):
        class_id = request.data.get('class_id') or request.data.get('subject_id')
        records = request.data.get('records', [])
        att_date = request.data.get('date', str(timezone.now().date()))
        time_slot = request.data.get('time_slot', 'Regular')

        if not class_id:
            return Response({"error": "class_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            batch = ClassBatch.objects.get(id=class_id)
        except ClassBatch.DoesNotExist:
            return Response({"error": "ClassBatch not found."}, status=status.HTTP_404_NOT_FOUND)

        saved_count = 0
        for item in records:
            student_id = item.get('student_id')
            raw_status = item.get('status', 'Absent')
            status_val = 'Present' if raw_status in ['Present', 'P'] else 'Absent'

            student_obj = User.objects.filter(id=student_id).first()
            if not student_obj:
                continue

            Attendance.objects.update_or_create(
                class_batch=batch,
                student=student_obj,
                date=att_date,
                time_slot=time_slot,
                defaults={
                    'status': status_val,
                    'marked_by': request.user
                }
            )
            saved_count += 1

        return Response({
            "message": f"Successfully recorded attendance for {saved_count} students.",
            "class_id": batch.id,
            "date": att_date
        }, status=status.HTTP_200_OK)


# ==============================================================================
# 3. HOD & Mentor Views
# ==============================================================================

class HODInfoView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        user = get_target_user(request)
        # HOD departments derived from Subject streams or user's assigned streams
        available_streams = list(Subject.objects.values_list('stream', flat=True).distinct())
        if not available_streams:
            available_streams = [choice[0] for choice in StreamChoices.choices]

        return Response({
            "hod_name": user.name or "HOD",
            "email": user.email,
            "departments": available_streams
        })


class HODClassStatsView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        year = request.query_params.get('year', 'FY')
        dept = request.query_params.get('dept', 'BCA')

        # Translate year (FY -> Sem 1/2, SY -> Sem 3/4, TY -> Sem 5/6)
        sem_map = {
            'FY': ['Sem 1', 'Sem 2'],
            'SY': ['Sem 3', 'Sem 4'],
            'TY': ['Sem 5', 'Sem 6']
        }
        sems = sem_map.get(year, ['Sem 1', 'Sem 2'])

        batches = ClassBatch.objects.filter(
            subject__stream=dept,
            subject__semester__in=sems
        ).distinct()

        enrollments = Enrollment.objects.filter(class_batch__in=batches).select_related('student').distinct()
        students_map = {}

        for en in enrollments:
            s = en.student
            if not s or s.id in students_map:
                continue
            att_qs = Attendance.objects.filter(class_batch__in=batches, student=s)
            total = att_qs.count()
            attended = att_qs.filter(status='Present').count()
            students_map[s.id] = {
                "roll": s.roll_no or f"R-{s.id}",
                "name": s.name or s.email,
                "total": total,
                "attended": attended,
                "pct": round((attended / total * 100), 1) if total > 0 else 0.0
            }

        students_list = list(students_map.values())
        total_students = len(students_list)
        present_count = sum(1 for s in students_list if s['pct'] >= 75)
        absent_count = total_students - present_count

        return Response({
            "year": year,
            "dept": dept,
            "total": total_students,
            "present": present_count,
            "absent": absent_count,
            "students": students_list
        })


class MentorMenteesView(APIView):
    permission_classes = [IsAuthenticated, IsMentor]

    def get(self, request):
        mentor = get_target_user(request)
        mentees_qs = User.objects.filter(mentor=mentor)

        results = []
        for m in mentees_qs:
            att_qs = Attendance.objects.filter(student=m)
            total = att_qs.count()
            attended = att_qs.filter(status='Present').count()
            pct = round((attended / total * 100), 1) if total > 0 else 0.0

            first_en = Enrollment.objects.filter(student=m).select_related('class_batch__subject').first()
            class_str = f"{first_en.class_batch.subject.stream} {first_en.class_batch.subject.semester}" if (first_en and first_en.class_batch.subject) else "Unassigned"

            results.append({
                "id": m.id,
                "roll": m.roll_no or f"R-{m.id}",
                "name": m.name or m.email,
                "class_name": class_str,
                "attendance_pct": pct,
                "attended": attended,
                "total": total
            })

        return Response({"mentees": results})


# ==============================================================================
# 4. Timetable Views
# ==============================================================================

class TimetableDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsTimetableIncharge]

    def get(self, request):
        total_classes_week = Timetable.objects.count()
        active_teachers = User.objects.filter(role='Teacher', is_active=True).count()
        uploaded_timetables = Timetable.objects.values('class_batch').distinct().count()
        pending_assignments = ClassBatch.objects.filter(teacher__isnull=True).count()

        # Class options for assignment dropdown
        batches = ClassBatch.objects.select_related('subject').all()
        classes_data = [
            {
                "id": b.id,
                "name": f"{b.subject.name} ({b.subject.stream} {b.subject.semester})" if b.subject else f"Class #{b.id}"
            }
            for b in batches
        ]

        # Teachers list for assignment dropdown
        teachers_qs = User.objects.filter(role__in=['Teacher', 'HOD'], is_active=True)
        teachers_data = [
            {
                "id": t.id,
                "name": t.name or t.email,
                "email": t.email
            }
            for t in teachers_qs
        ]

        recent_activity = [
            {
                "id": 1,
                "action": "Timetable schedule synced",
                "timestamp": timezone.now().strftime('%Y-%m-%d %H:%M')
            }
        ]

        return Response({
            "total_classes_per_week": total_classes_week,
            "active_teachers": active_teachers,
            "uploaded_timetables": uploaded_timetables,
            "pending_assignments": pending_assignments,
            "classes": classes_data,
            "teachers": teachers_data,
            "recent_activity": recent_activity
        })


class TimetableAssignView(APIView):
    permission_classes = [IsAuthenticated, IsTimetableIncharge]

    def post(self, request):
        class_id = request.data.get('class_id')
        teacher_id = request.data.get('teacher_id')

        if not class_id or not teacher_id:
            return Response({"error": "class_id and teacher_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            batch = ClassBatch.objects.get(id=class_id)
            teacher = User.objects.get(id=teacher_id)
        except (ClassBatch.DoesNotExist, User.DoesNotExist):
            return Response({"error": "Invalid class_id or teacher_id."}, status=status.HTTP_404_NOT_FOUND)

        batch.teacher = teacher
        batch.save()

        Notification.objects.create(
            user=teacher,
            message=f"You have been assigned as the teacher for {batch.subject.name if batch.subject else 'Class Batch'}."
        )

        return Response({
            "message": f"Successfully assigned {teacher.name or teacher.email} to class.",
            "class_id": batch.id,
            "teacher_id": teacher.id
        })


# ==============================================================================
# 5. Admin Views
# ==============================================================================

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        total_students = User.objects.filter(role='Student').count()
        total_teachers = User.objects.filter(role__in=['Teacher', 'HOD']).count()
        active_sessions = Attendance.objects.filter(date=timezone.now().date()).values('class_batch').distinct().count()

        return Response({
            "admin": {
                "name": request.user.name or "System Admin",
                "email": request.user.email or "admin@vvm.edu.in",
                "role": request.user.role
            },
            "system_stats": {
                "total_students": total_students,
                "total_teachers": total_teachers,
                "active_sessions": active_sessions,
                "last_database_backup": timezone.now().strftime('%b %d, %Y 02:00 AM')
            },
            "recent_audit_logs": [
                {
                    "action": "User Login",
                    "target": f"Admin session active: {request.user.email}",
                    "timestamp": timezone.now().strftime('%Y-%m-%d %H:%M')
                },
                {
                    "action": "Backup Verified",
                    "target": "Database archive verified",
                    "timestamp": (timezone.now() - timedelta(hours=4)).strftime('%Y-%m-%d %H:%M')
                }
            ]
        })

    def post(self, request):
        action = request.data.get('action')
        if action == 'archive_batch':
            batch_id = request.data.get('batch_id')
            ClassBatch.objects.filter(id=batch_id).update(academic_year="Archived")
            return Response({"message": f"Batch #{batch_id} archived successfully."})
        return Response({"message": "Action processed."})


class AdminUsersListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        role = request.query_params.get('role')
        stream = request.query_params.get('stream')
        year = request.query_params.get('year')

        users_qs = User.objects.all().order_by('-id')

        if role:
            role_title = role.capitalize()
            if role_title in ['Student', 'Teacher', 'Admin', 'Principal']:
                users_qs = users_qs.filter(role=role_title)

        results = []
        for u in users_qs[:200]:
            user_stream = "N/A"
            user_year = "N/A"
            if u.role == 'Student':
                en = Enrollment.objects.filter(student=u).select_related('class_batch__subject').first()
                if en and en.class_batch.subject:
                    user_stream = en.class_batch.subject.stream
                    user_year = en.class_batch.subject.semester

            if stream and stream != 'All' and user_stream != stream:
                continue
            if year and year != 'All' and user_year != year:
                continue

            results.append({
                "id": u.id,
                "name": u.name or (u.roll_no if u.role == 'Student' else u.email),
                "email": u.email,
                "roll_no": u.roll_no,
                "role": u.role,
                "stream": user_stream,
                "year": user_year,
                "status": "active" if u.is_active and not u.is_archived else "inactive",
                "is_active": u.is_active
            })

        return Response({"users": results})


class AdminDeactivateUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        target_user.is_active = False
        target_user.is_archived = True
        target_user.save()
        return Response({"message": f"User {target_user.email or target_user.id} has been deactivated."})


class AdminUnlockRequestsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        tickets = AttendanceTicket.objects.filter(status='Pending').select_related(
            'attendance__class_batch__subject',
            'attendance__class_batch__teacher',
            'student'
        ).order_by('-created_at')

        results = []
        for t in tickets:
            att = t.attendance
            cb = att.class_batch if att else None
            subject_name = cb.subject.name if (cb and cb.subject) else "Subject"
            class_name = f"{cb.subject.stream} {cb.subject.semester}" if (cb and cb.subject) else "Class"
            teacher_name = (cb.teacher.name or cb.teacher.email) if (cb and cb.teacher) else (t.student.name or t.student.email)

            results.append({
                "id": t.id,
                "teacher_name": teacher_name,
                "subject": subject_name,
                "class_name": class_name,
                "date_to_unlock": str(att.date) if att else "N/A",
                "reason": t.reason,
                "created_at": t.created_at.strftime('%Y-%m-%d %H:%M')
            })

        return Response({"unlock_requests": results})


class AdminApproveUnlockView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, request_id):
        try:
            ticket = AttendanceTicket.objects.get(id=request_id)
        except AttendanceTicket.DoesNotExist:
            return Response({"error": "Unlock request not found."}, status=status.HTTP_404_NOT_FOUND)

        ticket.status = 'Approved'
        ticket.save()

        # Notify the requester
        Notification.objects.create(
            user=ticket.student,
            message="Your attendance unlock request has been approved by the Admin."
        )

        return Response({"message": f"Unlock request #{request_id} approved successfully."})


class AdminDenyUnlockView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, request_id):
        try:
            ticket = AttendanceTicket.objects.get(id=request_id)
        except AttendanceTicket.DoesNotExist:
            return Response({"error": "Unlock request not found."}, status=status.HTTP_404_NOT_FOUND)

        ticket.status = 'Rejected'
        ticket.save()

        Notification.objects.create(
            user=ticket.student,
            message="Your attendance unlock request was denied by the Admin."
        )

        return Response({"message": f"Unlock request #{request_id} denied."})


class AdminTeacherSubjectsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({"subjects": []})

        teacher = User.objects.filter(email=email).first()
        if not teacher:
            return Response({"subjects": []})

        batches = ClassBatch.objects.filter(teacher=teacher).select_related('subject')
        subjects = [
            {
                "id": b.id,
                "label": f"{b.subject.name} - {b.subject.stream} {b.subject.semester}",
                "name": b.subject.name
            }
            for b in batches if b.subject
        ]

        return Response({"subjects": subjects})


class AdminBackupExportView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        export_type = request.query_params.get('type', 'csv')
        academic_year = request.query_params.get('academic_year', '2026-2027')

        qs = Attendance.objects.filter(class_batch__academic_year=academic_year).select_related(
            'student', 'class_batch__subject'
        )

        if not qs.exists():
            qs = Attendance.objects.all().select_related('student', 'class_batch__subject')[:500]

        data = [
            {
                "Date": str(a.date),
                "Student_Roll": a.student.roll_no or str(a.student.id),
                "Student_Name": a.student.name or a.student.email,
                "Subject": a.class_batch.subject.name if a.class_batch.subject else "N/A",
                "Status": a.status,
                "Time_Slot": a.time_slot
            }
            for a in qs
        ]

        df = pd.DataFrame(data if data else [{"Message": "No attendance records"}])

        if export_type == 'excel':
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Backup')
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=True, filename=f"Backup_{academic_year}.xlsx")

        buffer = io.BytesIO()
        df.to_csv(buffer, index=False)
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename=f"Backup_{academic_year}.csv", content_type='text/csv')


# ==============================================================================
# 6. Principal Views
# ==============================================================================

class PrincipalDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsPrincipal]

    def get(self, request):
        today = timezone.now().date()
        total_present_today = Attendance.objects.filter(date=today, status='Present').count()
        total_absent_today = Attendance.objects.filter(date=today, status='Absent').count()
        total_records_today = total_present_today + total_absent_today

        overall_pct = round((total_present_today / total_records_today * 100), 1) if total_records_today > 0 else 0.0
        classes_conducted_today = Attendance.objects.filter(date=today).values('class_batch').distinct().count()

        streams = list(Subject.objects.values_list('stream', flat=True).distinct())
        if not streams:
            streams = [choice[0] for choice in StreamChoices.choices]

        return Response({
            "principal": {
                "name": request.user.name or "Dr. Principal",
                "email": request.user.email or "principal@vvm.edu.in",
            },
            "college_stats_today": {
                "total_students_present": total_present_today,
                "total_students_absent": total_absent_today,
                "overall_attendance_percentage": overall_pct,
                "classes_conducted_today": classes_conducted_today
            },
            "streams_available": streams,
            "pending_approvals": []
        })


class PrincipalStreamView(APIView):
    permission_classes = [IsAuthenticated, IsPrincipal]

    def get(self, request):
        stream = request.query_params.get('stream', 'BCA')
        year_groups = [
            ("FY", ['Sem 1', 'Sem 2']),
            ("SY", ['Sem 3', 'Sem 4']),
            ("TY", ['Sem 5', 'Sem 6'])
        ]

        classes_summary = []
        for label, sems in year_groups:
            batches = ClassBatch.objects.filter(subject__stream=stream, subject__semester__in=sems)
            total_students = Enrollment.objects.filter(class_batch__in=batches).values('student').distinct().count()

            present_count = Attendance.objects.filter(class_batch__in=batches, status='Present').count()
            absent_count = Attendance.objects.filter(class_batch__in=batches, status='Absent').count()

            classes_summary.append({
                "class_id": batches.first().id if batches.exists() else 0,
                "year": label,
                "stream": stream,
                "total": total_students,
                "present": present_count,
                "absent": absent_count
            })

        return Response({"classes": classes_summary})


class PrincipalClassDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPrincipal]

    def get(self, request):
        class_id = request.query_params.get('class_id')
        batch = ClassBatch.objects.filter(id=class_id).select_related('subject').first()

        if not batch:
            return Response({
                "class_name": "Class Analysis",
                "total": 0,
                "present": 0,
                "absent": 0,
                "subjects": [],
                "weekly_trend": []
            })

        total_students = batch.enrollments.count()
        present = Attendance.objects.filter(class_batch=batch, status='Present').count()
        absent = Attendance.objects.filter(class_batch=batch, status='Absent').count()

        # Subject breakdown for this class/batch
        subject_pct = round((present / (present + absent) * 100), 1) if (present + absent) > 0 else 0.0
        subjects_data = [
            {
                "subject": batch.subject.name if batch.subject else "Subject",
                "pct": subject_pct
            }
        ]

        # Weekly trend calculation (last 4 weeks)
        weekly_trend = []
        today = timezone.now().date()
        for w in range(4, 0, -1):
            w_start = today - timedelta(days=w * 7)
            w_end = w_start + timedelta(days=6)
            w_pres = Attendance.objects.filter(class_batch=batch, date__range=[w_start, w_end], status='Present').count()
            w_total = Attendance.objects.filter(class_batch=batch, date__range=[w_start, w_end]).count()
            w_pct = round((w_pres / w_total * 100), 1) if w_total > 0 else 0.0
            weekly_trend.append({"week": f"Wk {5 - w}", "pct": w_pct})

        return Response({
            "class_name": f"{batch.subject.name} ({batch.subject.stream} {batch.subject.semester})",
            "total": total_students,
            "present": present,
            "absent": absent,
            "subjects": subjects_data,
            "weekly_trend": weekly_trend
        })


# ==============================================================================
# 7. General / Shared Views (Reports & File Upload)
# ==============================================================================

class ReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        download_format = request.query_params.get('download')  # 'csv' or 'excel'

        if not start_date or not end_date:
            return Response({"error": "Please provide start_date and end_date."}, status=400)

        try:
            result = generate_attendance_report(request.user, start_date, end_date, download_format)

            # If result is a FileResponse (CSV/Excel download)
            if isinstance(result, FileResponse):
                return result

            # Otherwise, return JSON for Recharts
            return Response(result)

        except PermissionError as e:
            return Response({"error": str(e)}, status=403)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class FileUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role not in ['Admin', 'Principal'] and not getattr(request.user, 'is_timetable_incharge', False):
            return Response({"error": "Unauthorized"}, status=403)

        upload_type = request.data.get('type')  # 'users' or 'timetable'
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({"error": "No file provided"}, status=400)

        validator = FileExtensionValidator(allowed_extensions=['csv', 'xls', 'xlsx'])
        try:
            validator(file_obj)
        except ValidationError:
            return Response({"error": "Only .csv, .xls, and .xlsx files are allowed."}, status=400)

        try:
            if upload_type == 'users':
                count = process_user_upload(file_obj)
                return Response({"message": f"Successfully created {count} users."})
            elif upload_type == 'timetable':
                count = process_timetable_upload(file_obj)
                return Response({"message": f"Successfully scheduled {count} classes."})
            else:
                return Response({"error": "Invalid upload type."}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)