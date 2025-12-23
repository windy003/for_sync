@echo off
setlocal

REM Set PowerShell installation path
set "POWERSHELL_PATH=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

REM Get current directory
set "CURRENT_DIR=%CD%"

REM Check if PowerShell exists
if not exist "%POWERSHELL_PATH%" (
    echo PowerShell is not found at the expected location
    pause
    exit /b 1
)

REM Start PowerShell and set working directory
start "" "%POWERSHELL_PATH%" -NoExit -Command "Set-Location -Path '%CURRENT_DIR%'"

endlocal 