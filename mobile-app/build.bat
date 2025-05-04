@echo off
echo ==============================================
echo     Сборка мобильного приложения АгроМоб
echo ==============================================
echo.

cd %~dp0
echo Установка пакетов...
call npm install

echo.
echo Сборка приложения для продакшена...
echo.
call npm run build

echo.
echo Сборка завершена! Проверьте папку build.
echo.

pause 