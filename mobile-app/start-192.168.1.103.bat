@echo off
echo Запуск мобильного приложения на IP 192.168.1.103:3000
SET HOST=192.168.1.103
SET PORT=3000
cd "C:\laragon\www\appi\mobile-app"
npm start
pause
