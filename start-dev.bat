@echo off
setlocal
cd /d "%~dp0"

start "Student Profiling API" cmd /k "cd /d \"%~dp0student-profiling-api\" && call serve.bat"
start "Student Profiling LMS" cmd /k "cd /d \"%~dp0student-profiling-lms\" && npm run dev"

echo Started backend and frontend in separate terminals.
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173

