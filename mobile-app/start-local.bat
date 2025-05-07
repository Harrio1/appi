@echo off
echo Запуск мобильного приложения на localhost

SET HOST=localhost
SET PORT=3000

REM Проверка API сервера перед запуском
echo Проверка API сервера на http://localhost:8000/api...
curl -s -o nul -w "%%{http_code}" http://localhost:8000/api > temp.txt
set /p STATUS=<temp.txt
del temp.txt

if "%STATUS%"=="000" (
    echo ВНИМАНИЕ: API сервер не запущен на http://localhost:8000/api
    echo Многие функции приложения не будут работать.
    echo Запустите API сервер перед использованием мобильного приложения.
    echo.
    choice /C YN /M "Продолжить запуск без API сервера (Y/N)?"
    if errorlevel 2 goto end
)

echo Запуск приложения на %HOST%:%PORT%
npm start

:end 