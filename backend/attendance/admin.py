from django.contrib import admin
from .models import ClassBatch, Enrollment, Attendance, Timetable, Subject

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'stream', 'semester')

@admin.register(ClassBatch)
class ClassBatchAdmin(admin.ModelAdmin):
    list_display = ('subject', 'teacher', 'academic_year')

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'class_batch')
    list_filter = ('class_batch',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'class_batch', 'date', 'status')

@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ('class_batch', 'day_of_week', 'start_time')
