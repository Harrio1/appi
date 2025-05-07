@echo off
echo Clearing HOST environment variable and starting app...

REM Clear the HOST environment variable 
SET "HOST="

REM Set to localhost explicitly
SET "HOST=localhost"
SET "PORT=3000"

echo Starting app on %HOST%:%PORT%
cd %~dp0
npm start 