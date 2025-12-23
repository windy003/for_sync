@echo off
setlocal

REM Set Cursor installation path, modify according to your actual path
@REM set "CURSOR_PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Cursor\Cursor.exe"
set "CURSOR_PATH=C:\Program Files\cursor\Cursor.exe"

REM Get current directory
set "CURRENT_DIR=%CD%"

REM Check if Cursor is installed
if not exist "%CURSOR_PATH%" (
    echo Cursor is not installed or the path is incorrect
    echo Please modify the CURSOR_PATH in the script to the correct installation path
    pause
    exit /b 1
)

REM Start Cursor and open current directory
start "" "%CURSOR_PATH%" "%CURRENT_DIR%"

endlocal
