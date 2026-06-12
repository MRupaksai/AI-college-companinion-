@echo off
cd /d "%~dp0"
echo Opening AI College Companion...
start "" "https://mrupaksai.github.io/AI-college-companinion-/"
start "" "%~dp0launcher.html"
echo.
echo For local dev run: pnpm dev
pause
