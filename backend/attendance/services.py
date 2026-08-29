import pandas as pd
import io
from django.http import FileResponse
from .models import Attendance, ClassBatch, Timetable


def generate_attendance_report(user, start_date, end_date, download_format=None):
    # 1. Filter based on Role
    if user.role == 'Student':
        qs = Attendance.objects.filter(student=user, date__range=[start_date, end_date])
        if download_format:
            raise PermissionError("Students are not allowed to download reports.")
    elif user.role == 'Teacher':
        qs = Attendance.objects.filter(class_batch__teacher=user, date__range=[start_date, end_date])
    else:  # Admin, Principal, HOD
        qs = Attendance.objects.filter(date__range=[start_date, end_date])

    if not qs.exists():
        return {"error": "No attendance data available for this date range."}

    # 2. Convert to Pandas DataFrame
    df = pd.DataFrame(
        list(qs.values('date', 'status', 'student__name', 'student__roll_no', 'class_batch__subject__name')))

    # 3. Albin's Calculation Logic
    df['is_present'] = df['status'].apply(lambda x: 1 if x == 'Present' else 0)
    report_df = df.groupby(['student__roll_no', 'student__name', 'class_batch__subject__name']).agg(
        total_classes=('status', 'count'),
        present_classes=('is_present', 'sum')
    ).reset_index()

    report_df['attendance_percentage'] = (report_df['present_classes'] / report_df['total_classes']) * 100
    report_df['attendance_percentage'] = report_df['attendance_percentage'].round(2)

    # 4. Return JSON for Frontend Charts (Recharts)
    if not download_format:
        return report_df.to_dict(orient='records')

    # 5. Return FileResponse for Downloads
    report_df.rename(columns={
        'student__roll_no': 'Roll Number',
        'student__name': 'Name',
        'class_batch__subject__name': 'Subject',
        'total_classes': 'Total Classes',
        'present_classes': 'Classes Attended',
        'attendance_percentage': 'Attendance (%)'
    }, inplace=True)

    if download_format == 'excel':
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
            report_df.to_excel(writer, index=False, sheet_name='Attendance Report')
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename='Attendance_Report.xlsx',
                            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    elif download_format == 'csv':
        buffer = io.BytesIO()
        report_df.to_csv(buffer, index=False)
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename='Attendance_Report.csv', content_type='text/csv')


def process_timetable_upload(file_obj):
    if file_obj.name.endswith('.csv'):
        df = pd.read_csv(file_obj)
    elif file_obj.name.endswith(('.xls', '.xlsx')):
        df = pd.read_excel(file_obj)
    else:
        raise ValueError("Invalid file format.")

    df = df.dropna(subset=['Subject_ID', 'Day', 'Start_Time', 'End_Time'])
    count = 0
    for index, row in df.iterrows():
        try:
            batch = ClassBatch.objects.get(id=row['Subject_ID'])
            Timetable.objects.update_or_create(
                class_batch=batch,
                day_of_week=row['Day'],
                start_time=row['Start_Time'],
                defaults={'end_time': row['End_Time']}
            )
            count += 1
        except ClassBatch.DoesNotExist:
            continue
    return count