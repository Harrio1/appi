@echo off
echo ===== ПЕРЕЗАПУСК СЕРВЕРА И ПРИЛОЖЕНИЯ =====

echo Останавливаем процессы на порту 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo Найден процесс с PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Останавливаем процессы на порту 3003...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do (
    echo Найден процесс с PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Останавливаем процессы на порту 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Найден процесс с PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Запуск API сервера...
start "API Server" cmd /k "node server.mjs"

echo Ожидание запуска сервера...
timeout /t 3 >nul

echo Проверка доступности API...
curl -v http://127.0.0.1:8000/api/health

echo.
echo Запуск React приложения...
cd map
start "React App" cmd /k "npm run dev"

echo.
echo ===== ПЕРЕЗАПУСК ЗАВЕРШЕН ===== 