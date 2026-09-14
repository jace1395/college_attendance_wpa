# Fix Required: Django Admin Registration & Database Connection Verification

**Context:** The Neon PostgreSQL database contains populated data (Users, Students, etc.), but this data is not visible in the local Django Admin panel, and the frontend API calls seem to be returning empty data.

Please execute the following backend checks and fixes:

## Task 1: Verify Database Configuration
**Logic & Actions:**
1. Open `core/settings.py`.
2. Locate the `DATABASES` setting. Ensure it is strictly configured to use `dj_database_url` to read from the `.env` file, and that it does NOT silently fall back to `sqlite3` in development if the Neon URL is provided.
   ```python
   import dj_database_url
   import os
   
   DATABASES = {
       'default': dj_database_url.config(
           default=os.environ.get('DATABASE_URL'),
           conn_max_age=600,
           conn_health_checks=True,
       )
   }
Task 2: Register Models in Django Admin
Logic & Actions:
The models exist in the DB but are hidden from the Django Admin UI.
Open users/admin.py. Register the custom User model and the new Department model using @admin.register(). Ensure list_display includes useful fields like email, roll_no, role, and department.
Open attendance/admin.py. Register ClassBatch, Enrollment, and Attendance. For Enrollment, add list_display = ('student', 'class_batch') and list_filter = ('class_batch',) so the admin can easily see which students are in which class.
Open timetables/admin.py and leaves/admin.py and ensure their core models are also registered.
Task 3: Verify API Serialization (Sanity Check)
Logic & Actions:
Briefly check users/serializers.py and attendance/serializers.py.
Ensure that when a ClassBatch is fetched, the serializer correctly includes the nested Enrollment data (the list of students) so the React frontend receives the rows for the Attendance Grid.