@echo off
setlocal enabledelayedexpansion

echo ==============================================
echo        Запуск сервера и мобильного приложения
echo ==============================================
echo.

set "IP_ADDRESS=192.168.58.253"
set "SERVER_PORT=3003"
set "MOBILE_PORT=3000"

echo IP адрес: %IP_ADDRESS%
echo Порт сервера: %SERVER_PORT%
echo Порт мобильного приложения: %MOBILE_PORT%
echo.

echo Проверка доступности портов...
netstat -an | findstr ":%SERVER_PORT% "
if %errorlevel% equ 0 (
    echo Порт %SERVER_PORT% уже используется. Пожалуйста, закройте приложение, использующее этот порт.
    choice /C YN /M "Продолжить запуск (Y/N)?"
    if errorlevel 2 goto :end
)

netstat -an | findstr ":%MOBILE_PORT% "
if %errorlevel% equ 0 (
    echo Порт %MOBILE_PORT% уже используется. Пожалуйста, закройте приложение, использующее этот порт.
    choice /C YN /M "Продолжить запуск (Y/N)?"
    if errorlevel 2 goto :end
)

echo.
echo Запуск сервера на %IP_ADDRESS%:%SERVER_PORT%...

start "API Server" cmd /c "cd map && cross-env HOST=%IP_ADDRESS% PORT=%SERVER_PORT% node server.js"

echo.
echo Сервер запущен! Ожидаем 5 секунд для инициализации...
timeout /t 5 /nobreak > nul

echo.
echo Запуск мобильного приложения на %IP_ADDRESS%:%MOBILE_PORT%...

start "Mobile App" cmd /c "cd mobile-app && cross-env HOST=%IP_ADDRESS% PORT=%MOBILE_PORT% npm start"

echo.
echo ==============================================
echo  Сервер и мобильное приложение запущены!
echo ==============================================
echo.
echo Сервер доступен по адресу: http://%IP_ADDRESS%:%SERVER_PORT%
echo Мобильное приложение доступно по адресу: http://%IP_ADDRESS%:%MOBILE_PORT%
echo.
echo Нажмите любую клавишу для выхода из этого окна (это НЕ остановит приложения)...
pause > nul

:end
endlocal 