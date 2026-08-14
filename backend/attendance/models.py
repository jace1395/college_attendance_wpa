from django.db import models
from django.conf import settings

class StreamChoices(models.TextChoices):
    BVOC = 'BVoc', 'BVoc'
    BCA = 'BCA', 'BCA'
    BBA = 'BBA', 'BBA'
    BCOM = 'BCOM', 'BCOM'

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

class ClassBatch(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='classes')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role': 'Teacher'})

class Enrollment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role': 'Student'})
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('student', 'subject')

class Attendance(models.Model):
    STATUS_CHOICES = [('Present', 'Present'), ('Absent', 'Absent')]
    
    class_batch = models.ForeignKey(ClassBatch, on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='marked_attendances')

    class Meta:
        unique_together = ('class_batch', 'student', 'date')

class MonitoringLog(models.Model):
    STATUS_CHOICES = [('Ongoing', 'Ongoing'), ('Empty', 'Empty')]
    
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    class_room = models.CharField(max_length=50)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)