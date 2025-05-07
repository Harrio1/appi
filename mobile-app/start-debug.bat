@echo off
TITLE Mobile App Debug Mode
COLOR 0A

echo -----------------------------------------------------
echo    Запуск мобильного приложения в режиме отладки
echo -----------------------------------------------------
echo.

REM Устанавливаем переменную среды для режима отладки
set REACT_APP_DEBUG_MODE=true

REM Определяем IP адрес
FOR /F "tokens=4 delims= " %%i in ('route print ^| find " 0.0.0.0"') do (
   set IP=%%i
   goto :found_ip
)

:found_ip
echo IP адрес: %IP%

REM Запуск приложения на IP адресе компьютера
echo Запуск сервера разработки на порту 3000...
echo Доступно по адресу: http://%IP%:3000
echo Отладочная страница: http://%IP%:3000/debug.html
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.

npm start 