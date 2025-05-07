# Clear HOST environment variable
Remove-Item Env:HOST -ErrorAction SilentlyContinue

# Set to localhost
$env:HOST = "localhost"
$env:PORT = "3000"

Write-Host "Starting app on $env:HOST`:$env:PORT"
npm start 