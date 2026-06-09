@echo off
cd /d "%~dp0"
echo Starting AI College Companion...
start "" "http://localhost:3000"
start "" "%~dp0index.html"
npm run dev
