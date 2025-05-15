# Clear HOST environment variable
Remove-Item Env:HOST -ErrorAction SilentlyContinue

# Set to new IP address
$env:HOST = "192.168.58.253"
$env:PORT = "3000"

Write-Host "Starting app on $env:HOST`:$env:PORT"
npm start 