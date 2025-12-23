@echo off
setlocal

REM Set VS Code installation path, modify according to your actual path
set "VSC_PATH=C:\Program Files\Microsoft VS Code\Code.exe"

REM Get current directory
set "CURRENT_DIR=%CD%"

REM Check if VS Code is installed
if not exist "%VSC_PATH%" (
    echo VS Code is not installed or the path is incorrect
    echo Please modify the VSC_PATH in the script to the correct installation path
    pause
    exit /b 1
)

REM Start VS Code and open current directory
start "" "%VSC_PATH%" "%CURRENT_DIR%"

endlocal
