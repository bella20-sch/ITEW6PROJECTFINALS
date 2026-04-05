@echo off
setlocal
cd /d "%~dp0"

start "Student Profiling API" cmd /k "cd /d \"%~dp0student-profiling-node\" && node server.js"
start "Student Profiling LMS" cmd /k "cd /d \"%~dp0student-profiling-lms\" && npm run dev"

echo Started backend and frontend in separate terminals.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000

