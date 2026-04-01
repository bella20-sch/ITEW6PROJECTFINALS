@echo off
setlocal
cd /d "%~dp0"

echo [1/4] Installing frontend dependencies...
cd /d "%~dp0student-profiling-lms"
call npm install
if errorlevel 1 goto :err

echo [2/4] Installing backend dependencies...
cd /d "%~dp0student-profiling-api"
call composer install
if errorlevel 1 goto :err

echo [3/4] Running migrations...
call php artisan migrate
if errorlevel 1 goto :err

echo [4/4] Seeding data...
call php artisan db:seed
if errorlevel 1 goto :err

echo.
echo Setup complete.
echo Next: run start-dev.bat
exit /b 0

:err
echo.
echo Setup failed. Check the error above.
exit /b 1

