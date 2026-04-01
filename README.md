# Student Profiling LMS

This README contains only the commands and directories needed to run the system.

For data mapping and UML/entity documentation, see `DATA-MAPPING.md`.

## 1) Project Root Commands

Directory:

```text
ITEW6PROJECTFINALS
```

Commands:

```bat
setup.bat
start-dev.bat
```

What they do:
- `setup.bat`: installs frontend/backend dependencies, runs backend migration and seed
- `start-dev.bat`: starts backend and frontend dev servers in separate terminals

## 2) Manual Commands by Directory

### Backend (Laravel API)

Directory:

```text
ITEW6PROJECTFINALS\student-profiling-api
```

Commands:

```bat
composer install
php artisan migrate
php artisan db:seed
serve.bat
```

Optional health check:

```text
http://127.0.0.1:8000/api/health
```

### Frontend (React + Vite)

Directory:

```text
ITEW6PROJECTFINALS\student-profiling-lms
```

Commands:

```bat
npm install
npm run dev
```

## 3) URLs and Default Admin Login

- Frontend: `http://localhost:5173` (or next available Vite port)
- Backend: `http://127.0.0.1:8000`
- Default MIS/Admin:
  - Email: `mis.admin@school.edu`
  - Password: `admin123`
