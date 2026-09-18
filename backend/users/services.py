import csv
import openpyxl
from io import TextIOWrapper
from datetime import datetime
from django.contrib.auth import get_user_model
from users.models import Department, Stream

User = get_user_model()

def process_user_upload(file_obj):
    rows = []
    headers = []
    
    if file_obj.name.endswith('.csv'):
        csv_file = TextIOWrapper(file_obj.file, encoding='utf-8')
        reader = csv.DictReader(csv_file)
        headers = [h.strip().lower() for h in reader.fieldnames] if reader.fieldnames else []
        for row in reader:
            rows.append({k.strip().lower(): v for k, v in row.items() if k})
    elif file_obj.name.endswith(('.xls', '.xlsx')):
        wb = openpyxl.load_workbook(file_obj, data_only=True)
        sheet = wb.active
        for i, row in enumerate(sheet.iter_rows(values_only=True)):
            if i == 0:
                headers = [str(col).strip().lower() for col in row if col is not None]
            else:
                row_data = {}
                for j, col in enumerate(row):
                    if j < len(headers):
                        row_data[headers[j]] = col
                rows.append(row_data)
    else:
        raise ValueError("Invalid file format. Only CSV and Excel are allowed.")

    if not {'name', 'role'}.issubset(set(headers)):
        raise ValueError("CSV must contain at least 'name' and 'role' columns.")

    current_year = datetime.now().year
    created_count = 0

    for row in rows:
        name = str(row.get('name') or '').strip()
        role = str(row.get('role') or '').strip()
        if not name or not role or name.lower() == 'nan' or role.lower() == 'nan':
            continue

        email_val = row.get('email')
        email = str(email_val).strip().lower() if email_val and str(email_val).lower() != 'nan' else None
        
        roll_val = row.get('roll_no')
        roll_no = str(roll_val).strip() if roll_val and str(roll_val).lower() != 'nan' else None

        if not roll_no and email and email[0].isdigit():
            roll_no = email.split('.')[0]
            
        dept_val = row.get('department')
        department_name = str(dept_val).strip() if dept_val and str(dept_val).lower() != 'nan' else None
        
        stream_val = row.get('stream')
        stream_name = str(stream_val).strip() if stream_val and str(stream_val).lower() != 'nan' else None

        dept_obj = None
        if department_name:
            dept_obj, _ = Department.objects.get_or_create(name=department_name)
            
        stream_obj = None
        if stream_name:
            stream_obj, _ = Stream.objects.get_or_create(name=stream_name, defaults={'department': dept_obj})

        raw_password = f"Sdcce@{current_year}"

        user, created = User.objects.update_or_create(
            email=email if email else None,
            defaults={
                'roll_no': roll_no,
                'name': name,
                'role': role,
                'department': dept_obj,
                'stream': stream_obj,
            }
        )
        
        if created:
            user.set_password(raw_password)
            user.save()
            created_count += 1

    return created_count