# College Attendance PWA (Progressive Web App)

A modern, offline-capable college attendance management system. The application consists of a React-based frontend Progressive Web App (PWA) and a robust Django backend, all containerized for easy deployment using Docker.

## 🚀 Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Routing:** React Router v7
- **PWA / Offline Support:** Workbox, IndexedDB (idb)
- **Charts:** Recharts

### Backend
- **Framework:** Django (Python)
- **Database:** PostgreSQL 16
- **Containerization:** Docker & Docker Compose

---

## 📁 Project Structure

```
college_attendance_wpa/
│
├── frontend/           # React frontend application
│   ├── src/            # React components, stores, pages
│   ├── public/         # Static assets
│   ├── package.json    # Node dependencies and scripts
│   └── vite.config.js  # Vite configuration
│
├── backend/            # Django backend application
│   ├── attendance/     # Attendance tracking app
│   ├── users/          # User management app
│   ├── manage.py       # Django management script
│   └── requirements.txt# Python dependencies
│
├── docker-compose.yml  # Docker services configuration (db, backend, frontend)
└── README.md           # Project documentation
```

---

## 🛠️ Getting Started (Docker Recommended)

The easiest way to get the project up and running is by using Docker. This will start the PostgreSQL database, the Django backend, and the React frontend in isolated containers.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running the Application

1. Clone the repository and navigate to the root directory:
   ```bash
   cd college_attendance_wpa
   ```

2. Start the services using Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

3. Access the applications:
   - **Frontend:** http://localhost (or http://localhost:80)
   - **Backend API:** http://localhost:8000

4. Stop the services:
   ```bash
   docker-compose down
   ```

---

## 💻 Local Development (Without Docker)

If you prefer to run the services locally without Docker for development purposes:

### 1. Database Setup
Ensure you have a PostgreSQL instance running locally. Create a database named `attendance_db` and configure a user `postgres_user` with password `my_secure_password123` (or update the `.env` / `settings.py` accordingly).

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
The backend will run on `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on a local Vite dev server port (usually `http://localhost:5173`).

---

## 📱 PWA Features

This application is built as a Progressive Web App, utilizing Workbox for service worker management. This enables:
- **Offline Capabilities:** Caching of essential app shell assets.
- **Background Sync:** Synchronizing attendance data when the network connection is restored.
- **Installable:** Users can install the app on their mobile or desktop devices for a native-like experience.

## 📄 License

Check the `LICENSE` file for more details.