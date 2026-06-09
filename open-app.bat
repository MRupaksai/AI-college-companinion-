@echo off
cd /d "%~dp0"
echo Opening AI College Companion...
start "" "https://mrupaksai.github.io/AI-college-companinion-/"
start "" "%~dp0index.html"
echo.
echo For local dev run: npm run dev
pause
