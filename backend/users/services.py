import pandas as pd
from datetime import datetime
from django.contrib.auth import get_user_model

User = get_user_model()


def process_user_upload(file_obj):
    if file_obj.name.endswith('.csv'):
        df = pd.read_csv(file_obj)
    elif file_obj.name.endswith(('.xls', '.xlsx')):
        df = pd.read_excel(file_obj)
    else:
        raise ValueError("Invalid file format. Only CSV and Excel are allowed.")

    df = df.dropna(subset=['Name', 'Role'])

    # DYNAMIC YEAR FIX
    current_year = datetime.now().year
    created_count = 0

    for index, row in df.iterrows():
        email = str(row.get('Email', '')).strip().lower()
        name = str(row.get('Name', '')).strip()
        role = str(row.get('Role', '')).strip()

        roll_no = email.split('.')[0] if email and email[0].isdigit() else None

        # Generate Default Password dynamically
        first_name = name.split(' ')[0].lower()
        if role == 'Student':
            stream = "student"
            if "bvoc" in email:
                stream = "bvoc"
            elif "bca" in email:
                stream = "bca"
            elif "bba" in email:
                stream = "bba"
            elif "bcom" in email:
                stream = "bcom"
            raw_password = f"{first_name}.{stream}@{current_year}"
        else:
            raw_password = f"{first_name}.staff@{current_year}"

        if not User.objects.filter(email=email).exists():
            User.objects.create_user(
                email=email if email else None,
                roll_no=roll_no,
                password=raw_password,
                name=name,
                role=role
            )
            created_count += 1

    return created_count