import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "attendance_wpa.settings")
django.setup()

from users.models import Department, Stream, User
from attendance.models import Subject, ClassBatch

def seed_data():
    print("Starting data seeding...")

    # 1. Create Departments
    cs_dept, _ = Department.objects.get_or_create(name="Computer Science", defaults={"code": "CS"})
    fin_dept, _ = Department.objects.get_or_create(name="Finance", defaults={"code": "FIN"})
    print("Departments created.")

    # 2. Create Streams
    bvoc, _ = Stream.objects.get_or_create(name="BVoc", defaults={"department": cs_dept})
    bca, _ = Stream.objects.get_or_create(name="BCA", defaults={"department": cs_dept})
    
    bcom, _ = Stream.objects.get_or_create(name="BCom", defaults={"department": fin_dept})
    bba, _ = Stream.objects.get_or_create(name="BBA", defaults={"department": fin_dept})
    bbafs, _ = Stream.objects.get_or_create(name="BBA(FS)", defaults={"department": fin_dept})
    print("Streams created.")

    # 3. Update Teacher Sumit Kumar
    # Actually, it's safer to try to find him by name
    existing_sumit = User.objects.filter(name__icontains="Sumit Kumar").first()
    if existing_sumit:
        sumit = existing_sumit
    else:
        sumit, created = User.objects.get_or_create(
            email="sumit@pending.vvm.edu.in",
            defaults={
                "name": "Sumit Kumar",
                "role": "Teacher",
                "is_staff": True
            }
        )
        if created:
            sumit.set_password("Sdcce@2026")

    sumit.is_hod = True
    sumit.department = cs_dept
    sumit.is_mentor = True
    sumit.save()
    print("Sumit Kumar updated.")

    # 4. Assign Students
    student_count = 0
    for i in range(2511001, 2511034):
        student, s_created = User.objects.get_or_create(
            roll_no=str(i),
            defaults={
                "email": f"{i}@vvm.edu.in",
                "name": f"Student {i}",
                "role": "Student",
                "department": cs_dept,
                "stream": bca
            }
        )
        if s_created:
            student.set_password("Sdcce@2026")
        
        student.mentor = sumit
        student.save()
        student_count += 1
    print(f"Assigned {student_count} students to Sumit.")

    # 5. Assign ClassBatches
    semesters = [("FY BCA", "Sem 1"), ("SY BCA", "Sem 3"), ("TY BCA", "Sem 5")]
    for sub_name, sem in semesters:
        subject, _ = Subject.objects.get_or_create(
            name=sub_name + " Core",
            stream="BCA",
            semester=sem,
            defaults={"is_elective": False}
        )
        
        ClassBatch.objects.get_or_create(
            subject=subject,
            teacher=sumit,
            division="A",
            academic_year="2026-2027"
        )
    print("ClassBatches assigned to Sumit.")
    print("Data seeding completed successfully.")

if __name__ == "__main__":
    seed_data()
