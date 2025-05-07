@echo off
echo Запуск сервера на localhost:8000

REM Проверяем, занят ли порт 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr 0.0.0.0:8000') do (
    echo Порт 8000 уже используется процессом с PID: %%a
    echo Завершение процесса...
    taskkill /F /PID %%a
    if %ERRORLEVEL% EQU 0 (
        echo Процесс успешно завершен.
    ) else (
        echo Не удалось завершить процесс, возможно, требуются права администратора.
    )
    timeout /t 2
)

echo Запуск сервера...
node server.mjs 