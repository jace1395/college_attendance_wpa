import pandas as pd
import io
from django.http import FileResponse, HttpResponseForbidden, HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from .models import Attendance

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_attendance_view(request):
    if request.user.role != 'Student':
        return Response({"error": "Only students can access this endpoint."}, status=403)

    records = Attendance.objects.filter(student=request.user).select_related('class_batch__subject')
    data = [{"date": r.date, "subject": r.class_batch.subject.name, "status": r.status} for r in records]
    return Response(data)

@login_required
def generate_attendance_report(request):
    if request.user.role not in ['Admin', 'Principal', 'HOD']:
        return HttpResponseForbidden("You do not have permission to generate reports.")

    qs = Attendance.objects.all().values('student__roll_no', 'class_batch__subject__name', 'status')
    df = pd.DataFrame(list(qs))
    
    if df.empty:
        return HttpResponse("No attendance data available.", status=404)

    df['is_present'] = df['status'].apply(lambda x: 1 if x == 'Present' else 0)
    report_df = df.groupby(['student__roll_no', 'class_batch__subject__name']).agg(
        total_classes=('status', 'count'),
        present_classes=('is_present', 'sum')
    ).reset_index()
    
    report_df['attendance_percentage'] = (report_df['present_classes'] / report_df['total_classes']) * 100
    report_df['attendance_percentage'] = report_df['attendance_percentage'].round(2)

    report_df.rename(columns={
        'student__roll_no': 'Roll Number',
        'class_batch__subject__name': 'Subject',
        'total_classes': 'Total Classes',
        'present_classes': 'Classes Attended',
        'attendance_percentage': 'Attendance (%)'
    }, inplace=True)

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
        report_df.to_excel(writer, index=False, sheet_name='Attendance Report')
    
    buffer.seek(0)
    return FileResponse(buffer, as_attachment=True, filename='Attendance_Report.xlsx', content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')