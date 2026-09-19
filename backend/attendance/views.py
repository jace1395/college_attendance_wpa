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
from rest_framework.pagination import PageNumberPagination

# import pandas as pd

from .models import (
    Subject, ClassBatch, Enrollment, Attendance,
    AttendanceTicket, Notification, MonitoringDuty, Timetable,
    StreamChoices, SemesterChoices, TimetableActivityLog, SystemSettings
)
from .services import generate_attendance_report, process_timetable_upload
from users.services import process_user_upload
from users.models import Department, Stream

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

        from django.db.models import Count
        batch_ids = [en.class_batch_id for en in filtered_enrollments]
        
        sessions = Attendance.objects.filter(class_batch__in=batch_ids).values('class_batch', 'date', 'time_slot').distinct()
        conducted_map = {}
        for s in sessions:
            cb_id = s['class_batch']
            conducted_map[cb_id] = conducted_map.get(cb_id, 0) + 1
            
        attended_counts = Attendance.objects.filter(class_batch__in=batch_ids, student=user, status='Present').values('class_batch').annotate(count=Count('id'))
        attended_map = {row['class_batch']: row['count'] for row in attended_counts}

        for en in filtered_enrollments:
            cb = en.class_batch
            subject = cb.subject
            teacher = cb.teacher

            total_conducted = conducted_map.get(cb.id, 0)
            classes_attended = attended_map.get(cb.id, 0)

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

        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginated_attendances = paginator.paginate_queryset(attendances, request)

        history = []
        for att in paginated_attendances:
            history.append({
                "date": att.date.strftime('%Y-%m-%d') if att.date else "",
                "type": "Regular",
                "status": att.status
            })

        response_data = {
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
        }

        return paginator.get_paginated_response(response_data)


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
                "action_url": n.action_url,
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

        from django.db.models import Count, Q
        batch_ids = [b.id for b in assigned_batches]
        
        sessions = Attendance.objects.filter(class_batch__in=batch_ids).values('class_batch', 'date', 'time_slot').distinct()
        conducted_map = {}
        for s in sessions:
            cb_id = s['class_batch']
            conducted_map[cb_id] = conducted_map.get(cb_id, 0) + 1
            
        att_counts = Attendance.objects.filter(class_batch__in=batch_ids).values('class_batch').annotate(
            total_records=Count('id'),
            total_present=Count('id', filter=Q(status='Present'))
        )
        att_map = {row['class_batch']: row for row in att_counts}
        
        enroll_counts = Enrollment.objects.filter(class_batch__in=batch_ids).values('class_batch').annotate(count=Count('id'))
        enroll_map = {row['class_batch']: row['count'] for row in enroll_counts}

        assigned_classes = []
        for batch in assigned_batches:
            subject = batch.subject
            div_str = f" - Div {batch.division}" if batch.division else ""
            class_name = f"{subject.stream} {subject.semester}{div_str}" if subject else f"Class #{batch.id}"

            total_sessions = conducted_map.get(batch.id, 0)
            
            amap = att_map.get(batch.id, {'total_records': 0, 'total_present': 0})
            total_records = amap['total_records']
            total_present = amap['total_present']

            avg_att = round((total_present / total_records * 100), 1) if total_records > 0 else 0.0

            assigned_classes.append({
                "class_id": batch.id,
                "class_name": class_name,
                "subject_name": subject.name if subject else "Subject",
                "stream_name": subject.stream if subject else "",
                "dept_name": user.department.name if getattr(user, 'department', None) else "Computer Science",
                "classes_conducted": total_sessions,
                "avg_attendance": avg_att,
                "student_count": enroll_map.get(batch.id, 0)
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
        student_ids = [item.get('student_id') for item in records if item.get('student_id')]
        students_dict = User.objects.in_bulk(student_ids)

        existing_records = Attendance.objects.filter(
            class_batch=batch, date=att_date, time_slot=time_slot
        ).in_bulk(field_name='student_id')

        records_to_create = []
        records_to_update = []
        
        for item in records:
            student_id = item.get('student_id')
            raw_status = item.get('status', 'Absent')
            status_val = 'Present' if raw_status in ['Present', 'P'] else 'Absent'

            student_obj = students_dict.get(student_id)
            if not student_obj:
                continue

            existing = existing_records.get(student_id)
            if existing:
                if existing.status != status_val or getattr(existing, 'marked_by_id', None) != request.user.id:
                    existing.status = status_val
                    existing.marked_by = request.user
                    records_to_update.append(existing)
                saved_count += 1
            else:
                records_to_create.append(Attendance(
                    class_batch=batch,
                    student=student_obj,
                    date=att_date,
                    time_slot=time_slot,
                    status=status_val,
                    marked_by=request.user
                ))
                saved_count += 1
                
        if records_to_create:
            Attendance.objects.bulk_create(records_to_create)
        if records_to_update:
            Attendance.objects.bulk_update(records_to_update, ['status', 'marked_by'])

        # Notification Triggers
        notifications_to_create = []
        action_url = f"/student/subject/{batch.id}"
        
        for record in records_to_create:
            notifications_to_create.append(Notification(
                user=record.student,
                message=f"You have been marked {record.status} for {batch.subject.name} on {att_date}.",
                action_url=action_url
            ))
            
        for record in records_to_update:
            notifications_to_create.append(Notification(
                user=record.student,
                message=f"Your attendance for {batch.subject.name} on {att_date} was updated to {record.status}.",
                action_url=action_url
            ))
            
        if notifications_to_create:
            Notification.objects.bulk_create(notifications_to_create)

        from users.services import log_audit
        log_audit(request.user, "Marked Attendance", f"Marked attendance for {batch.subject.name} on {att_date}")

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



class HODOverviewStatsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        from django.utils import timezone
        import datetime
        from django.db.models import Count, Q

        user = get_target_user(request)
        period = request.query_params.get('period', 'overall')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        today = timezone.now().date()
        date_filter = Q()
        if period == 'today':
            date_filter = Q(date=today)
        elif period == 'week':
            start_of_week = today - datetime.timedelta(days=today.weekday())
            date_filter = Q(date__gte=start_of_week)
        elif period == 'month':
            date_filter = Q(date__month=today.month, date__year=today.year)
        elif period == 'custom' and start_date and end_date:
            date_filter = Q(date__gte=start_date, date__lte=end_date)

        # HOD departments derived from Subject streams or user's assigned streams
        available_streams = list(Subject.objects.values_list('stream', flat=True).distinct())
        if not available_streams:
            available_streams = [choice[0] for choice in StreamChoices.choices]

        # Get all relevant class batches
        batches = ClassBatch.objects.filter(subject__stream__in=available_streams).select_related('subject')

        # Get enrollments
        enrollments = Enrollment.objects.filter(class_batch__in=batches).select_related('student', 'class_batch__subject')
        
        # We need attendance records for these students in these batches
        att_qs = Attendance.objects.filter(class_batch__in=batches).filter(date_filter)

        # Dictionary to hold stats for each class string (e.g. 'FY BCA')
        
        sem_to_year = {
            'Sem 1': 'FY', 'Sem 2': 'FY',
            'Sem 3': 'SY', 'Sem 4': 'SY',
            'Sem 5': 'TY', 'Sem 6': 'TY'
        }

        # Initialize results map
        results = {}

        # 1. Map enrollments to classes and initialize student counts
        for en in enrollments:
            s = en.student
            if not s: continue
            
            stream = en.class_batch.subject.stream
            sem = en.class_batch.subject.semester
            year_prefix = sem_to_year.get(sem, 'FY')
            class_key = f"{year_prefix} {stream}"
            
            if class_key not in results:
                results[class_key] = { "students_map": {}, "total": 0, "present": 0, "absent": 0 }
                
            if s.id not in results[class_key]["students_map"]:
                results[class_key]["students_map"][s.id] = { "total": 0, "attended": 0 }

        # 2. Count attendances
        att_counts = att_qs.values(
            'class_batch__subject__stream', 
            'class_batch__subject__semester', 
            'student_id', 
            'status'
        ).annotate(count=Count('id'))

        for row in att_counts:
            stream = row['class_batch__subject__stream']
            sem = row['class_batch__subject__semester']
            year_prefix = sem_to_year.get(sem, 'FY')
            class_key = f"{year_prefix} {stream}"
            
            s_id = row['student_id']
            status = row['status']
            count = row['count']
            
            if class_key in results and s_id in results[class_key]['students_map']:
                results[class_key]['students_map'][s_id]['total'] += count
                if status == 'Present':
                    results[class_key]['students_map'][s_id]['attended'] += count

        # 3. Calculate final stats
        final_results = {}
        for class_key, data in results.items():
            students = data['students_map']
            present_count = 0
            for s_id, s_data in students.items():
                tot = s_data['total']
                att = s_data['attended']
                pct = (att / tot * 100) if tot > 0 else 0
                if pct >= 75:
                    present_count += 1
                    
            total_students = len(students)
            absent_count = total_students - present_count
            
            final_results[class_key] = {
                "total": total_students,
                "present": present_count,
                "absent": absent_count,
                "pct": round((present_count / total_students * 100), 1) if total_students > 0 else 0
            }

        return Response(final_results)

class HODClassStatsView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        year = request.query_params.get('year', 'FY')
        dept = request.query_params.get('dept', 'BCA')
        period = request.query_params.get('period', 'overall')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        from django.utils import timezone
        import datetime
        from django.db.models import Count, Q

        today = timezone.now().date()
        date_filter = Q()
        if period == 'today':
            date_filter = Q(date=today)
        elif period == 'week':
            start_of_week = today - datetime.timedelta(days=today.weekday())
            date_filter = Q(date__gte=start_of_week)
        elif period == 'month':
            date_filter = Q(date__month=today.month, date__year=today.year)
        elif period == 'custom' and start_date and end_date:
            date_filter = Q(date__gte=start_date, date__lte=end_date)

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

        enrollments = Enrollment.objects.filter(class_batch__in=batches).select_related('student').distinct().order_by('student__roll_no')
        
        att_counts = Attendance.objects.filter(class_batch__in=batches).filter(date_filter).values('student_id').annotate(
            total_att=Count('id'),
            attended_att=Count('id', filter=Q(status='Present'))
        )
        stats_map = {row['student_id']: {'total': row['total_att'], 'attended': row['attended_att']} for row in att_counts}

        students_map = {}

        for en in enrollments:
            s = en.student
            if not s or s.id in students_map:
                continue
            
            s_stats = stats_map.get(s.id, {'total': 0, 'attended': 0})
            total = s_stats['total']
            attended = s_stats['attended']
            
            students_map[s.id] = {
                "id": s.id,
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

        daily_records = list(Attendance.objects.filter(class_batch__in=batches).filter(date_filter).values('date').annotate(
            present=Count('id', filter=Q(status='Present')),
            absent=Count('id', filter=Q(status='Absent'))
        ).order_by('date'))

        return Response({
            "year": year,
            "dept": dept,
            "total": total_students,
            "present": present_count,
            "absent": absent_count,
            "students": students_list,
            "daily_records": daily_records
        })


class MentorMenteesView(APIView):
    permission_classes = [IsAuthenticated, IsMentor]

    def get(self, request):
        from django.db.models import Count, Q

        mentor = get_target_user(request)
        
        # Optimize with a single database query using annotations for attendance counts
        mentees_qs = User.objects.filter(mentor=mentor).annotate(
            total_attendance=Count('attendance_records'),
            attended_attendance=Count('attendance_records', filter=Q(attendance_records__status='Present'))
        ).prefetch_related('enrollment_set__class_batch__subject').order_by('roll_no')

        results = []
        for m in mentees_qs:
            total = m.total_attendance
            attended = m.attended_attendance
            pct = round((attended / total * 100), 1) if total > 0 else 0.0

            # Safe access using prefetched cache
            en_list = m.enrollment_set.all()
            first_en = en_list[0] if len(en_list) > 0 else None
            class_str = f"{first_en.class_batch.subject.stream} {first_en.class_batch.subject.semester}" if (first_en and first_en.class_batch and hasattr(first_en.class_batch, 'subject')) else "Unassigned"

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


class MenteeReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsMentor]

    def get(self, request, mentee_id):
        from django.db.models import Count, Q

        mentor = get_target_user(request)
        
        try:
            mentee = User.objects.get(id=mentee_id, mentor=mentor, role='Student')
        except User.DoesNotExist:
            return Response({"error": "Mentee not found or not assigned to you."}, status=404)
        
        month = request.query_params.get('month')
        subject_id = request.query_params.get('subject_id')
        
        base_qs = Attendance.objects.filter(student=mentee).order_by('date')
        if month:
            base_qs = base_qs.filter(date__month=int(month))
        
        # Subject breakdown (always show all subjects)
        from django.db.models import Count, Q
        subject_data = []
        enrollments = Enrollment.objects.filter(student=mentee).select_related('class_batch__subject')
        
        enroll_batch_ids = [en.class_batch_id for en in enrollments]
        att_counts = base_qs.order_by().filter(class_batch_id__in=enroll_batch_ids).values('class_batch_id').annotate(
            sub_total=Count('id'),
            sub_present=Count('id', filter=Q(status='Present'))
        )
        att_map = {row['class_batch_id']: row for row in att_counts}
        
        for en in enrollments:
            amap = att_map.get(en.class_batch_id, {'sub_total': 0, 'sub_present': 0})
            sub_total = amap['sub_total']
            sub_present = amap['sub_present']
            
            sub_pct = (sub_present / sub_total * 100) if sub_total > 0 else 0
            if sub_total > 0:
                subject_data.append({
                    "id": en.class_batch.subject.id,
                    "name": en.class_batch.subject.name,
                    "pct": round(sub_pct, 1),
                    "total": sub_total,
                    "attended": sub_present
                })

        # Apply subject filter for overall stats and graph history
        qs = base_qs
        if subject_id:
            qs = qs.filter(class_batch__subject_id=subject_id)

        # Calculate overall stats for this time period
        total_records = qs.count()
        present_records = qs.filter(status='Present').count()
        absent_records = total_records - present_records
        attendance_pct = (present_records / total_records * 100) if total_records > 0 else 0

        # Bar chart history aggregation
        chart_data_dict = {}
        for att in qs:
            d = att.date.strftime('%Y-%m-%d')
            if d not in chart_data_dict:
                chart_data_dict[d] = {"date": d, "present": 0, "absent": 0}
            if att.status == 'Present':
                chart_data_dict[d]['present'] += 1
            else:
                chart_data_dict[d]['absent'] += 1

        chart_data = list(chart_data_dict.values())

        return Response({
            "mentee": {
                "id": mentee.id,
                "name": mentee.name or mentee.email,
                "roll": mentee.roll_no or f"R-{mentee.id}",
                "email": mentee.email,
            },
            "overall": {
                "total": total_records,
                "attended": present_records,
                "pct": round(attendance_pct, 1)
            },
            "history": chart_data,
            "subjects": subject_data
        })


class HODStudentReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request, student_id):
        from django.db.models import Count, Q

        user = get_target_user(request)
        
        try:
            mentee = User.objects.get(id=student_id, role='Student')
        except User.DoesNotExist:
            return Response({"error": "Student not found."}, status=404)
        
        month = request.query_params.get('month')
        subject_id = request.query_params.get('subject_id')
        
        base_qs = Attendance.objects.filter(student=mentee).order_by('date')
        if month:
            base_qs = base_qs.filter(date__month=int(month))
        
        # Subject breakdown (always show all subjects)
        from django.db.models import Count, Q
        subject_data = []
        enrollments = Enrollment.objects.filter(student=mentee).select_related('class_batch__subject')
        
        enroll_batch_ids = [en.class_batch_id for en in enrollments]
        att_counts = base_qs.order_by().filter(class_batch_id__in=enroll_batch_ids).values('class_batch_id').annotate(
            sub_total=Count('id'),
            sub_present=Count('id', filter=Q(status='Present'))
        )
        att_map = {row['class_batch_id']: row for row in att_counts}
        
        for en in enrollments:
            amap = att_map.get(en.class_batch_id, {'sub_total': 0, 'sub_present': 0})
            sub_total = amap['sub_total']
            sub_present = amap['sub_present']
            
            sub_pct = (sub_present / sub_total * 100) if sub_total > 0 else 0
            if sub_total > 0:
                subject_data.append({
                    "id": en.class_batch.subject.id,
                    "name": en.class_batch.subject.name,
                    "pct": round(sub_pct, 1),
                    "total": sub_total,
                    "attended": sub_present
                })

        # Apply subject filter for overall stats and graph history
        qs = base_qs
        if subject_id:
            qs = qs.filter(class_batch__subject_id=subject_id)

        # Calculate overall stats for this time period
        total_records = qs.count()
        present_records = qs.filter(status='Present').count()
        absent_records = total_records - present_records
        attendance_pct = (present_records / total_records * 100) if total_records > 0 else 0

        # Bar chart history aggregation
        chart_data_dict = {}
        for att in qs:
            d = att.date.strftime('%Y-%m-%d')
            if d not in chart_data_dict:
                chart_data_dict[d] = {"date": d, "present": 0, "absent": 0}
            if att.status == 'Present':
                chart_data_dict[d]['present'] += 1
            else:
                chart_data_dict[d]['absent'] += 1

        chart_data = list(chart_data_dict.values())

        return Response({
            "mentee": {
                "id": mentee.id,
                "name": mentee.name or mentee.email,
                "roll": mentee.roll_no or f"R-{mentee.id}",
                "email": mentee.email,
            },
            "overall": {
                "total": total_records,
                "attended": present_records,
                "pct": round(attendance_pct, 1)
            },
            "history": chart_data,
            "subjects": subject_data
        })


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

        settings_obj, _ = SystemSettings.objects.get_or_create(id=1, defaults={"current_academic_year": "2026-2027"})

        return Response({
            "total_classes_per_week": total_classes_week,
            "active_teachers": active_teachers,
            "uploaded_timetables": uploaded_timetables,
            "pending_assignments": pending_assignments,
            "is_frozen": settings_obj.is_timetable_frozen,
        })

class TimetableFreezeView(APIView):
    permission_classes = [IsAuthenticated, IsTimetableIncharge]
    
    def post(self, request):
        settings_obj, _ = SystemSettings.objects.get_or_create(id=1, defaults={"current_academic_year": "2026-2027"})
        is_frozen = request.data.get('is_frozen', False)
        settings_obj.is_timetable_frozen = is_frozen
        settings_obj.save()
        
        status_text = "frozen" if is_frozen else "unfrozen"
        TimetableActivityLog.objects.create(
            action="Timetable Frozen State Changed",
            detail=f"Timetable has been {status_text}.",
            user=request.user,
            color="bg-red-500" if is_frozen else "bg-green-500"
        )
        return Response({"message": f"Timetable {status_text} successfully.", "is_frozen": is_frozen})


class TimetableActivityPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50

class TimetableActivityLogView(APIView):
    permission_classes = [IsAuthenticated, IsTimetableIncharge]
    
    def get(self, request):
        logs = TimetableActivityLog.objects.select_related('user').order_by('-created_at')
        paginator = TimetableActivityPagination()
        paginated_logs = paginator.paginate_queryset(logs, request, view=self)
        
        data = [
            {
                "id": log.id,
                "action": log.action,
                "detail": log.detail,
                "time": log.created_at.strftime('%Y-%m-%d %I:%M %p'),
                "color": log.color
            }
            for log in paginated_logs
        ]
        return paginator.get_paginated_response(data)


class TimetableFiltersAPIView(APIView):
    permission_classes = [IsAuthenticated, IsTimetableIncharge]

    def get(self, request):
        departments = Department.objects.prefetch_related('stream_set').all()
        
        data = []
        all_subjects = list(Subject.objects.prefetch_related('classes').all())
        all_teachers = list(User.objects.filter(role__in=['Teacher', 'HOD'], is_active=True).select_related('department'))
        
        for dept in departments:
            dept_data = {
                "id": dept.id,
                "name": dept.name,
                "teachers": [{"id": t.id, "name": t.name or t.email} for t in all_teachers if getattr(t, 'department_id', None) == dept.id],
                "streams": []
            }
            
            for stream in dept.stream_set.all():
                stream_data = {
                    "id": stream.id,
                    "name": stream.name,
                    "years": []
                }
                
                years_map = {
                    "FY": ["Sem 1", "Sem 2"],
                    "SY": ["Sem 3", "Sem 4"],
                    "TY": ["Sem 5", "Sem 6"]
                }
                
                for year_name, sems in years_map.items():
                    year_subjects = []
                    for sub in all_subjects:
                        if sub.stream == stream.name and sub.semester in sems:
                            classes_data = [
                                {"id": cls.id, "name": f"{sub.name} - Div {cls.division}" if cls.division else f"{sub.name} (Class #{cls.id})"}
                                for cls in sub.classes.all()
                            ]
                            if classes_data:
                                year_subjects.append({
                                    "id": sub.id,
                                    "name": sub.name,
                                    "classes": classes_data
                                })
                    
                    if year_subjects:
                        stream_data["years"].append({
                            "name": year_name,
                            "subjects": year_subjects
                        })
                        
                dept_data["streams"].append(stream_data)
                
            data.append(dept_data)
            
        return Response(data)


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
        
        TimetableActivityLog.objects.create(
            action="Teaching Duty Assigned",
            detail=f"{teacher.name or teacher.email} assigned to teach {batch.subject.name if batch.subject else 'Class Batch'}.",
            user=request.user,
            color="bg-blue-500"
        )

        return Response({
            "message": f"Successfully assigned {teacher.name or teacher.email} to class.",
            "class_id": batch.id,
            "teacher_id": teacher.id
        })


# ==============================================================================
# 5. Monitoring Features
# ==============================================================================

class MonitoringTeacherWorkloadView(APIView):
    permission_classes = [IsAuthenticated, IsTimetableIncharge]

    def get(self, request):
        # Fetch all teachers
        teachers = User.objects.filter(role__in=['Teacher', 'HOD'], is_active=True).select_related('department')
        
        # Calculate daily workloads from Timetable
        timetables = Timetable.objects.select_related('class_batch__teacher').all()
        
        # Also fetch monitoring duties assigned
        monitoring_duties = MonitoringDuty.objects.all()

        data = []
        for t in teachers:
            t_schedules = [tt for tt in timetables if getattr(tt.class_batch, 'teacher_id', None) == t.id]
            schedule_map = {}
            for day, _ in Timetable.DAYS_OF_WEEK:
                day_slots = [tt.start_time.strftime('%I:%M %p') + '-' + tt.end_time.strftime('%I:%M %p') for tt in t_schedules if tt.day_of_week == day]
                schedule_map[day] = day_slots
                
            data.append({
                "id": t.id,
                "name": t.name or t.email,
                "dept": t.department.name if t.department else "General",
                "schedule": schedule_map
            })
            
        return Response(data)

class MonitoringDutyListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTimetableIncharge]

    def post(self, request):
        teacher_id = request.data.get('teacher_id')
        date = request.data.get('date')
        time_slot = request.data.get('time_slot')
        class_room = request.data.get('class_room')
        class_batch_id = request.data.get('class_batch_id')

        try:
            teacher = User.objects.get(id=teacher_id)
            cb = ClassBatch.objects.get(id=class_batch_id) if class_batch_id else None
            
            MonitoringDuty.objects.create(
                teacher=teacher,
                assigned_by=request.user,
                date=date,
                time_slot=time_slot,
                class_room=class_room,
                class_batch=cb,
                status='Pending'
            )
            Notification.objects.create(
                user=teacher,
                message=f"You have been assigned a new monitoring duty on {date} at {time_slot} in {class_room}.",
                action_url='/teacher/dashboard'
            )
            TimetableActivityLog.objects.create(
                action="Monitoring Duty Assigned",
                detail=f"{teacher.name or teacher.email} assigned to monitor {class_room}.",
                user=request.user,
                color="bg-purple-500"
            )
            return Response({"success": True}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TeacherMonitoringDutyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_target_user(request)
        # Fetch all duties for this teacher so frontend can separate active and archived
        duties = MonitoringDuty.objects.filter(teacher=user).select_related('class_batch__subject').order_by('-date', 'time_slot')
        
        data = []
        for d in duties:
            start_time_str = d.time_slot.split('-')[0].strip() if '-' in d.time_slot else d.time_slot
            end_time_str = d.time_slot.split('-')[1].strip() if '-' in d.time_slot else ''
            
            c_name = "General Duty"
            total_enrolled = 0
            if d.class_batch:
                sub = d.class_batch.subject
                year = "FY" if sub.semester in ['Sem 1', 'Sem 2'] else "SY" if sub.semester in ['Sem 3', 'Sem 4'] else "TY"
                c_name = f"{year} {sub.stream}"
                total_enrolled = d.class_batch.enrollments.count()
            
            data.append({
                "id": d.id,
                "date": d.date.isoformat(),
                "time_start": start_time_str,
                "time_end": end_time_str,
                "room": d.class_room,
                "class_name": c_name,
                "status": d.status,
                "total_students": d.total_students_present,
                "total_enrolled": total_enrolled
            })
            
        return Response(data)

    def post(self, request):
        user = get_target_user(request)
        duty_id = request.data.get('duty_id')
        total_students = request.data.get('total_students_present')

        try:
            duty = MonitoringDuty.objects.get(id=duty_id, teacher=user)
            duty.total_students_present = total_students
            duty.status = 'Completed'
            duty.save()
            return Response({"success": True})
        except MonitoringDuty.DoesNotExist:
            return Response({"error": "Duty not found."}, status=status.HTTP_404_NOT_FOUND)


class FreeTeachersView(APIView):
    permission_classes = [IsAuthenticated, IsTimetableIncharge]

    def get(self, request):
        date = request.query_params.get('date')
        time_slot = request.query_params.get('time_slot')
        
        if not date or not time_slot:
            return Response({"error": "date and time_slot are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        import datetime
        try:
            date_obj = datetime.datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)
            
        day_of_week = date_obj.strftime('%A')
        
        start_time_str = time_slot.split('-')[0].strip() if '-' in time_slot else time_slot
        try:
            start_time = datetime.datetime.strptime(start_time_str, '%I:%M %p').time()
        except ValueError:
            start_time = None
        
        all_teachers = User.objects.filter(role__in=['Teacher', 'HOD'], is_active=True).select_related('department')
        
        busy_timetable = Timetable.objects.filter(
            day_of_week=day_of_week,
            start_time=start_time,
            class_batch__teacher__isnull=False
        ).values_list('class_batch__teacher_id', flat=True) if start_time else []
        
        busy_monitoring = MonitoringDuty.objects.filter(
            date=date,
            time_slot=time_slot
        ).values_list('teacher_id', flat=True)
        
        busy_teacher_ids = set(list(busy_timetable) + list(busy_monitoring))
        
        free_teachers = []
        for t in all_teachers:
            if t.id not in busy_teacher_ids:
                free_teachers.append({
                    "id": t.id,
                    "name": t.name or t.email,
                    "dept": t.department.name if getattr(t, 'department', None) else "General"
                })
                
        return Response(free_teachers)


class MonitorClassesView(APIView):
    permission_classes = [IsAuthenticated, IsTimetableIncharge]

    def get(self, request):
        batches = ClassBatch.objects.select_related('subject').all()
        # To avoid showing 50 subjects for FY BCA, we can group by Stream + Semester
        # However, the user needs to select a ClassBatch. 
        # We'll just return unique batches, maybe the first one for each Stream/Year
        seen = set()
        data = []
        for b in batches:
            year = "FY" if b.subject.semester in ['Sem 1', 'Sem 2'] else "SY" if b.subject.semester in ['Sem 3', 'Sem 4'] else "TY"
            key = f"{year} {b.subject.stream}"
            if key not in seen:
                seen.add(key)
                # Count total enrollments for this representative batch
                total = Enrollment.objects.filter(class_batch=b).count()
                data.append({"id": b.id, "name": key, "total_students": total})
                
        # Sort data nicely
        data.sort(key=lambda x: x['name'])
        return Response(data)


# ==============================================================================
# 6. Admin Console
# ==============================================================================

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        total_students = User.objects.filter(role='Student').count()
        total_teachers = User.objects.filter(role__in=['Teacher', 'HOD']).count()
        
        # Active sessions based on last_activity within the last 15 minutes
        time_threshold = timezone.now() - timedelta(minutes=15)
        active_students = User.objects.filter(role='Student', last_activity__gte=time_threshold).count()
        active_teachers = User.objects.filter(role__in=['Teacher', 'HOD'], last_activity__gte=time_threshold).count()
        active_sessions = active_students + active_teachers
        
        # Classes going on today (distinct subject names from today's attendance)
        today_attendance = Attendance.objects.filter(date=timezone.now().date()).select_related('class_batch__subject')
        active_class_names = list(today_attendance.values_list('class_batch__subject__name', flat=True).distinct())

        settings_obj, created = SystemSettings.objects.get_or_create(id=1, defaults={"current_academic_year": "2026-2027"})
        
        last_backup = "Never"
        if settings_obj.last_backup_date:
            # Convert to local time format
            last_backup = timezone.localtime(settings_obj.last_backup_date).strftime('%b %d, %Y %I:%M %p')

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
                "active_students": active_students,
                "active_teachers": active_teachers,
                "active_class_names": active_class_names,
                "current_academic_year": settings_obj.current_academic_year,
                "last_database_backup": last_backup
            }
        })

    def post(self, request):
        action = request.data.get('action')
        if action == 'archive_batch':
            batch_id = request.data.get('batch_id')
            ClassBatch.objects.filter(id=batch_id).update(academic_year="Archived")
            return Response({"message": f"Batch #{batch_id} archived successfully."})
            
        elif action == 'new_academic_year':
            new_year = request.data.get('year')
            if not new_year:
                return Response({"error": "New academic year is required."}, status=400)
                
            # Archive all active batches
            settings_obj, _ = SystemSettings.objects.get_or_create(id=1, defaults={"current_academic_year": "2026-2027"})
            current_year = settings_obj.current_academic_year
            ClassBatch.objects.filter(academic_year=current_year).update(academic_year="Archived")
            
            # Update the global setting
            settings_obj.current_academic_year = new_year
            settings_obj.is_timetable_frozen = False # Unfreeze when starting new year
            settings_obj.save()
            
            return Response({"message": f"Successfully created new academic year: {new_year}. Old data archived."})
            
        return Response({"message": "Action processed."})


class AdminUsersListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        role = request.query_params.get('role')
        stream_filter = request.query_params.get('stream')
        year_filter = request.query_params.get('year')

        from django.db.models import Prefetch
        users_qs = User.objects.all().order_by('roll_no', '-id').select_related('department', 'stream').prefetch_related(
            Prefetch('enrollment_set', queryset=Enrollment.objects.select_related('class_batch__subject'))
        )

        if role:
            role_title = role.capitalize()
            if role_title in ['Student', 'Teacher', 'Admin', 'Principal', 'Hods', 'Mentors']:
                if role_title == 'Hods':
                    users_qs = users_qs.filter(is_hod=True)
                elif role_title == 'Mentors':
                    users_qs = users_qs.filter(is_mentor=True)
                else:
                    users_qs = users_qs.filter(role=role_title)

        results = []
        for u in users_qs[:200]:
            user_stream = u.stream.name if getattr(u, 'stream', None) else "N/A"
            user_dept = u.department.name if getattr(u, 'department', None) else "N/A"
            user_year = "N/A"
            
            if u.role == 'Student':
                en_list = u.enrollment_set.all()
                if en_list and en_list[0].class_batch.subject:
                    user_year = en_list[0].class_batch.subject.semester

            if stream_filter and stream_filter != 'All' and user_stream != stream_filter:
                continue
            if year_filter and year_filter != 'All' and user_year != year_filter:
                continue

            results.append({
                "id": u.id,
                "name": u.name or (u.roll_no if u.role == 'Student' else u.email),
                "email": u.email,
                "roll_no": u.roll_no,
                "role": u.role,
                "department": user_dept,
                "stream": user_stream,
                "year": user_year,
                "status": "active" if u.is_active and not u.is_archived else "inactive",
                "is_active": u.is_active
            })

        return Response({"users": results})

    def post(self, request):
        from users.models import Department, Stream
        
        name = request.data.get('name')
        email = request.data.get('email')
        role = request.data.get('role', 'Student').capitalize()
        stream_name = request.data.get('stream')
        department_name = request.data.get('department')
        roll_no = request.data.get('roll_no')

        if not email and not roll_no:
            return Response({"error": "Either email or roll number is required."}, status=400)

        dept = None
        if department_name:
            dept = Department.objects.filter(name=department_name).first()

        stream = None
        if stream_name and role == 'Student':
            stream = Stream.objects.filter(name=stream_name).first()

        try:
            user = User.objects.create_user(
                email=email,
                roll_no=roll_no,
                name=name,
                role=role,
                department=dept,
                stream=stream
            )
            return Response({"message": "User created successfully", "user_id": user.id})
        except Exception as e:
            return Response({"error": str(e)}, status=400)


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
        academic_year = request.query_params.get('academic_year', 'All')

        qs = Attendance.objects.select_related(
            'student', 'student__stream', 'student__department', 'class_batch__subject'
        )
        if academic_year != 'All':
            qs = qs.filter(class_batch__academic_year=academic_year)
            
        if export_type == 'pdf':
            # User specifically requested full history, removing limits
            qs = qs.order_by('-date')

        # Update last backup date
        settings_obj, _ = SystemSettings.objects.get_or_create(id=1)
        settings_obj.last_backup_date = timezone.now()
        settings_obj.save(update_fields=['last_backup_date'])

        import io
        if not qs.exists():
            data = [{"Message": "No attendance records found"}]
        else:
            # First, aggregate stats per student per subject
            from collections import defaultdict
            stats = defaultdict(lambda: {'total': 0, 'attended': 0})
            for a in qs:
                subject_name = a.class_batch.subject.name if a.class_batch.subject else "N/A"
                key = (a.student.id, subject_name)
                stats[key]['total'] += 1
                if a.status == 'Present':
                    stats[key]['attended'] += 1

            data = []
            for a in qs:
                stream_name = a.student.stream.name if getattr(a.student, 'stream', None) else "General"
                dept_name = a.student.department.name if getattr(a.student, 'department', None) else "N/A"
                subject_name = a.class_batch.subject.name if a.class_batch.subject else "N/A"
                
                s = stats[(a.student.id, subject_name)]
                total = s['total']
                attended = s['attended']
                percentage = round((attended / total) * 100, 2) if total > 0 else 0.0

                data.append({
                    "Stream": stream_name,
                    "Department": dept_name,
                    "Date": str(a.date),
                    "Student_Roll": a.student.roll_no or str(a.student.id),
                    "Student_Name": a.student.name or a.student.email,
                    "Subject": subject_name,
                    "Status": a.status,
                    "Time_Slot": a.time_slot,
                    "Total Classes": total,
                    "Classes Attended": attended,
                    "Attendance (%)": percentage
                })

        import io
        import zipfile
        from collections import defaultdict
        import datetime
        import csv
        from io import StringIO
        import openpyxl
        from openpyxl.styles import PatternFill
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, landscape
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        def get_path(subject):
            if not subject:
                return "Uncategorized/Unknown/Unknown", "Unknown"
            
            stream = subject.stream
            if stream in ['BCA', 'BVoc']:
                dept = 'Computer Science'
            elif stream in ['BBA', 'BCOM', 'BBA(FS)']:
                dept = 'Finance'
            else:
                dept = 'Other'
                
            sem = subject.semester
            if sem in ['Sem 1', 'Sem 2']:
                year = 'FY'
            elif sem in ['Sem 3', 'Sem 4']:
                year = 'SY'
            elif sem in ['Sem 5', 'Sem 6']:
                year = 'TY'
            else:
                year = 'Other'
                
            safe_subj = subject.name.replace('/', '_').replace('\\', '_')
            return f"{dept}/{year}/{stream}", safe_subj

        zip_buffer = io.BytesIO()
        
        if not qs.exists():
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.writestr("Message.txt", "No attendance records found.")
        else:
            grouped_records = defaultdict(list)
            for a in qs:
                folder_path, file_name = get_path(a.class_batch.subject)
                grouped_records[(folder_path, file_name)].append(a)

            green_fill = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
            red_fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")

            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
                for (folder_path, file_name), records in grouped_records.items():
                    if export_type == 'excel':
                        wb = openpyxl.Workbook()
                        ws = wb.active
                        ws.title = file_name[:31] # Excel sheet name limit
                        
                        unique_dates = sorted(list(set(a.date for a in records)))
                        unique_weeks = sorted(list(set((d.isocalendar()[0], d.isocalendar()[1]) for d in unique_dates)))
                        unique_months = sorted(list(set((d.year, d.month) for d in unique_dates)))
                        
                        headers = ["Roll Number", "Name"]
                        for d in unique_dates:
                            headers.append(d.strftime('%d-%b'))
                        for yr, wk in unique_weeks:
                            headers.append(f"Wk {wk} (%)")
                        for yr, mo in unique_months:
                            headers.append(f"{datetime.date(yr, mo, 1).strftime('%b')} (%)")
                        headers.extend(["Total Classes", "Classes Attended", "Overall (%)"])
                        
                        ws.append(headers)
                        
                        student_records = defaultdict(list)
                        for a in records:
                            student_records[a.student].append(a)
                            
                        for student, s_records in student_records.items():
                            row = [student.roll_no or str(student.id), student.name or student.email]
                            
                            date_map = {a.date: a.status for a in s_records}
                            for d in unique_dates:
                                status = date_map.get(d, '')
                                row.append("P" if status == "Present" else "A" if status == "Absent" else "-")
                                
                            for yr, wk in unique_weeks:
                                week_records = [a for a in s_records if a.date.isocalendar()[0] == yr and a.date.isocalendar()[1] == wk]
                                total = len(week_records)
                                attended = sum(1 for a in week_records if a.status == 'Present')
                                pct = round((attended/total)*100, 1) if total > 0 else 0
                                row.append(pct)
                                
                            for yr, mo in unique_months:
                                month_records = [a for a in s_records if a.date.year == yr and a.date.month == mo]
                                total = len(month_records)
                                attended = sum(1 for a in month_records if a.status == 'Present')
                                pct = round((attended/total)*100, 1) if total > 0 else 0
                                row.append(pct)
                                
                            total = len(s_records)
                            attended = sum(1 for a in s_records if a.status == 'Present')
                            pct = round((attended/total)*100, 1) if total > 0 else 0
                            row.extend([total, attended, pct])
                            
                            ws.append(row)
                            
                            current_row = ws.max_row
                            for idx, d in enumerate(unique_dates):
                                col_idx = 3 + idx
                                val = row[2 + idx]
                                if val == "P":
                                    ws.cell(row=current_row, column=col_idx).fill = green_fill
                                elif val == "A":
                                    ws.cell(row=current_row, column=col_idx).fill = red_fill
                                    
                        file_buffer = io.BytesIO()
                        wb.save(file_buffer)
                        zf.writestr(f"{folder_path}/{file_name}.xlsx", file_buffer.getvalue())

                    elif export_type == 'pdf':
                        # Simple PDF Table
                        file_buffer = io.BytesIO()
                        doc = SimpleDocTemplate(file_buffer, pagesize=landscape(letter))
                        elements = []
                        styles = getSampleStyleSheet()
                        elements.append(Paragraph(f"{file_name} - {folder_path.replace('/', ' ')}", styles['Title']))
                        elements.append(Spacer(1, 12))
                        
                        student_records = defaultdict(list)
                        for a in records:
                            student_records[a.student].append(a)
                            
                        # Basic headers
                        headers = ["Roll Number", "Name", "Total", "Attended", "Overall (%)"]
                        table_data = [headers]
                        
                        for student, s_records in student_records.items():
                            total = len(s_records)
                            attended = sum(1 for a in s_records if a.status == 'Present')
                            pct = round((attended/total)*100, 1) if total > 0 else 0
                            table_data.append([
                                student.roll_no or str(student.id),
                                student.name or student.email,
                                str(total),
                                str(attended),
                                f"{pct}%"
                            ])
                            
                        t = Table(table_data)
                        t.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                            ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ]))
                        elements.append(t)
                        doc.build(elements)
                        zf.writestr(f"{folder_path}/{file_name}.pdf", file_buffer.getvalue())

                    else:
                        # CSV
                        text_buffer = StringIO()
                        writer = csv.writer(text_buffer)
                        
                        student_records = defaultdict(list)
                        for a in records:
                            student_records[a.student].append(a)
                            
                        headers = ["Roll Number", "Name", "Total", "Attended", "Overall (%)"]
                        writer.writerow(headers)
                        for student, s_records in student_records.items():
                            total = len(s_records)
                            attended = sum(1 for a in s_records if a.status == 'Present')
                            pct = round((attended/total)*100, 1) if total > 0 else 0
                            writer.writerow([
                                student.roll_no or str(student.id),
                                student.name or student.email,
                                total,
                                attended,
                                pct
                            ])
                            
                        zf.writestr(f"{folder_path}/{file_name}.csv", text_buffer.getvalue().encode('utf-8'))

        zip_buffer.seek(0)
        return FileResponse(zip_buffer, as_attachment=True, filename=f"College_Backup_{academic_year}.zip", content_type='application/zip')



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

        from django.db.models import Count, Q
        classes_summary = []
        for label, sems in year_groups:
            batches_qs = ClassBatch.objects.filter(subject__stream=stream, subject__semester__in=sems)
            batches_list = list(batches_qs.values_list('id', flat=True))
            
            total_students = Enrollment.objects.filter(class_batch_id__in=batches_list).values('student').distinct().count()

            att_aggs = Attendance.objects.filter(class_batch_id__in=batches_list).aggregate(
                present=Count('id', filter=Q(status='Present')),
                absent=Count('id', filter=Q(status='Absent'))
            )

            classes_summary.append({
                "class_id": batches_qs.first().id if batches_list else 0,
                "year": label,
                "stream": stream,
                "total": total_students,
                "present": att_aggs['present'] or 0,
                "absent": att_aggs['absent'] or 0
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
        from django.db.models import Count, Q
        weekly_trend = []
        today = timezone.now().date()
        w_start_total = today - timedelta(days=4 * 7)
        w_end_total = today
        
        # Bulk query for the last 4 weeks
        w_aggs = Attendance.objects.filter(class_batch=batch, date__range=[w_start_total, w_end_total]).values('date').annotate(
            present=Count('id', filter=Q(status='Present')),
            total=Count('id')
        )
        
        # Build map by date
        date_map = {row['date']: row for row in w_aggs}

        for w in range(4, 0, -1):
            w_start = today - timedelta(days=w * 7)
            w_end = w_start + timedelta(days=6)
            
            w_pres = 0
            w_total = 0
            # Aggregate from date map in Python
            curr_date = w_start
            while curr_date <= w_end:
                if curr_date in date_map:
                    w_pres += date_map[curr_date]['present']
                    w_total += date_map[curr_date]['total']
                curr_date += timedelta(days=1)
                
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

# ==============================================================================
# Additional Features (Tickets and Reports)
# ==============================================================================

class AttendanceTicketCreateView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request):
        subject_id = request.data.get('subject_id')
        ticket_date = request.data.get('date')
        reason = request.data.get('reason')

        if not subject_id or not ticket_date or not reason:
            return Response({"error": "Missing required fields"}, status=400)

        # Ensure attendance record exists
        attendance = Attendance.objects.filter(
            student=request.user,
            class_batch_id=subject_id,
            date=ticket_date
        ).first()

        if not attendance:
            return Response({"error": "No attendance record found for this date."}, status=400)

        ticket = AttendanceTicket.objects.create(
            attendance=attendance,
            student=request.user,
            reason=reason
        )
        return Response({"message": "Ticket raised successfully", "ticket_id": ticket.id}, status=201)


class StudentReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        subject_id = request.query_params.get('subject_id')
        
        # Base queryset for student
        qs = Attendance.objects.filter(student=request.user).order_by('date')
        if subject_id:
            qs = qs.filter(class_batch_id=subject_id)
            
        chart_data_dict = {}
        for att in qs:
            d = att.date.strftime('%Y-%m-%d')
            if d not in chart_data_dict:
                chart_data_dict[d] = {"date": d, "present": 0, "absent": 0}
            if att.status == 'Present':
                chart_data_dict[d]['present'] += 1
            else:
                chart_data_dict[d]['absent'] += 1

        chart_data = list(chart_data_dict.values())
        return Response({"chart_data": chart_data})


class TeacherReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        class_id = request.query_params.get('class_id')
        month = request.query_params.get('month')
        if not class_id:
            return Response({"error": "class_id is required"}, status=400)

        qs = Attendance.objects.filter(class_batch_id=class_id).order_by('date')
        if month:
            qs = qs.filter(date__month=int(month))
        
        # Pie Chart aggregation
        total_records = qs.count()
        present_records = qs.filter(status='Present').count()
        absent_records = total_records - present_records
        
        pieChartData = [
            {"name": "Present", "value": present_records, "fill": "#22c55e"},
            {"name": "Absent", "value": absent_records, "fill": "#ef4444"}
        ]
        percentage = (present_records / total_records * 100) if total_records > 0 else 0

        chart_data_dict = {}
        for att in qs:
            d = att.date.strftime('%Y-%m-%d')
            if d not in chart_data_dict:
                chart_data_dict[d] = {"date": d, "present": 0, "absent": 0}
            if att.status == 'Present':
                chart_data_dict[d]['present'] += 1
            else:
                chart_data_dict[d]['absent'] += 1

        chart_data = list(chart_data_dict.values())

        # Calculate defaulters (< 75%)
        enrollments = Enrollment.objects.filter(class_batch_id=class_id).select_related('student')
        defaulters = []
        total_conducted = qs.values('date', 'time_slot').distinct().count()
        
        from django.db.models import Count, Q
        student_attendance = Attendance.objects.filter(
            class_batch_id=class_id, status='Present'
        ).values('student_id').annotate(present_count=Count('id'))
        
        present_counts = {item['student_id']: item['present_count'] for item in student_attendance}
        
        total_attendance = 0
        for en in enrollments:
            student = en.student
            present_count = present_counts.get(student.id, 0)
            student_percentage = (present_count / total_conducted * 100) if total_conducted > 0 else 0
            total_attendance += student_percentage
            if student_percentage < 75.0 and total_conducted > 0:
                defaulters.append({
                    "id": student.roll_no or str(student.id),
                    "name": student.name,
                    "percentage": round(student_percentage, 1)
                })

        avg_attendance = round(total_attendance / enrollments.count(), 1) if enrollments.exists() else 0

        return Response({
            "chart_data": chart_data,
            "pieChartData": pieChartData,
            "pieChartPercentage": round(percentage, 1),
            "defaulters": defaulters,
            "avg_attendance": avg_attendance
        })

import math
from users.models import AuditLog

class AuditLogPaginationView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        role_filter = request.query_params.get('role', 'All')
        try:
            page = int(request.query_params.get('page', 1))
        except ValueError:
            page = 1
            
        per_page = 20
        
        queryset = AuditLog.objects.select_related('user').all()
        if role_filter and role_filter != 'All':
            queryset = queryset.filter(role=role_filter)
            
        total_logs = queryset.count()
        total_pages = math.ceil(total_logs / per_page)
        
        if page < 1:
            page = 1
        elif page > total_pages and total_pages > 0:
            page = total_pages
            
        start = (page - 1) * per_page
        end = start + per_page
        
        logs_qs = queryset[start:end]
        
        logs_data = [
            {
                "action": log.action,
                "target": log.target,
                "role": log.role,
                "timestamp": timezone.localtime(log.timestamp).strftime('%Y-%m-%d %H:%M')
            }
            for log in logs_qs
        ]
        
        return Response({
            "logs": logs_data,
            "total_pages": total_pages,
            "current_page": page,
            "total_logs": total_logs
        })

class MonitoringUnlockRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = get_target_user(request)
        duty_id = request.data.get("duty_id")
        
        try:
            duty = MonitoringDuty.objects.get(id=duty_id, teacher=user)
        except MonitoringDuty.DoesNotExist:
            return Response({"error": "Monitoring duty not found."}, status=status.HTTP_404_NOT_FOUND)
            
        if duty.status != 'Completed':
            return Response({"error": "Only completed duties can be unlocked."}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admins = User.objects.filter(is_superuser=True)
        
        notifications = []
        for admin in admins:
            name = user.get_full_name() or user.username
            notifications.append(
                Notification(
                    user=admin, 
                    message=f"Teacher {name} has requested to unlock monitoring duty for {duty.class_room} ({duty.time_slot}) on {duty.date}.",
                    action_url='/admin/dashboard'
                )
            )
            
        if notifications:
            Notification.objects.bulk_create(notifications)
            
        return Response({"message": "Unlock request sent to administrators."})