# Запуск мобильного приложения на IP 192.168.58.253:3000
Write-Host "Запуск мобильного приложения на IP 192.168.58.253:3000" -ForegroundColor Green
$env:HOST="192.168.58.253"
$env:PORT="3000"
Set-Location "C:\\laragon\\www\\appi\\mobile-app"
npm start
