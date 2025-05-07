@echo off
echo ===== ЗАПУСК МОБИЛЬНОГО ПРИЛОЖЕНИЯ НА ПОРТУ 3001 =====

echo Останавливаем процессы на порту 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Найден процесс с PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 >nul
)

echo.
echo Запуск мобильного приложения на порту 3001...
set "HOST=localhost"
set "PORT=3001"
set "REACT_APP_API_PORT=8000"

cross-env HOST=localhost PORT=3001 react-scripts start

echo.
echo ===== ПРИЛОЖЕНИЕ ЗАПУЩЕНО ===== 