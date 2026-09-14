# pyright: reportAttributeAccessIssue=false

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from attendance.models import Subject, ClassBatch, Enrollment, SemesterChoices

User = get_user_model()

class Command(BaseCommand):
    help = 'Sets up the QP UI UX class for Sumit Kumar and enrolls students 2511001 to 2511033.'

    def handle(self, *args, **kwargs):
        # 1. Fetch Teacher Sumit Kumar
        teacher = User.objects.filter(role='Teacher', name__icontains='Sumit Kumar').first()
        if not teacher:
            self.stdout.write(self.style.ERROR('Teacher Sumit Kumar not found!'))
            # Try by email if name failed
            teacher = User.objects.filter(role='Teacher', email__icontains='sumit').first()
            if not teacher:
                return
            
        self.stdout.write(self.style.SUCCESS(f'Found teacher: {teacher.name} ({teacher.email})'))

        # 2. Fetch or Create Subject "QP UI UX"
        subject, created = Subject.objects.get_or_create(
            name='QP UI UX',
            defaults={
                'code': 'QPUIUX',
                'description': 'UI/UX Design',
                'credits': 3,
                'semester': SemesterChoices.SEM_1
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created subject: {subject.name}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Found subject: {subject.name}'))

        # 3. Fetch or Create ClassBatch
        batch, created = ClassBatch.objects.get_or_create(
            subject=subject,
            teacher=teacher,
            defaults={
                'academic_year': '2026-2027'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created class batch for {subject.name} taught by {teacher.name}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Found class batch for {subject.name} taught by {teacher.name}'))

        # 4. Fetch Students 2511001 to 2511033
        roll_numbers = [str(roll) for roll in range(2511001, 2511034)]
        students = User.objects.filter(role='Student', roll_no__in=roll_numbers)
        
        self.stdout.write(self.style.SUCCESS(f'Found {students.count()} students in the specified roll number range.'))

        # 5. Create Enrollments
        enrollments_created = 0
        for student in students:
            _, en_created = Enrollment.objects.get_or_create(
                student=student,
                class_batch=batch
            )
            if en_created:
                enrollments_created += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully enrolled {enrollments_created} new students.'))
        self.stdout.write(self.style.SUCCESS('Done!'))
