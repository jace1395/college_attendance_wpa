# College Attendance PWA - Project Documentation

This document outlines the database schema, all REST API endpoints, and critical hardcoded rules/logic within the system.

## 1. Database Schema Overview

### 1.1 Users & Authentication (`backend/users/models.py`)
- **User (Custom Model)**
  - `email`: Primary username field (Unique).
  - `roll_no`: Unique identifier for students.
  - `role`: Choices (`Admin`, `Principal`, `HOD`, `Teacher`, `Student`).
  - `is_first_login`: Boolean to force password changes (default: True).
  - `is_timetable_incharge`, `is_hod`, `is_mentor`: Role flags.
  - `mentor`: Self-referential ForeignKey linking students to their mentor.
  - `department` & `stream`: Foreign keys for taxonomy.

### 1.2 Core Attendance Entities (`backend/attendance/models.py`)
- **Subject**: Represents a course (e.g., BCA, BBA, BVoc) across specific semesters (1-6).
- **ClassBatch**: Links a `Subject` to a `Teacher` for a specific division and academic year.
- **Enrollment**: Many-to-Many resolution linking a `Student` to a `ClassBatch`.
- **Attendance**: The core record tracking a `Student` in a `ClassBatch` on a specific `date` and `time_slot`. Status is `Present` or `Absent`.
- **Timetable**: Defines the weekly schedule for a `ClassBatch` (Mon-Sat, Start Time, End Time).
- **MonitoringDuty**: Tracks exam/monitoring duties assigned to teachers.
- **AttendanceTicket**: Allows students to dispute or raise issues regarding specific attendance marks.

---

## 2. API Endpoints

All endpoints are prefixed with the base server URL.

### Authentication (`/api/auth/`)
- `POST /api/auth/login/` - Issues JWT access and refresh tokens.
- `POST /api/auth/token/refresh/` - Refreshes an expired access token.
- `GET /api/auth/me/` - Retrieves current authenticated user details.
- `POST /api/auth/change-password/` - Updates user password.

### Student Portal (`/api/student/`)
- `GET /api/student/dashboard/` - Core student dashboard data.
- `GET /api/student/subject/<id>/` - Detailed attendance view for a specific subject.
- `GET /api/student/notifications/` - List of student notifications.
- `GET /api/student/leave/` - Leave requests API (Note: Frontend UI for this has been removed).

### Teacher Portal (`/api/teacher/`)
- `GET /api/teacher/dashboard/` - List of assigned classes and duties.
- `GET /api/teacher/classes/<id>/grid/` - Fetches student roster to mark attendance.
- `POST /api/teacher/attendance/unlock-request/` - Requests admin to unlock past attendance records.
- `POST /api/attendance/mark/` - Submits/Saves attendance data for a class.
- `GET /api/teacher/hod/info/` - HOD specific dashboard data.
- `GET /api/teacher/hod/class-stats/` - HOD statistics for departments.
- `GET /api/teacher/mentor/mentees/` - List of students assigned to the teacher for mentoring.

### Timetable Management (`/api/timetable/`)
- `GET /api/timetable/dashboard/` - Overview of college schedules.
- `POST /api/timetable/assign/` - Creates or modifies a timetable entry.

### Admin Console (`/api/admin/`)
- `GET /api/admin/dashboard/` - Global system stats.
- `GET /api/admin/users/` - Lists all users in the system.
- `POST /api/admin/users/<id>/deactivate/` - Soft-deletes/Deactivates a user.
- `GET /api/admin/unlock-requests/` - Views pending teacher unlock requests.
- `POST /api/admin/unlock-requests/<id>/approve/` - Approves attendance unlock.
- `POST /api/admin/unlock-requests/<id>/deny/` - Denies attendance unlock.
- `GET /api/admin/teacher-subjects/` - Overrides/assignments for teachers.
- `GET /api/admin/backup/export/` - Triggers a database/system backup export.
- `POST /api/upload/` - Bulk uploads data (e.g., CSV imports for users/enrollments).

### Principal Oversight (`/api/principal/`)
- `GET /api/principal/dashboard/` - High-level college attendance reports.
- `GET /api/principal/stream-view/` - Data sliced by academic streams (BCA, BBA, etc).
- `GET /api/principal/class-detail/` - Deep dive into specific class metrics.

### Global Reports (`/api/reports/`)
- `GET /api/reports/` - General reporting data.
- `GET /api/reports/student/me/` - Historical data for the logged-in student.
- `GET /api/reports/teacher/classes/` - Aggregated charts/graphs data for teacher reports.
- `POST /api/attendance/tickets/` - Creates a dispute ticket.

---

## 3. Hardcoded Logic, Rules & Behaviors

The system relies on several hardcoded defaults to ensure consistency:

### 3.1 Passwords & Credentials
- **Dynamic Default Passwords**: If a user is created via bulk upload, or via the `seed_core_users` script without an explicit password, the system assigns a dynamic default: `Sdcce@{current_year}` (e.g., `Sdcce@2026`).
- **Core Accounts**: The `entrypoint.sh` runs `seed_core_users` on every container start, ensuring two accounts always exist (or their passwords are reset):
  - `admin@vvm.edu.in`
  - `principal@vvm.edu.in`

### 3.2 Frontend Email Suffix Logic (Login)
In `frontend/src/pages/auth/Login.jsx`, the user's input is automatically suffixed before sending to the backend:
- If the username starts with a digit, it is assumed to be a student roll number, and `.sdcce@vvm.edu.in` is appended.
- For all other usernames (Admin, Principal, Teachers), `@vvm.edu.in` is appended.

### 3.3 Database Defaults
- **Student Emails**: If a student is uploaded with only a `roll_no` and no email, the backend auto-generates a placeholder email: `{roll_no}@pending.vvm.edu.in`.
- **Academic Year**: When a new `ClassBatch` is created, the `academic_year` field defaults to `"2026-2027"`.
- **Attendance Time Slot**: The `time_slot` for attendance records defaults to `"Regular"`.

### 3.4 Docker Environment
- **Startup Sequence**: The backend container uses a custom `entrypoint.sh` script to run database migrations (`manage.py migrate`), seed the database (`manage.py seed_core_users`), and then start the Gunicorn server (`gunicorn`). This guarantees the database is always in a valid state upon booting.
- **Frontend Serving**: The frontend uses Vite for building and Nginx for production serving (port 80). Any changes to React files require a `docker compose build` to take effect.
