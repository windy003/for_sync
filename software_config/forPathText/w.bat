@echo off
setlocal

REM Get current directory
set "CURRENT_DIR=%CD%"

REM Start Windows Terminal with WSL profile
wt -d "%CURRENT_DIR%" wsl.exe 

endlocal