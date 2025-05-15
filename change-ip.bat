@echo off
setlocal enabledelayedexpansion

echo ==============================================
echo        Изменение IP адреса в проектах
echo ==============================================
echo.

REM Получаем текущий IP адрес
FOR /F "tokens=4 delims= " %%i in ('route print ^| find " 0.0.0.0"') do (
   set CURRENT_IP=%%i
   goto :found_ip
)

:found_ip
echo Текущий IP адрес: %CURRENT_IP%
echo.

REM Запрашиваем новый IP адрес
set /p NEW_IP="Введите новый IP адрес (или нажмите Enter для использования %CURRENT_IP%): "

REM Если IP не введен, используем текущий
if "!NEW_IP!"=="" set NEW_IP=%CURRENT_IP%

echo.
echo Будет использоваться IP адрес: %NEW_IP%
echo.

set OLD_IP=192.168.58.253
echo Старый IP адрес: %OLD_IP%

REM Подтверждение перед продолжением
choice /C YN /M "Продолжить замену IP адреса во всех файлах конфигурации (Y/N)?"
if errorlevel 2 goto :end

echo.
echo Обновляем файлы конфигурации...
echo.

REM Изменение IP в файле package.json мобильного приложения
echo - Обновление mobile-app/package.json...
powershell -Command "(Get-Content 'mobile-app/package.json') -replace '%OLD_IP%', '%NEW_IP%' | Set-Content 'mobile-app/package.json'"

REM Изменение IP в bat и ps1 файлах мобильного приложения
echo - Обновление mobile-app/start-local.bat...
powershell -Command "(Get-Content 'mobile-app/start-local.bat') -replace '%OLD_IP%', '%NEW_IP%' | Set-Content 'mobile-app/start-local.bat'"

echo - Обновление mobile-app/start-port-3001.bat...
powershell -Command "(Get-Content 'mobile-app/start-port-3001.bat') -replace '%OLD_IP%', '%NEW_IP%' | Set-Content 'mobile-app/start-port-3001.bat'"

echo - Обновление mobile-app/start-ip.bat...
powershell -Command "(Get-Content 'mobile-app/start-ip.bat') -replace '%OLD_IP%', '%NEW_IP%' | Set-Content 'mobile-app/start-ip.bat'"

echo - Обновление mobile-app/start-localhost.ps1...
powershell -Command "(Get-Content 'mobile-app/start-localhost.ps1') -replace '%OLD_IP%', '%NEW_IP%' | Set-Content 'mobile-app/start-localhost.ps1'"

REM Изменение IP в файле package.json основного приложения
echo - Обновление map/package.json...
powershell -Command "(Get-Content 'map/package.json') -replace '%OLD_IP%', '%NEW_IP%' | Set-Content 'map/package.json'"

REM Изменение IP в server.js основного приложения
echo - Обновление map/server.js...
powershell -Command "(Get-Content 'map/server.js') -replace '%OLD_IP%', '%NEW_IP%' | Set-Content 'map/server.js'"

REM Изменение IP в start-both.bat
echo - Обновление start-both.bat...
powershell -Command "(Get-Content 'start-both.bat') -replace '%OLD_IP%', '%NEW_IP%' | Set-Content 'start-both.bat'"

echo.
echo ====================================
echo       Обновление завершено!
echo ====================================
echo.
echo Новый IP адрес %NEW_IP% установлен во всех файлах конфигурации.
echo.

REM Запрашиваем дополнительные действия
echo Выберите действие:
echo 1. Запустить мобильное приложение
echo 2. Запустить основное приложение
echo 3. Выйти
choice /C 123 /M "Ваш выбор: "

if errorlevel 3 goto :end
if errorlevel 2 goto :start_main
if errorlevel 1 goto :start_mobile

:start_mobile
echo.
echo Запуск мобильного приложения...
cd mobile-app
call start-local.bat
goto :end

:start_main
echo.
echo Запуск основного приложения...
cd map
call npm start
goto :end

:end
echo.
echo Работа завершена.
echo.
pause 