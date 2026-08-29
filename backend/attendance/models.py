from django.db import models
from django.conf import settings


class StreamChoices(models.TextChoices):
    BVOC = 'BVoc', 'BVoc'
    BCA = 'BCA', 'BCA'
    BBA = 'BBA', 'BBA'
    BCOM = 'BCOM', 'BCOM'
    BBA_FS = 'BBA(FS)', 'BBA (Financial Studies)'


class SemesterChoices(models.TextChoices):
    SEM1 = 'Sem 1', 'Sem 1'
    SEM2 = 'Sem 2', 'Sem 2'
    SEM3 = 'Sem 3', 'Sem 3'
    SEM4 = 'Sem 4', 'Sem 4'
    SEM5 = 'Sem 5', 'Sem 5'
    SEM6 = 'Sem 6', 'Sem 6'


class Subject(models.Model):
    name = models.CharField(max_length=255)
    stream = models.CharField(max_length=10, choices=StreamChoices.choices, db_index=True)
    semester = models.CharField(max_length=10, choices=SemesterChoices.choices, db_index=True)
    is_elective = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.stream} - {self.semester})"


class ClassBatch(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='classes')

    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                limit_choices_to={'role': 'Teacher'})

    division = models.CharField(max_length=50, null=True, blank=True)
    academic_year = models.CharField(max_length=20, default="2026-2027")

    def __str__(self):
        # If division exists, add it to the string. If blank, ignore it!
        div_str = f" - Div {self.division}" if self.division else ""
        return f"{self.subject.name}{div_str} ({self.academic_year}) - {self.teacher.email}"


class Enrollment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                limit_choices_to={'role': 'Student'})
    class_batch = models.ForeignKey(ClassBatch, on_delete=models.CASCADE, related_name='enrollments')

    class Meta:
        unique_together = ('student', 'class_batch')


class Attendance(models.Model):
    STATUS_CHOICES = [('Present', 'Present'), ('Absent', 'Absent')]

    class_batch = models.ForeignKey(ClassBatch, on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(db_index=True)
    time_slot = models.CharField(max_length=50, default="Regular")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('class_batch', 'student', 'date', 'time_slot')


class AttendanceTicket(models.Model):
    STATUS_CHOICES = [('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')]

    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='tickets')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('attendance', 'student')


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)



class MonitoringDuty(models.Model):
    STATUS_CHOICES = [('Pending', 'Pending'), ('Ongoing', 'Ongoing'), ('Empty', 'Empty')]

    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='monitoring_duties')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                    related_name='assigned_duties')

    date = models.DateField()
    time_slot = models.CharField(max_length=50)
    class_room = models.CharField(max_length=50)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.teacher.name} - {self.class_room} on {self.date}"



class Timetable(models.Model):
    DAYS_OF_WEEK = [
        ('Monday', 'Monday'), ('Tuesday', 'Tuesday'), ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'), ('Friday', 'Friday'), ('Saturday', 'Saturday')
    ]
    class_batch = models.ForeignKey(ClassBatch, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=10, choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        unique_together = ('class_batch', 'day_of_week', 'start_time')

    def __str__(self):
        return f"{self.class_batch.subject.name} - {self.day_of_week} ({self.start_time})"