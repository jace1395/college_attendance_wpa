# Role: Expert React & Tailwind Frontend Developer
# Context: College Attendance System (React, Vite, Tailwind CSS, Recharts)

We are refining the frontend dashboards for our college attendance system. The backend (Django REST Framework + PostgreSQL) is fully built. I need you to update the React components based on the following strict deliverables. 

**Crucial Directives:**
- **Remove all hardcoded dummy data.** Replace them with empty state variables (e.g., `useState([])`) ready to receive data from API endpoints.
- **Theme Fix:** Fix the Light Mode theme across all interfaces. It should have a glassmorphic/transparent feel similar to the Dark Mode. Set the default theme to `system`.
- **Login Page:** In the login page tooltip, remove the repeated "Time Table Incharge" text.
- **Role-Based Rendering:** Mentor, HOD, and Timetable Incharge DO NOT have separate logins. They are Teachers. Conditionally render an extra tab in `TeacherDashboard.jsx` if `user.is_mentor`, `user.is_hod`, or `user.is_timetable_incharge` is true.

Please provide the updated React code for the following dashboard changes:

## 1. Student Dashboard
- [ ] **Remove** the "Messages" component/tab entirely.
- [ ] **Update "Notice Board":** Rename this to "Notifications" (or Inbox). This will act as a feed where students receive automated alerts when a teacher updates their attendance.

## 2. Admin Dashboard (God Mode)
- [ ] **Rename:** Change the "Data Entry" tab/button to "Manage Data".
- [ ] **Student Reports:** Add a "Division" filter dropdown next to the "All Programs" filter.
- [ ] **Reports Date Range:** Add a "Custom Range" option (Start Date & End Date calendar picker) in the reports section.
- [ ] **System Overrides:** 
      - Replace the manual "Class ID" text input with a dropdown menu showing the subjects taught by the selected teacher.
      - Add a new UI section here for "Attendance Unlock Requests" (where teachers request permission to edit past attendance).
- [ ] **User Management:** In the Manage Students, Teachers, Admin, HOD, and Mentor sections, add filters to search by Year (FY, SY, TY) and Stream (BVoc, BCA, BBA, BCOM).
- [ ] **Sync & Backup:** Add a dropdown to select the "Academic Year" (e.g., 2026-2027) before the user clicks the button to download the backup as an Excel file.

## 3. Principal Dashboard
- [ ] **Remove:** Delete the "Unlock Reports" feature (this has been moved to Admin).
- [ ] **Deep Dive View:** When the Principal clicks on "View" for any specific class, it should open a detailed modal/page showing the full stats of that class, including Recharts graphs.
- [ ] **Reports Date Range:** Add a "Custom Range" calendar picker for start and end dates.

## 4. Timetable Incharge View (Teacher Tab)
- [ ] **Remove:** Delete the following buttons/features: "Edit Timetable", "Reschedule", and "Teacher Monitor". (Keep only the core upload/assign features).

**Output Request:**
Please provide the updated code for the affected components, focusing on the UI layout, Tailwind classes for the transparent light mode, and the empty state hooks ready for Axios integration.