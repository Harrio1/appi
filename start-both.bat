@echo off
echo ===== ЗАПУСК API-СЕРВЕРА И REACT-ПРИЛОЖЕНИЯ =====

REM Переходим в корневую директорию проекта
cd /d C:\laragon\www\appi

REM Останавливаем уже запущенные процессы на портах 8000, 3003 и 3000
echo Проверяем и завершаем процессы на порту 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo Найден процесс %%a, использующий порт 8000. Завершение...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 >nul
)

echo Проверяем и завершаем процессы на порту 3003...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do (
    echo Найден процесс %%a, использующий порт 3003. Завершение...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 >nul
)

echo Проверяем и завершаем процессы на порту 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Найден процесс %%a, использующий порт 3000. Завершение...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 >nul
)

REM Запускаем API-сервер
echo Запуск API-сервера на порту 8000...
start "API Server" cmd /k "node server.mjs"

REM Даём серверу время на запуск
echo Ожидание запуска API-сервера...
timeout /t 3 >nul

REM Проверяем, что API-сервер запущен
curl -s http://127.0.0.1:8000/api/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ОШИБКА: API-сервер не запустился! Проверьте ошибки в консоли сервера.
    echo Убедитесь, что порт 8000 освобожден.
    goto :eof
)

echo API-сервер успешно запущен на 127.0.0.1:8000!

REM Тестируем соединение с API
echo Проверка соединения с API...
node map/test-api.js

REM Запускаем React-приложение
echo.
echo Запуск React-приложения на порту 3003...
cd map
set "REACT_APP_API_PORT=8000"

REM Запускаем приложение
echo Запуск React с использованием IPv4 для подключения к API...
npm run dev

echo =====  ПРОЦЕСС ЗАВЕРШЕН ===== 